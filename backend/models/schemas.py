from pydantic import BaseModel

class DiagnosisResponse(BaseModel):
    hct_value: float
    hct_diagnosis: str
    ptinr_value: float
    ptinr_diagnosis: str