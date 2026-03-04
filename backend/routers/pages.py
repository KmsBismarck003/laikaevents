from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models import User
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

# --- Pydantic Models ---
class PageUpdate(BaseModel):
    title: str
    content: str
    section: Optional[str] = None

class PageCreate(BaseModel):
    slug: str
    title: str
    content: str
    section: str = 'general'

class PageResponse(BaseModel):
    id: int
    slug: str
    title: str
    content: str
    section: str
    last_updated: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# --- Public Endpoints ---

@router.get("/", response_model=List[PageResponse])
def get_all_pages(section: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Get all pages, optionally filtered by section (publicly accessible).
    """
    query = "SELECT id, slug, title, content, section, last_updated, created_at FROM pages"
    params = {}

    if section and section != "null":
        query += " WHERE section = :section"
        params["section"] = section

    result = db.execute(text(query), params).fetchall()

    pages = []
    for row in result:
        pages.append(PageResponse(
            id=row[0],
            slug=row[1],
            title=row[2],
            content=row[3],
            section=row[4],
            last_updated=row[5],
            created_at=row[6]
        ))
    return pages

@router.get("/{slug}", response_model=PageResponse)
def get_page(slug: str, db: Session = Depends(get_db)):
    """
    Get a specific page by slug (publicly accessible).
    """
    result = db.execute(
        text("SELECT id, slug, title, content, section, last_updated, created_at FROM pages WHERE slug = :slug"),
        {"slug": slug}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    return PageResponse(
        id=result[0],
        slug=result[1],
        title=result[2],
        content=result[3],
        section=result[4],
        last_updated=result[5],
        created_at=result[6]
    )

# --- Admin Endpoints ---

@router.put("/{slug}", response_model=PageResponse)
def update_page(
    slug: str,
    page: PageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a page content (Admin only).
    """
    # Verify Admin permissions
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Requiere permisos de administrador")

    # Check if page exists
    existing = db.execute(
        text("SELECT id FROM pages WHERE slug = :slug"),
        {"slug": slug}
    ).fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    # Update logic
    update_query = """
        UPDATE pages
        SET title = :title, content = :content, section = COALESCE(:section, section), last_updated = NOW()
        WHERE slug = :slug
    """
    db.execute(
        text(update_query),
        {"title": page.title, "content": page.content, "section": page.section, "slug": slug}
    )
    db.commit()

    # Fetch updated page
    return get_page(slug, db)

@router.post("/", response_model=PageResponse)
def create_page(
    page: PageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new page (Admin only).
    """
    # Verify Admin permissions
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Requiere permisos de administrador")

    # Check for duplicate slug
    existing = db.execute(
        text("SELECT id FROM pages WHERE slug = :slug"),
        {"slug": page.slug}
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una página con este slug")

    # Insert logic
    insert_query = """
        INSERT INTO pages (slug, title, content, section, created_at, last_updated)
        VALUES (:slug, :title, :content, :section, NOW(), NOW())
    """
    db.execute(
        text(insert_query),
        {"slug": page.slug, "title": page.title, "content": page.content, "section": page.section}
    )
    db.commit()

    return get_page(page.slug, db)

@router.delete("/{slug}")
def delete_page(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a page (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Requiere permisos de administrador")

    result = db.execute(
        text("DELETE FROM pages WHERE slug = :slug"),
        {"slug": slug}
    )
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    return {"message": "Página eliminada correctamente"}
