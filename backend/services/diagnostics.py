def calculate_metrics(mean_red_circle: float, mean_red_rect: float, length_bbox: float):
    """
    Calculates HCT and PTINR from the three image-extracted variables.

    Formula source: MATLAB calibration model.

    HCT (Haematocrit, %)
        Derived from the R-channel intensity of the reference circle (the
        blood-sample well).  More haemoglobin → deeper red → lower R mean
        (signal is inverted in the linear fit):
            HCT = -1.263 × mean_red_circle + 253.72

    PTINR (Prothrombin Time – International Normalised Ratio)
        A multivariate linear model that uses:
            • HCT          – corrects for haematocrit effect on clot colour
            • mean_red_rect – colour intensity in the migration strip
            • length_bbox   – how far blood migrated (clotting speed proxy)

        Note: mean_red_circle fed into this function must already have the
        JPEG bias correction applied (done in image_utils.process_assay_image).
    """
    hct = -1.263 * mean_red_circle + 253.72

    ptinr = (
        6.72858003159145
        - 0.0351556420452067  * hct
        - 0.0366191668483321  * mean_red_rect
        + 0.00999359566867459 * length_bbox
    )

    return hct, ptinr


def generate_diagnosis(
    hct: float,
    ptinr: float,
    gender: str,
    on_warfarin: str,
    mech_mitral_valve: str,
):
    """
    Replicates the MATLAB nested if/else statements for clinical text diagnosis.

    Parameters
    ----------
    hct              Haematocrit percentage.
    ptinr            PT-INR value.
    gender           'M' or 'F' (case-insensitive).
    on_warfarin      'Y' or 'N' – whether the patient is on warfarin.
    mech_mitral_valve 'Y' or 'N' – whether the patient has a mechanical mitral valve.

    Returns
    -------
    hct_diag   : str  – HCT interpretation string.
    pt_diag    : str  – PTINR interpretation string.
    """
    gender            = gender.upper()
    on_warfarin       = on_warfarin.upper()
    mech_mitral_valve = mech_mitral_valve.upper()

    # ── HCT diagnosis (normal ranges differ by sex) ──────────────────────────
    if gender == 'F':
        if 36 <= hct <= 48:
            hct_diag = 'HCT is Normal'
        elif hct < 36:
            hct_diag = 'HCT is Low'
        else:
            hct_diag = 'HCT is High'
    else:                              # default: Male
        if 41 <= hct <= 50:
            hct_diag = 'HCT is Normal'
        elif hct < 41:
            hct_diag = 'HCT is Low'
        else:
            hct_diag = 'HCT is High'

    # ── PTINR diagnosis (therapeutic target depends on indication) ───────────
    if on_warfarin == 'Y':
        if mech_mitral_valve == 'N':
            # Standard anticoagulation target: 2.0–3.0
            if 2 <= ptinr < 3:
                pt_diag = 'Normal'
            elif ptinr < 2:
                pt_diag = 'Abnormal with Thrombotic Tendency'
            else:
                pt_diag = 'Abnormal with Hemorrhagic Tendency'
        else:
            # Mechanical mitral valve: higher target 2.5–3.5
            if 2.5 <= ptinr < 3.5:
                pt_diag = 'Normal'
            elif ptinr < 2.5:
                pt_diag = 'Abnormal with Thrombotic Tendency'
            else:
                pt_diag = 'Abnormal with Hemorrhagic Tendency'
    else:
        # Not on warfarin: normal range 0.8–1.1
        if 0.8 <= ptinr <= 1.1:
            pt_diag = 'Normal'
        elif ptinr < 0.8:
            pt_diag = 'Abnormal with Thrombotic Tendency'
        else:
            pt_diag = 'Abnormal'

    return hct_diag, pt_diag