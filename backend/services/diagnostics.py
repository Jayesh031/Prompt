def calculate_metrics(mean_red_circle: float, mean_red_rect: float, length_bbox: float):
    """Calculates HCT and PTINR based on MATLAB formulas."""
    hct = -1.263 * mean_red_circle + 253.72
    ptinr = 6.72858003159145 - 0.0351556420452067 * hct - 0.0366191668483321 * mean_red_rect + 0.00999359566867459 * length_bbox
    return hct, ptinr

def generate_diagnosis(hct: float, ptinr: float, gender: str, on_warfarin: str, mech_mitral_valve: str):
    """Replicates the MATLAB nested if/else statements for clinical diagnosis."""
    gender = gender.upper()
    on_warfarin = on_warfarin.upper()
    mech_mitral_valve = mech_mitral_valve.upper()

    # --- HCT Diagnosis ---
    if gender == 'F':
        if 36 <= hct <= 48:
            hct_diag = 'HCT is Normal'
        elif hct < 36:
            hct_diag = 'HCT is Low'
        else:
            hct_diag = 'HCT is High'
    else: # Defaulting to 'M'
        if 41 <= hct <= 50:
            hct_diag = 'HCT is Normal'
        elif hct < 41:
            hct_diag = 'HCT is Low'
        else:
            hct_diag = 'HCT is High'

    # --- PTINR Diagnosis ---
    if on_warfarin == 'Y':
        if mech_mitral_valve == 'N':
            if 2 <= ptinr < 3:
                pt_diag = 'Normal'
            elif ptinr < 2:
                pt_diag = 'Abnormal with Thrombotic Tendency'
            else:
                pt_diag = 'Abnormal with Hemorrhagic Tendency'
        else: # mech_mitral_valve == 'Y'
            if 2.5 <= ptinr < 3.5:
                pt_diag = 'Normal'
            elif ptinr < 2.5:
                pt_diag = 'Abnormal with Thrombotic Tendency'
            else:
                pt_diag = 'Abnormal with Hemorrhagic Tendency'
    else: # on_warfarin == 'N'
        if 0.8 <= ptinr <= 1.1:
            pt_diag = 'Normal'
        elif ptinr < 0.8:
            pt_diag = 'Abnormal with Thrombotic Tendency'
        else:
            pt_diag = 'Abnormal'

    return hct_diag, pt_diag