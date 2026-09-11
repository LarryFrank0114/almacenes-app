from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from ..core.database import get_db
from ..models.item import Item
from ..schemas.item import Item as ItemSchema, ItemCreate, ItemUpdate

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("/")
def get_items(
    skip: int = 0,
    limit: int = 50,  # ✅ 50 productos por defecto
    almacen_id: Optional[int] = None,
    categoria: Optional[str] = None,
    search: Optional[str] = None,
    stock_min: Optional[int] = None,
    stock_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene items con paginación.
    Retorna: { data: [...], total: int, skip: int, limit: int, pages: int }
    """
    query = db.query(Item).options(joinedload(Item.almacen)).filter(Item.activo == True)
    
    if almacen_id:
        query = query.filter(Item.almacen_id == almacen_id)
    if categoria:
        query = query.filter(Item.categoria == categoria)
    if search:
        query = query.filter(
            (Item.nombre.ilike(f"%{search}%")) | 
            (Item.codigo.ilike(f"%{search}%"))
        )
    if stock_min is not None:
        query = query.filter(Item.stock >= stock_min)
    if stock_max is not None:
        query = query.filter(Item.stock <= stock_max)
    
    # ✅ Contar total de registros ANTES de paginar
    total = query.count()
    
    # ✅ Aplicar paginación
    items = query.order_by(Item.id).offset(skip).limit(limit).all()
    
    return {
        "data": [ItemSchema.model_validate(item) for item in items],
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": (total + limit - 1) // limit  # Total de páginas
    }


@router.get("/{item_id}", response_model=ItemSchema)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).options(joinedload(Item.almacen)).filter(
        Item.id == item_id, 
        Item.activo == True
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return item


@router.post("/", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=ItemSchema)
def update_item(item_id: int, item_update: ItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    db_item.activo = False
    db.commit()
    return None


@router.patch("/{item_id}/stock")
def update_stock(item_id: int, cantidad: int = Query(...), db: Session = Depends(get_db)):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    nueva_cantidad = db_item.stock + cantidad
    if nueva_cantidad < 0:
        raise HTTPException(status_code=400, detail="Stock no puede ser negativo")
    
    db_item.stock = nueva_cantidad
    db.commit()
    db.refresh(db_item)
    return {"id": item_id, "stock": db_item.stock}


@router.get("/stats/count")
def get_items_stats(db: Session = Depends(get_db)):
    """Retorna el total de items y el stock total."""
    total_items = db.query(func.count(Item.id)).filter(Item.activo == True).scalar()
    stock_total = db.query(func.sum(Item.stock)).filter(Item.activo == True).scalar() or 0
    stock_bajo = db.query(func.count(Item.id)).filter(
        Item.activo == True,
        Item.stock <= Item.stock_minimo
    ).scalar()
    
    return {
        "total_items": total_items,
        "stock_total": stock_total,
        "stock_bajo": stock_bajo
    }
