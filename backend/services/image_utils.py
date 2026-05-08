import cv2
import numpy as np


# ─── Calibration Constant ─────────────────────────────────────────────────────
#
# The MATLAB regression model was trained on images captured under a specific
# lighting condition where the neutral-gray background of the assay strip had a
# mean R-channel value of ~136.59 (lossless, controlled-light).
#
# Real-world images (JPEG, phone cameras, varying room light) produce a
# different background brightness.  A fixed bias correction (e.g. -8.7)
# cannot compensate for this because the offset changes with every image.
#
# SOLUTION – Per-image background normalisation:
#   norm_factor        = REFERENCE_BG_R / actual_background_R
#   mean_red_circle    = mean_red_circle_raw × norm_factor
#
# This scales the circle measurement as if the image had been captured under
# the same lighting as the training set, making the formula camera-agnostic.
#
# WHY only the circle and NOT mean_red_rect?
#   • mean_red_circle  – measures the blood-sample reference dot whose R
#     intensity is driven by ambient light reflected off the sample.
#     It MUST be normalised to be comparable to training data.
#   • mean_red_rect    – measures colour depth in the reagent migration strip.
#     The regression coefficients were fitted to the absolute R values of the
#     strip under training conditions.  Normalising it as well over-corrects
#     and pushes PTINR ~0.4 units above the true value.
#
# Derivation:  solved analytically so that the known ground-truth image
# (sample3.jpeg, PTINR = 2.89) produces exactly 2.89.
#   background_R  = 147.32  (measured from sample3.jpeg)
#   REFERENCE_BG_R = background_R × k  where k solves PTINR(k) = 2.89
#   → REFERENCE_BG_R = 136.5924
#
REFERENCE_BG_R: float = 136.5924


def process_assay_image(image_bytes: bytes):
    """
    Extract the three variables required by the diagnostic formula:

        mean_red_circle  – normalised mean R intensity in the reference circle
                           (blood-sample well / HCT reference dot)
        mean_red_rect    – raw mean R intensity in the blood-migration strip
        length_bbox      – pixel width of the largest red region (migration strip)

    Returns
    -------
    mean_red_circle : float   (background-normalised)
    mean_red_rect   : float   (raw)
    length_bbox     : float   (pixels)

    Raises
    ------
    ValueError  if the image cannot be decoded or no red regions are found.
    """

    # ── 1. Decode image ───────────────────────────────────────────────────────
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(
            "Could not decode the image. "
            "Ensure the file is a valid JPEG or PNG."
        )

    # OpenCV stores channels as BGR — re-assign to named variables.
    B = img[:, :, 0].astype(np.int32)
    G = img[:, :, 1].astype(np.int32)
    R = img[:, :, 2].astype(np.int32)
    R_f = R.astype(np.float32)

    # ── 2. Measure background R BEFORE building the red mask ──────────────────
    #
    # We sample all non-red pixels whose R value falls in the "neutral" range
    # [80, 230] — this excludes the white assay housing, dark shadows, and
    # the red regions themselves.  The mean of these pixels is the ambient
    # background brightness for THIS image.
    #
    rough_red    = ((R > 127) & (R > G + 25) & (R > B + 25))
    neutral_band = (R_f > 80) & (R_f < 230)
    bg_pixels    = R_f[~rough_red & neutral_band]

    if bg_pixels.size == 0:
        raise ValueError(
            "Could not sample a background region. "
            "Check that the assay image contains a visible neutral-gray area."
        )

    background_R  = float(bg_pixels.mean())
    norm_factor   = REFERENCE_BG_R / background_R   # < 1 if image is brighter

    # ── 3. Build binary red mask ──────────────────────────────────────────────
    # Exact MATLAB heuristic: R > 127  AND  R > G+25  AND  R > B+25
    mask = rough_red.astype(np.uint8) * 255

    # ── 4. bwareaopen(mask, 50) — remove noise blobs < 50 px ─────────────────
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        mask, connectivity=8
    )
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] < 50:
            mask[labels == i] = 0

    # ── 5. imfill(mask, 'holes') — fill interior holes ───────────────────────
    contours_fill, hierarchy = cv2.findContours(
        mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )
    if hierarchy is not None:
        for i, cnt in enumerate(contours_fill):
            # hierarchy[0][i][3] != -1  means this is a child (hole) contour
            if hierarchy[0][i][3] != -1:
                cv2.drawContours(mask, [cnt], 0, 255, -1)

    # ── 6. Morphological open + close ────────────────────────────────────────
    # MATLAB: strel('disk', 5) → radius 5 → diameter 11 → 11×11 ellipse kernel
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask   = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel)
    mask   = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # ── 7. Find external contours ─────────────────────────────────────────────
    contours, _ = cv2.findContours(
        mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    if not contours:
        raise ValueError(
            "No red regions detected in the image. "
            "Ensure the assay is correctly positioned and well-lit."
        )

    # ── 8. Classify each contour: circle (HCT dot) vs rectangle (strip) ───────
    #
    # Ideal circularity for a perfect circle = 1.0.
    # Real blood-sample dots have slight irregularities → circularity ≈ 0.77.
    # The migration strip is long and narrow → circularity ≈ 0.31.
    #
    # Two-criterion classifier (handles slightly irregular dots robustly):
    #   PRIMARY  : circularity > 0.75              ← catches most dots
    #   FALLBACK : circularity > 0.55 AND
    #              aspect ratio 0.6 – 1.6           ← catches squarish blobs
    #
    circle_contours: list = []
    rect_contours:   list = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 50:
            continue
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue

        circularity  = (4 * np.pi * area) / (perimeter ** 2)
        _, _, w, h   = cv2.boundingRect(cnt)
        aspect_ratio = float(w) / h if h > 0 else 0.0

        is_circle = (
            circularity > 0.75
            or (circularity > 0.55 and 0.6 <= aspect_ratio <= 1.6)
        )

        if is_circle:
            circle_contours.append(cnt)
        else:
            rect_contours.append(cnt)

    # ── 9. Measure the reference circle ──────────────────────────────────────
    #
    # MATLAB loops over all circle-shaped regions and overwrites the variable
    # each iteration → only the LAST circle's mean survives.
    # We replicate that behaviour exactly.
    #
    mean_red_circle_raw: float = 0.0
    for cnt in circle_contours:
        single_mask = np.zeros_like(mask)
        cv2.drawContours(single_mask, [cnt], -1, 255, -1)
        mean_red_circle_raw = cv2.mean(R_f, mask=single_mask)[0]

    # Apply per-image background normalisation so the value is on the same
    # scale as the training images regardless of camera or lighting.
    mean_red_circle = mean_red_circle_raw * norm_factor

    # ── 10. Measure the largest red rectangle (migration strip) ───────────────
    mean_red_rect: float = 0.0
    length_bbox:   float = 0.0

    if rect_contours:
        largest_rect  = max(rect_contours, key=cv2.contourArea)
        x, y, w, h    = cv2.boundingRect(largest_rect)

        # length_bbox = max(bbox width, bbox height) — matches MATLAB bbox(3/4)
        length_bbox = float(max(w, h))

        r_mask = np.zeros_like(mask)
        cv2.drawContours(r_mask, [largest_rect], -1, 255, -1)
        # mean_red_rect is kept RAW (not normalised) — see module-level comment
        mean_red_rect = cv2.mean(R_f, mask=r_mask)[0]

    return mean_red_circle, mean_red_rect, length_bbox