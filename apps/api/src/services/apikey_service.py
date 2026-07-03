"""API key issuance + verification service (feature: api-key rate tiers).

Keys are stored as sha256 hex digests (stdlib only, no extra deps). The raw key
is returned exactly once at creation time.
"""
import hashlib
from datetime import datetime, timezone
from secrets import token_urlsafe
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from src.models import ApiKey


def _hash(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def create(db: Session, name: str) -> dict:
    """Create a new API key; returns the raw key ONCE."""
    key = f"radar_{token_urlsafe(24)}"
    prefix = key[:12]
    row = ApiKey(name=name, prefix=prefix, key_hash=_hash(key))
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": str(row.id), "name": row.name, "prefix": row.prefix, "key": key}


def list_keys(db: Session) -> dict:
    """List keys without any secret material."""
    rows = db.execute(select(ApiKey).order_by(desc(ApiKey.created_at))).scalars().all()
    return {
        "data": [
            {
                "id": str(r.id),
                "name": r.name,
                "prefix": r.prefix,
                "revoked": r.revoked,
                "created_at": r.created_at,
                "last_used_at": r.last_used_at,
            }
            for r in rows
        ]
    }


def revoke(db: Session, key_id: str) -> bool:
    row = db.get(ApiKey, key_id)
    if not row:
        return False
    row.revoked = True
    db.commit()
    return True


def verify(db: Session, presented_key: str) -> bool:
    """Return True if the presented key matches an active (non-revoked) key."""
    if not presented_key:
        return False
    row = db.execute(
        select(ApiKey).where(
            ApiKey.key_hash == _hash(presented_key), ApiKey.revoked.is_(False)
        )
    ).scalar_one_or_none()
    if not row:
        return False
    row.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return True
