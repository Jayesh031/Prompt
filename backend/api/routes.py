from fastapi import APIRouter, File, UploadFile, Form
from models.schemas import DiagnosisResponse
from services.image_utils import process_assay_image
from services.diagnostics import calculate_metrics, generate_diagnosis

router = APIRouter()

@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(
    # Accept the image file
    file: UploadFile = File(...),
    # Accept the string inputs from the frontend form
    gender: str = Form(...),
    on_warfarin: str = Form(...),
    mechanical_mitral_valve: str = Form(...)
):
    # 1. Read the image bytes
    image_bytes = await file.read()
    
    # 2. Process image to extract variables
    mean_red_circle, mean_red_rect, length_bbox = process_assay_image(image_bytes)
    
    # 3. Calculate HCT and PTINR
    hct, ptinr = calculate_metrics(mean_red_circle, mean_red_rect, length_bbox)
    
    # 4. Generate text diagnoses
    hct_diagnosis, ptinr_diagnosis = generate_diagnosis(
        hct, ptinr, gender, on_warfarin, mechanical_mitral_valve
    )
    
    # 5. Return structured JSON response to Next.js
    return DiagnosisResponse(
        hct_value=round(hct, 2),
        hct_diagnosis=hct_diagnosis,
        ptinr_value=round(ptinr, 2),
        ptinr_diagnosis=ptinr_diagnosis
    )