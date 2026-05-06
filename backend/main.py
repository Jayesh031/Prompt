from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routes import router

app = FastAPI(title="PromPT API")

# Configure CORS so the Next.js frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.allowed_frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API endpoints
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "PromPT API is running"}