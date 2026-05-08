from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DiagnosisResponse(BaseModel):
    hct_value: float
    hct_diagnosis: str
    ptinr_value: float
    ptinr_diagnosis: str


class WarfarinDosageRequest(BaseModel):
    # Patient Clinical Inputs
    age: float
    weight: Optional[float] = 0.0
    height: Optional[float] = 0.0
    race: str = "Unknown"  # Asian, White, Black, Mixed, Unknown
    indication: str = "AF" # AF, DVT, PE, VTE, MechAortic, MechMitral, Other
    
    # Blood/Lab Info
    baseline_inr: Optional[float] = None
    current_inr: Optional[float] = None
    inr_source: str = "lab" # lab or POC
    hct: Optional[float] = None
    albumin: Optional[float] = None
    
    # Risk Factors
    high_bleeding_risk: bool = False
    liver_disease: bool = False
    
    # Genetics
    cyp2c9: str = "*1/*1" # *1/*1, *1/*2, *1/*3, *2/*2, *3/*3, *2/*3
    vkorc1: str = "GG"    # GG, GA, AA
    
    # Interacting Drugs
    interacting_drugs: List[str] = []
    
    # Maintenance
    on_warfarin: bool = False
    last_week_dose: Optional[float] = None

class WarfarinDosageResponse(BaseModel):
    indication: str
    target_inr_range: str
    dose_source_used: str
    predicted_weekly_dose: float
    adjusted_weekly_dose: float
    adjusted_daily_dose: float
    rounded_daily_dose: float
    early_inr_note: str
    action_note: str
    warnings: List[str]
    tablet_suggestion: str
    approximate_daily_dose_from_tablets: float
    day_plan: Dict[str, float]
    recheck_days: int
    recheck_reason: str