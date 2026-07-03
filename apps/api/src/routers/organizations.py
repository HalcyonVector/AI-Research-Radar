"""Organization profile endpoints (feature: organization pages)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import org_service

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/{org_id}")
def get_org(org_id: str, db: Session = Depends(get_db)):
    o = org_service.get_org(db, org_id)
    if not o:
        raise HTTPException(404, "Organization not found")
    return o
