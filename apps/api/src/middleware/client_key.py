"""Anonymous per-browser scoping for bookmarks/watches - not real auth.

The client id is generated and persisted (as a cookie) by the Next.js layer
and forwarded here as a header, since this API has no user/account model at
all. Requests without the header (e.g. direct API/Swagger use) fall back to a
single shared "anonymous" bucket, matching the old (pre-scoping) behavior.
"""
from fastapi import Header

ANONYMOUS = "anonymous"


def get_client_key(x_client_id: str | None = Header(default=None)) -> str:
    key = (x_client_id or "").strip()
    return key[:64] if key else ANONYMOUS
