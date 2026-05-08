"""
diagnostics.py
--------------
Computes HCT and PTINR from the three image-extracted variables, then maps
the numeric values to clinical interpretation strings.

Formula source
--------------
Both formulas are empirical linear regressions fitted in MATLAB to
colorimetric measurements from a lateral-flow PT/INR assay device.

HCT formula
-----------
    HCT (%) = -1.263 × mean_red_circle + 253.72

    Interpretation:
        More haemoglobin → darker / deeper red → lower R channel intensity.
        The relationship is therefore INVERSE (negative slope).
        mean_red_circle is already background-normalised before it reaches
        this function (see image_utils.py), making the result lighting-
        independent.

PTINR formula
-------------
    PTINR = 6.72858003159145
            − 0.0351556420452067  × HCT
            − 0.0366191668483321  × mean_red_rect
            + 0.00999359566867459 × length_bbox

    Term meanings:
        HCT           – haematocrit effect on clot colour (cross-correction)
        mean_red_rect – colour intensity in the migration strip (reagent line)
        length_bbox   – how far blood migrated (proxy for clotting speed)

Clinical reference ranges used for diagnosis
--------------------------------------------
HCT (sex-specific, WHO / ICSH):
    Female: 36 – 48 %
    Male:   41 – 50 %

PTINR (indication-specific):
    Not on warfarin                    → 0.8 – 1.1  (normal haemostasis)
    On warfarin, no mech. mitral valve → 2.0 – 3.0  (standard anticoagulation)
    On warfarin + mech. mitral valve   → 2.5 – 3.5  (higher target, BHS/AHA)
"""


def calculate_metrics(
    mean_red_circle: float,
    mean_red_rect: float,
    length_bbox: float,
) -> tuple[float, float]:
    """
    Compute HCT and PTINR from colorimetric image variables.

    Parameters
    ----------
    mean_red_circle : float
        Background-normalised mean R-channel intensity of the reference circle.
    mean_red_rect : float
        Raw mean R-channel intensity of the migration strip.
    length_bbox : float
        Pixel width/height (max) of the migration strip bounding box.

    Returns
    -------
    hct   : float  – haematocrit percentage
    ptinr : float  – PT-INR value
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
) -> tuple[str, str]:
    """
    Map numeric HCT and PTINR values to clinical interpretation strings.

    Parameters
    ----------
    hct               : float  – haematocrit percentage
    ptinr             : float  – PT-INR value
    gender            : str    – 'M' or 'F' (case-insensitive)
    on_warfarin       : str    – 'Y' or 'N'
    mech_mitral_valve : str    – 'Y' or 'N'

    Returns
    -------
    hct_diag  : str  – HCT interpretation
    pt_diag   : str  – PTINR interpretation
    """
    gender            = gender.strip().upper()
    on_warfarin       = on_warfarin.strip().upper()
    mech_mitral_valve = mech_mitral_valve.strip().upper()

    # ── HCT diagnosis (WHO / ICSH sex-specific normal ranges) ────────────────
    if gender == "F":
        if 36 <= hct <= 48:
            hct_diag = "HCT is Normal"
        elif hct < 36:
            hct_diag = "HCT is Low"
        else:
            hct_diag = "HCT is High"
    else:  # Male (default)
        if 41 <= hct <= 50:
            hct_diag = "HCT is Normal"
        elif hct < 41:
            hct_diag = "HCT is Low"
        else:
            hct_diag = "HCT is High"

    # ── PTINR diagnosis (indication-specific therapeutic ranges) ─────────────
    if on_warfarin == "Y":
        if mech_mitral_valve == "N":
            # Standard anticoagulation target: 2.0 – 3.0  (BHS / ESC)
            if 2.0 <= ptinr < 3.0:
                pt_diag = "Normal"
            elif ptinr < 2.0:
                pt_diag = "Abnormal with Thrombotic Tendency"
            else:
                pt_diag = "Abnormal with Hemorrhagic Tendency"
        else:
            # Mechanical mitral valve: higher target 2.5 – 3.5  (AHA / BHS)
            if 2.5 <= ptinr < 3.5:
                pt_diag = "Normal"
            elif ptinr < 2.5:
                pt_diag = "Abnormal with Thrombotic Tendency"
            else:
                pt_diag = "Abnormal with Hemorrhagic Tendency"
    else:
        # Not on warfarin: normal haemostasis range 0.8 – 1.1
        if 0.8 <= ptinr <= 1.1:
            pt_diag = "Normal"
        elif ptinr < 0.8:
            pt_diag = "Abnormal with Thrombotic Tendency"
        else:
            pt_diag = "Abnormal"

    return hct_diag, pt_diag