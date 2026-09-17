from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from ..core.database import get_db
from ..models.item import Item
from ..schemas.item import Item as ItemSchema, ItemCreate, ItemUpdate
from ..utils.audit_helper import registrar_auditoria, registrar_cambios_item

router = APIRouter(prefix="/items", tags=["Items"])

# Usuario temporal (en el futuro vendrá del token JWT)
USUARIO_TEMPORAL = "admin@almacenes.com"


@router.get("/")
def get_items(
    skip: int = 0,
    limit: int = 50,
    almacen_id: Optional[int] = None,
    categoria: Optional[str] = None,
    search: Optional[str] = None,
    stock_min: Optional[int] = None,
    stock_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Obtiene items con paginación."""
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
    
    total = query.count()
    items = query.order_by(Item.id).offset(skip).limit(limit).all()
    
    return {
        "data": [ItemSchema.model_validate(item) for item in items],
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/stats/count")
def get_items_stats(db: Session = Depends(get_db)):
    """Retorna estadísticas globales del inventario."""
    total_items = db.query(func.count(Item.id)).filter(Item.activo == True).scalar()
    stock_total = db.query(func.sum(Item.stock)).filter(Item.activo == True).scalar() or 0
    stock_bajo = db.query(func.count(Item.id)).filter(
        Item.activo == True,
        Item.stock <= Item.stock_minimo
    ).scalar()
    
    valor_inventario = db.query(
        func.sum(
            func.coalesce(Item.stock, 0) * func.coalesce(Item.precio, 0)
        )
    ).filter(Item.activo == True).scalar() or 0

    return {
        "total_items": total_items,
        "stock_total": float(stock_total),
        "stock_bajo": stock_bajo,
        "valor_inventario": float(valor_inventario)
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
def create_item(
    item: ItemCreate, 
    request: Request,
    db: Session = Depends(get_db)
):
    db_item = Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # ✅ Registrar creación en auditoría
    registrar_auditoria(
        db=db,
        accion="crear",
        tabla="items",
        registro_id=db_item.id,
        campo=None,
        valor_anterior=None,
        valor_nuevo=f"Producto '{db_item.nombre}' (código: {db_item.codigo})",
        usuario_email=USUARIO_TEMPORAL,
        request=request
    )
    
    return db_item


@router.put("/{item_id}", response_model=ItemSchema)
def update_item(
    item_id: int, 
    item_update: ItemUpdate, 
    request: Request,
    db: Session = Depends(get_db)
):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # ✅ Guardar datos anteriores
    datos_anteriores = {
        "nombre": db_item.nombre,
        "codigo": db_item.codigo,
        "descripcion": db_item.descripcion,
        "categoria": db_item.categoria,
        "stock": db_item.stock,
        "stock_minimo": db_item.stock_minimo,
        "precio": db_item.precio,
        "precio_costo": db_item.precio_costo,
        "unidad_medida": db_item.unidad_medida,
        "ubicacion": db_item.ubicacion,
        "almacen_id": db_item.almacen_id,
    }
    
    # Aplicar cambios
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    # ✅ Registrar cambios
    datos_nuevos = {
        "nombre": db_item.nombre,
        "codigo": db_item.codigo,
        "descripcion": db_item.descripcion,
        "categoria": db_item.categoria,
        "stock": db_item.stock,
        "stock_minimo": db_item.stock_minimo,
        "precio": db_item.precio,
        "precio_costo": db_item.precio_costo,
        "unidad_medida": db_item.unidad_medida,
        "ubicacion": db_item.ubicacion,
        "almacen_id": db_item.almacen_id,
    }
    
    registrar_cambios_item(
        db=db,
        item_id=item_id,
        datos_anteriores=datos_anteriores,
        datos_nuevos=datos_nuevos,
        usuario_email=USUARIO_TEMPORAL,
        request=request
    )
    
    return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int, 
    request: Request,
    db: Session = Depends(get_db)
):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # ✅ Guardar datos antes de eliminar
    nombre_producto = db_item.nombre
    codigo_producto = db_item.codigo
    
    db_item.activo = False
    db.commit()
    
    # ✅ Registrar eliminación
    registrar_auditoria(
        db=db,
        accion="eliminar",
        tabla="items",
        registro_id=item_id,
        campo=None,
        valor_anterior=f"Producto '{nombre_producto}' (código: {codigo_producto})",
        valor_nuevo=None,
        usuario_email=USUARIO_TEMPORAL,
        request=request
    )
    
    return None


@router.patch("/{item_id}/stock")
def update_stock(
    item_id: int, 
    cantidad: int = Query(...), 
    request: Request = None,
    db: Session = Depends(get_db)
):
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    stock_anterior = db_item.stock
    nueva_cantidad = db_item.stock + cantidad
    if nueva_cantidad < 0:
        raise HTTPException(status_code=400, detail="Stock no puede ser negativo")
    
    db_item.stock = nueva_cantidad
    db.commit()
    db.refresh(db_item)
    
    # ✅ Registrar cambio de stock
    registrar_auditoria(
        db=db,
        accion="editar",
        tabla="items",
        registro_id=item_id,
        campo="stock",
        valor_anterior=stock_anterior,
        valor_nuevo=nueva_cantidad,
        usuario_email=USUARIO_TEMPORAL,
        request=request
    )
    
    return {"id": item_id, "stock": db_item.stock}