import math
from typing import List, Tuple, Dict
from models.schemas import WarfarinDosageRequest

def get_drug_multiplier(drugs: List[str]) -> float:
    """Translated from MATLAB drugMultiplier"""
    mult = 1.0
    drugs_lower = [d.lower() for d in drugs]
    
    for d in drugs_lower:
        if 'amiodarone' in d: mult *= 0.70
        if 'fluconazole' in d or 'itraconazole' in d: mult *= 0.70
        if 'tmp' in d or 'smx' in d or 'co-trimoxazole' in d: mult *= 0.75
        if 'rifamp' in d: mult *= 1.50
        if 'metronidazole' in d: mult *= 0.80
        if 'macrolide' in d: mult *= 0.85
    return mult

def iwpc_predict(age: float, height: float, weight: float, cyp: str, vkor: str, race: str, drugs: List[str]) -> float:
    """Translated from MATLAB iwpcPredict"""
    drugs_lower = [d.lower() for d in drugs]
    
    # Flags
    enzyme_inducer = any(d in ['rifampin', 'carbamazepine', 'phenytoin', 'rifamp'] for d in drugs_lower)
    amiodarone_flag = any('amiodarone' in d for d in drugs_lower)
    
    race_lower = race.lower()
    is_asian = 'asian' in race_lower
    is_black = 'black' in race_lower or 'african' in race_lower
    is_missing = 'mixed' in race_lower or 'unknown' in race_lower or not race_lower
    
    use_pg = bool(cyp and vkor) and cyp != "Unknown" and vkor != "Unknown"
    
    age_decades = age / 10.0
    h = height if height else 0.0
    wt = weight if weight else 0.0
    
    if use_pg:
        vk = vkor.upper()
        vk_ag = 1 if vk in ['GA', 'AG'] else 0
        vk_aa = 1 if vk == 'AA' else 0
        vk_unknown = 1 if not vk else 0
        
        c12 = 1 if cyp == '*1/*2' else 0
        c13 = 1 if cyp == '*1/*3' else 0
        c22 = 1 if cyp == '*2/*2' else 0
        c23 = 1 if cyp == '*2/*3' else 0
        c33 = 1 if cyp == '*3/*3' else 0
        c_unknown = 1 if (not cyp or not any([c12, c13, c22, c23, c33])) else 0
        
        pred_sqrt_wk = (5.6044 
            - 0.2614 * age_decades 
            + 0.0087 * h 
            + 0.0128 * wt 
            - 0.8677 * vk_ag 
            - 1.6974 * vk_aa 
            - 0.4854 * vk_unknown 
            - 0.5211 * c12 
            - 0.9357 * c13 
            - 1.0616 * c22 
            - 1.9206 * c23 
            - 2.3312 * c33 
            - 0.2188 * c_unknown 
            - 0.1092 * is_asian 
            - 0.2760 * is_black 
            - 0.1032 * is_missing 
            + 1.1816 * enzyme_inducer 
            - 0.5503 * amiodarone_flag)
    else:
        pred_sqrt_wk = (4.0376 
            - 0.2546 * age_decades 
            + 0.0118 * h 
            + 0.0134 * wt 
            - 0.6752 * is_asian 
            + 0.4060 * is_black 
            + 0.0443 * is_missing 
            + 1.2799 * enzyme_inducer 
            - 0.5695 * amiodarone_flag)
        
    pred_sqrt_wk = max(pred_sqrt_wk, 0.1)
    return pred_sqrt_wk ** 2

def tablet_planner(daily_dose: float) -> Tuple[str, float]:
    """Translated from MATLAB tabletPlanner"""
    strengths = [10.0, 7.5, 6.0, 5.0, 4.0, 3.0, 2.5, 2.0, 1.0]
    remaining = round(daily_dose * 4) / 4.0
    
    parts = []
    approx_dose = 0.0
    
    for s in strengths:
        count = math.floor(remaining / s)
        if count > 0:
            parts.append(f"{count} × {s} mg")
            remaining -= count * s
            approx_dose += count * s
            
    tab_text = " + ".join(parts) if parts else "0 mg"
    return tab_text, approx_dose

def calculate_warfarin_dosage(req: WarfarinDosageRequest) -> dict:
    """Main orchestrator translated from MATLAB ComputeButtonPushed"""
    warnings = []
    
    # Target INR
    ind_lower = req.indication.lower()
    if ind_lower in ['af', 'dvt', 'pe', 'vte', 'mechaortic']:
        target_low, target_high = 2.0, 3.0
    elif ind_lower == 'mechmitral':
        target_low, target_high = 2.5, 3.5
    else:
        target_low, target_high = 2.0, 3.0
        
    # POC Warning
    if req.inr_source.lower() == 'poc' and req.hct is not None and not (25 <= req.hct <= 55):
        warnings.append(f"WARNING: POC INR may be inaccurate: Hct = {req.hct}% (device typical 25-55%).")
        
    # IWPC Base Prediction
    pred_weekly_iwpc = iwpc_predict(
        req.age, req.height, req.weight, 
        req.cyp2c9, req.vkorc1, req.race, req.interacting_drugs
    )
    
    # Clinical Modifiers
    albumin_factor = 1.0
    if req.albumin is not None and req.albumin > 0:
        if req.albumin < 3.0: albumin_factor = 0.70
        elif req.albumin < 3.5: albumin_factor = 0.85
            
    drug_factor = get_drug_multiplier(req.interacting_drugs)
    safety_factor = 1.0
    if req.high_bleeding_risk: safety_factor *= 0.85
    if req.liver_disease: safety_factor *= 0.80
        
    sensitivity_factor = albumin_factor * drug_factor * safety_factor
    
    early_decision = ""
    action_note = ""
    recheck_days = 7
    
    if not req.on_warfarin:
        source_used = 'IWPC prediction (start)'
        base_weekly = pred_weekly_iwpc
        adjusted_weekly = base_weekly * sensitivity_factor
        adjusted_daily = adjusted_weekly / 7.0
        recheck_days = 2
        
        if req.current_inr is not None:
            if req.current_inr < 1.3:
                adjusted_daily += 1
                early_decision = "Increase starting daily dose by 1 mg (recheck INR 2-3 days)."
            elif 1.3 <= req.current_inr <= 1.7:
                early_decision = "Keep starting dose unchanged; recheck INR 2-3 days."
            elif 1.8 <= req.current_inr <= 2.2:
                adjusted_daily = max(0.5, adjusted_daily - 0.5)
                early_decision = "Reduce starting daily dose by 0.5 mg; recheck INR."
            else:
                adjusted_daily = max(0, adjusted_daily - 1)
                early_decision = "INR >2.2 — hold/reduce dose; seek expert advice."
            adjusted_weekly = adjusted_daily * 7
            
    else:
        source_used = 'Maintenance (IWPC-informed)'
        last_week = req.last_week_dose if req.last_week_dose else 0
        if last_week <= 0:
            raise ValueError("Provide valid Last 7-day total dose for maintenance.")
            
        pct_diff = (pred_weekly_iwpc - last_week) / last_week * 100
        if abs(pct_diff) > 20:
            adjusted_weekly = ((last_week + pred_weekly_iwpc) / 2) * sensitivity_factor
            action_note = f"IWPC suggests {pred_weekly_iwpc:.1f} mg/week; adjusting conservatively toward predicted dose."
        else:
            adjusted_weekly = last_week * sensitivity_factor
            action_note = "Current regimen close to IWPC prediction; minor modifier applied."
            
        if req.current_inr is not None:
            c_inr = req.current_inr
            if c_inr < 1.5:
                adjusted_weekly *= 1.15; recheck_days = 3; action_note = "Increase weekly dose by ~15%."
            elif 1.5 <= c_inr <= 1.9:
                adjusted_weekly *= 1.07; recheck_days = 3; action_note = "Small increase (~7%)."
            elif target_low <= c_inr <= target_high:
                recheck_days = 7; action_note = "Therapeutic — continue same dose."
            elif target_high < c_inr <= 4.5:
                adjusted_weekly *= 0.90; recheck_days = 2; action_note = "Reduce ~10%."
            elif 4.5 < c_inr <= 10:
                adjusted_weekly *= 0.80; recheck_days = 1; action_note = "Reduce 20%; consider oral vitamin K if bleeding risk."
            else:
                adjusted_weekly *= 0.6; recheck_days = 1; action_note = "INR >10: urgent — hold warfarin, give vitamin K."
        else:
            action_note = "No current INR provided; use IWPC-based maintenance adjustment."
            
        adjusted_daily = adjusted_weekly / 7.0

    # Tablet planning
    tab_text, approx_dose = tablet_planner(adjusted_daily)
    
    # Daywise generation (simple spread for Python side)
    base_low = math.floor(adjusted_daily)
    base_high = math.ceil(adjusted_daily)
    diff_low = adjusted_daily - base_low
    num_high = min(max(round(7 * diff_low), 0), 7)
    
    day_plan = {}
    for i in range(1, 8):
        # Evenly spread the higher doses through the week
        is_high = i <= num_high
        day_plan[f"Day {i}"] = float(base_high if is_high else base_low)

    # Recheck Reason Logic
    if req.current_inr is not None:
        if req.current_inr < target_low:
            recheck_reason = "INR below target – dose increased"
        elif req.current_inr > target_high:
            recheck_reason = "INR above target – dose decreased"
        else:
            recheck_reason = "INR stable – no major change"
    else:
        recheck_reason = "Initial phase / No current INR provided"

    return {
        "indication": req.indication,
        "target_inr_range": f"{target_low} - {target_high}",
        "dose_source_used": source_used,
        "predicted_weekly_dose": round(pred_weekly_iwpc, 2),
        "adjusted_weekly_dose": round(adjusted_weekly, 2),
        "adjusted_daily_dose": round(adjusted_daily, 3),
        "rounded_daily_dose": round(adjusted_daily * 4) / 4.0,
        "early_inr_note": early_decision,
        "action_note": action_note,
        "warnings": warnings,
        "tablet_suggestion": tab_text,
        "approximate_daily_dose_from_tablets": approx_dose,
        "day_plan": day_plan,
        "recheck_days": recheck_days,
        "recheck_reason": recheck_reason
    }