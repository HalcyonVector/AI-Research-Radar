from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import model_service

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
def list_models(sort: str = "downloads_7d", model_type: str | None = None,
                cursor: str | None = None, limit: int = 20, db: Session = Depends(get_db)):
    return model_service.list_models(db, sort, model_type, cursor, limit)


@router.get("/{model_id}")
def get_model(model_id: str, db: Session = Depends(get_db)):
    m = model_service.get_model(db, model_id)
    if not m:
        raise HTTPException(404, "Model not found")
    return m


@router.get("/{model_id}/history")
def history(model_id: str, db: Session = Depends(get_db)):
    return {"data": model_service.model_history(db, model_id)}
