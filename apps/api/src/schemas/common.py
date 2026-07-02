from pydantic import BaseModel


class Pagination(BaseModel):
    cursor: str | None = None
    has_more: bool = False
    total_count: int = 0


class CategoryRef(BaseModel):
    slug: str
    name: str
    color: str | None = None
