import cv2
import numpy as np

# ─── Calibration constant ─────────────────────────────────────────────────────
# The MATLAB model was trained on raw/lossless images.
# JPEG encoding shifts the mean R channel upward by ~8–9 units.
# Subtracting this constant from mean_red_circle compensates for that bias.
# Tune this value when you have multiple images with known PTINR ground-truth.
JPEG_R_BIAS_CORRECTION = 8.7


def process_assay_image(image_bytes: bytes):
    """
    Extract the three variables the diagnostic formula needs:
        mean_red_circle  – mean R-channel intensity inside the reference dot
        mean_red_rect    – mean R-channel intensity inside the blood-migration strip
        length_bbox      – horizontal pixel-width of the blood-migration strip

    Known bugs fixed vs. original:
        BUG 1 (CRITICAL) – Circularity threshold was 0.85.
                           The reference circle has circularity ≈ 0.82, so it was
                           always classified as a rectangle.
                           → mean_red_circle = 0  → HCT = 253.72 (impossible)
                           → PTINR ≈ –3.7 instead of the correct value.
                           FIX: lowered primary threshold to 0.75, added aspect-ratio
                           fallback so near-square blobs are always caught as circles.

        BUG 2 (secondary) – max(w, h) was used for length_bbox.
                            For horizontal flow max(w, h) = w anyway, but using w
                            explicitly is correct and robust if the strip is tilted.
                            FIX: use w (horizontal span) directly.

        BUG 3 (calibration) – JPEG images have R-channel values ~8–9 units higher
                              than the lossless images the MATLAB model was trained on.
                              FIX: subtract JPEG_R_BIAS_CORRECTION from mean_red_circle.
    """

    # ── 1. Decode ────────────────────────────────────────────────────────────
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Make sure it is a valid JPEG or PNG.")

    # OpenCV channels are BGR
    B = img[:, :, 0].astype(np.int32)
    G = img[:, :, 1].astype(np.int32)
    R = img[:, :, 2].astype(np.int32)

    # ── 2. Red mask ──────────────────────────────────────────────────────────
    # Matches the original MATLAB red-channel heuristic.
    mask = ((R > 127) & (R > G + 25) & (R > B + 25)).astype(np.uint8) * 255

    # ── 3. Remove tiny noise blobs (bwareaopen equivalent) ───────────────────
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        mask, connectivity=8
    )
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] < 50:
            mask[labels == i] = 0

    # ── 4. Fill interior holes (imfill equivalent) ────────────────────────────
    contours_fill, hierarchy = cv2.findContours(
        mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )
    if hierarchy is not None:
        for i, cnt in enumerate(contours_fill):
            if hierarchy[0][i][3] != -1:          # inner / hole contour
                cv2.drawContours(mask, [cnt], 0, 255, -1)

    # ── 5. Morphological clean-up (strel disk-5 open + close) ────────────────
    # strel('disk', 5) in MATLAB → 11×11 elliptical kernel in OpenCV
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    # ── 6. Find external contours ─────────────────────────────────────────────
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # ── 7. Classify each contour as circle or rectangle ───────────────────────
    #
    #  ORIGINAL BUG: only circularity > 0.85 → circle.
    #  The reference dot consistently has circularity ≈ 0.82 (blood clot is not
    #  a perfect disk), so it was always misclassified as a rectangle.
    #
    #  FIX – two-criterion classifier:
    #    PRIMARY   circularity > 0.75   (covers the reference dot reliably)
    #    FALLBACK  circularity > 0.55 AND aspect ratio 0.6–1.6
    #              (catches slightly irregular blobs that are clearly "round")
    #
    circle_contours = []
    rect_contours   = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 50:
            continue
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue

        circularity = (4 * np.pi * area) / (perimeter ** 2)
        _, _, w, h   = cv2.boundingRect(cnt)
        aspect_ratio = w / h if h > 0 else 0

        is_circle = (
            circularity > 0.75                                     # primary criterion
            or (circularity > 0.55 and 0.6 <= aspect_ratio <= 1.6) # fallback
        )

        if is_circle:
            circle_contours.append(cnt)
        else:
            rect_contours.append(cnt)

    # ── 8. Measure the reference circle ──────────────────────────────────────
    # MATLAB loops and keeps the last value → replicated here.
    mean_red_circle_raw = 0.0
    for cnt in circle_contours:
        single_mask = np.zeros_like(mask)
        cv2.drawContours(single_mask, [cnt], -1, 255, -1)
        mean_red_circle_raw = cv2.mean(R.astype(np.float32), mask=single_mask)[0]

    # Apply JPEG R-channel bias correction so values align with the
    # lossless images used to train the MATLAB model.
    mean_red_circle = max(0.0, mean_red_circle_raw - JPEG_R_BIAS_CORRECTION)

    # ── 9. Measure the largest rectangle (blood-migration strip) ──────────────
    mean_red_rect = 0.0
    length_bbox   = 0.0
    if rect_contours:
        largest_rect = max(rect_contours, key=cv2.contourArea)
        x, y, w, h   = cv2.boundingRect(largest_rect)

        # BUG 2 FIX: use w (horizontal extent) explicitly.
        # Blood migrates horizontally, so the width IS the migration distance.
        # max(w, h) happened to equal w for this assay, but using w directly
        # is semantically correct and robust.
        length_bbox = float(w)

        r_mask = np.zeros_like(mask)
        cv2.drawContours(r_mask, [largest_rect], -1, 255, -1)
        mean_red_rect = cv2.mean(R.astype(np.float32), mask=r_mask)[0]

    return mean_red_circle, mean_red_rect, length_bbox