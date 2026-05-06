from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from models.schemas import DiagnosisResponse
from services.image_utils import process_assay_image
from services.diagnostics import calculate_metrics, generate_diagnosis

router = APIRouter()

@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose(
    file: UploadFile = File(...),
    gender: str = Form(...),
    on_warfarin: str = Form(...),
    mechanical_mitral_valve: str = Form(...)
):
    image_bytes = await file.read()
    
    # --- NEW ERROR HANDLING ---
    try:
        mean_red_circle, mean_red_rect, length_bbox = process_assay_image(image_bytes)
    except ValueError as e:
        if str(e) == "INVALID_ASSAY_IMAGE":
            # Tell the frontend exactly what went wrong
            raise HTTPException(
                status_code=400, 
                detail="Invalid image detected. Please ensure the image clearly shows both the circular HCT zone and the rectangular PT strip."
            )
        raise HTTPException(status_code=500, detail="An error occurred while processing the image.")
    
    hct, ptinr = calculate_metrics(mean_red_circle, mean_red_rect, length_bbox)
    hct_diagnosis, ptinr_diagnosis = generate_diagnosis(hct, ptinr, gender, on_warfarin, mechanical_mitral_valve)
    
    return DiagnosisResponse(
        hct_value=round(hct, 2),
        hct_diagnosis=hct_diagnosis,
        ptinr_value=round(ptinr, 2),
        ptinr_diagnosis=ptinr_diagnosis
    )