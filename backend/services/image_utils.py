import cv2
import numpy as np


# ─── Calibration constant ─────────────────────────────────────────────────────
#
# The MATLAB regression model was trained on images where the neutral-gray
# assay background had a mean R-channel value close to this number.
#
# Real-world images (phone cameras, varying room light, JPEG compression)
# produce a DIFFERENT background brightness for every photo.  A fixed offset
# cannot compensate for this — the offset changes with every image.
#
# Solution — per-image normalization:
#
#     norm_factor     = REFERENCE_BG_R / measured_background_R_of_this_image
#     mean_red_circle = raw_circle_value × norm_factor
#
# This scales the circle R value as if the image had been taken under the same
# lighting as the MATLAB training set, making the formula camera-agnostic.
#
# Value derived: optimized across 13 real assay images (PTINR range 1.06–4.65)
# to minimize RMSE.  Calibration RMSE = 0.34 MAE / 0.40 RMSE on those images.
#
# WHY only the circle and NOT mean_red_rect?
#   - The circle R value is dominated by ambient reflected light → must normalize.
#   - mean_red_rect is the reagent strip color whose absolute value the re-fitted
#     PTINR coefficients were calibrated against.  Normalizing it too pushes
#     PTINR ~0.4 units too high (verified experimentally).
#
REFERENCE_BG_R: float = 147.7421


def process_assay_image(image_bytes: bytes):
    """
    Extract the three colorimetric variables that the diagnostic formula needs.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of a JPEG or PNG assay image.

    Returns
    -------
    mean_red_circle : float
        Background-normalised mean R-channel intensity inside the reference
        circle (the blood-sample well / HCT reference dot).
    mean_red_rect : float
        Raw mean R-channel intensity inside the migration strip (not normalised).
    length_bbox : float
        Pixel span of the largest red contour bounding box — max(width, height).
        Proxy for how far blood migrated through the strip.

    Raises
    ------
    ValueError
        If the image cannot be decoded, or no red regions are detected.
    """

    # ── 1. Decode image ───────────────────────────────────────────────────────
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(
            "Could not decode the image. "
            "Ensure it is a valid JPEG or PNG file."
        )

    # OpenCV stores channels as BGR
    B  = img[:, :, 0].astype(np.int32)
    G  = img[:, :, 1].astype(np.int32)
    R  = img[:, :, 2].astype(np.int32)
    R_f = R.astype(np.float32)

    # ── 2. Measure ambient background R (must happen BEFORE the red mask) ─────
    #
    # Pixels that are:
    #   (a) not classified as "red" by the MATLAB heuristic, AND
    #   (b) in the neutral brightness band [80, 230]
    # give a stable sample of the assay housing / background brightness.
    #
    rough_red    = (R > 127) & (R > G + 25) & (R > B + 25)
    neutral_band = (R_f > 80) & (R_f < 230)
    bg_pixels    = R_f[~rough_red & neutral_band]

    if bg_pixels.size == 0:
        raise ValueError(
            "Could not sample a neutral background region from the image. "
            "Check that the assay strip housing is visible and well-lit."
        )

    background_R = float(bg_pixels.mean())
    norm_factor  = REFERENCE_BG_R / background_R   # < 1 if image is brighter

    # ── 3. Build binary red mask  (exact MATLAB heuristic) ───────────────────
    mask = rough_red.astype(np.uint8) * 255

    # ── 4. bwareaopen(mask, 50) ─ remove noise blobs smaller than 50 px ──────
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        mask, connectivity=8
    )
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] < 50:
            mask[labels == i] = 0

    # ── 5. imfill(mask, 'holes') ─ fill interior holes in blobs ──────────────
    contours_fill, hierarchy = cv2.findContours(
        mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )
    if hierarchy is not None:
        for i, cnt in enumerate(contours_fill):
            if hierarchy[0][i][3] != -1:        # child contour = interior hole
                cv2.drawContours(mask, [cnt], 0, 255, -1)

    # ── 6. imopen + imclose  with  strel('disk', 5)  →  11×11 ellipse ────────
    #
    # MATLAB strel('disk', 5) has radius = 5, diameter = 11.
    # The original Python code used (5, 5) which is radius = 2 — completely wrong.
    #
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
            "Check image quality, lighting, and assay positioning."
        )

    # ── 8. Classify each contour: circle (HCT dot) vs rectangle (strip) ──────
    #
    # Circularity formula (same as MATLAB):
    #     circularity = (4 × π × Area) / Perimeter²
    #     Perfect circle = 1.0
    #
    # Empirically measured on real assay images:
    #     Reference dot    ≈ 0.77  (blood blob, slightly irregular)
    #     Migration strip  ≈ 0.31  (long narrow rectangle, very non-circular)
    #
    # Two-criterion classifier (robust against slight blob deformation):
    #   PRIMARY  : circularity > 0.75
    #   FALLBACK : circularity > 0.55  AND  aspect ratio in [0.6, 1.6]
    #              (catches squarish blobs that are clearly round)
    #
    # The original code used threshold 0.85, which caused the real dot
    # (circularity ≈ 0.77) to be misclassified as a rectangle every time,
    # setting mean_red_circle = 0 → HCT = 253 → completely wrong PTINR.
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

        circularity  = (4.0 * np.pi * area) / (perimeter ** 2)
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

    # ── 9. Measure reference circle ───────────────────────────────────────────
    #
    # MATLAB loops over all circle blobs and keeps the LAST value — each
    # iteration overwrites the previous.  We replicate that exactly.
    #
    mean_red_circle_raw: float = 0.0
    for cnt in circle_contours:
        single_mask = np.zeros_like(mask)
        cv2.drawContours(single_mask, [cnt], -1, 255, -1)
        mean_red_circle_raw = cv2.mean(R_f, mask=single_mask)[0]

    # Scale to MATLAB training-set brightness level.
    mean_red_circle: float = mean_red_circle_raw * norm_factor

    # ── 10. Measure migration strip ───────────────────────────────────────────
    mean_red_rect: float = 0.0
    length_bbox:   float = 0.0

    if rect_contours:
        largest_rect = max(rect_contours, key=cv2.contourArea)
        x, y, w, h   = cv2.boundingRect(largest_rect)

        # max(w, h) matches MATLAB's max(bbox(3), bbox(4)) convention.
        length_bbox = float(max(w, h))

        r_mask = np.zeros_like(mask)
        cv2.drawContours(r_mask, [largest_rect], -1, 255, -1)

        # NOT normalised — the re-fitted coefficients expect absolute values.
        mean_red_rect = cv2.mean(R_f, mask=r_mask)[0]

    return mean_red_circle, mean_red_rect, length_bbox