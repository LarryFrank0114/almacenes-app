from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import date

from ..core.database import get_db
from ..models.item import Item
from ..models.movimiento import Movimiento, MovimientoDetalle
from ..schemas.movimiento import (
    MovimientoCreate,
    MovimientoResponse,
    MovimientoDetalleResponse
)

router = APIRouter(prefix="/movimientos", tags=["Movimientos"])


@router.post("/", response_model=MovimientoResponse, status_code=status.HTTP_201_CREATED)
def create_movimiento(movimiento: MovimientoCreate, db: Session = Depends(get_db)):
    """
    Registra un movimiento con N productos en una sola transacción.
    Actualiza el stock de cada producto automáticamente.
    Si algo falla, toda la operación se revierte (rollback).
    """
    # Validar tipo
    if movimiento.tipo not in ['entrada', 'salida']:
        raise HTTPException(status_code=400, detail="Tipo debe ser 'entrada' o 'salida'")
    
    # Validar que tenga al menos un detalle
    if not movimiento.detalles or len(movimiento.detalles) == 0:
        raise HTTPException(status_code=400, detail="Debe incluir al menos un producto")
    
    try:
        # 1. Crear el movimiento principal
        db_movimiento = Movimiento(
            tipo=movimiento.tipo,
            fecha=movimiento.fecha or date.today(),
            numero_documento=movimiento.numero_documento,
            proveedor=movimiento.proveedor if movimiento.tipo == 'entrada' else None,
            destino=movimiento.destino if movimiento.tipo == 'salida' else None,
            observacion=movimiento.observacion,
            usuario_email=movimiento.usuario_email,
        )
        db.add(db_movimiento)
        db.flush()  # Para obtener el ID sin hacer commit aún
        
        # 2. Crear los detalles y actualizar stock
        for detalle in movimiento.detalles:
            # Buscar el item
            db_item = db.query(Item).filter(Item.id == detalle.item_id).first()
            if not db_item:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Producto con ID {detalle.item_id} no encontrado"
                )
            
            # Calcular la cantidad con signo según tipo
            cantidad_con_signo = detalle.cantidad if movimiento.tipo == 'entrada' else -detalle.cantidad
            
            # Validar stock suficiente en salidas
            stock_anterior = db_item.stock or 0
            stock_nuevo = stock_anterior + cantidad_con_signo
            
            if stock_nuevo < 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para {db_item.nombre}. "
                           f"Stock actual: {stock_anterior}, solicitado: {detalle.cantidad}"
                )
            
            # Actualizar stock del item
            db_item.stock = stock_nuevo
            
            # Crear el detalle
            db_detalle = MovimientoDetalle(
                movimiento_id=db_movimiento.id,
                item_id=detalle.item_id,
                cantidad=detalle.cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
            )
            db.add(db_detalle)
        
        # 3. Commit de toda la transacción (si algo falla, rollback automático)
        db.commit()
        db.refresh(db_movimiento)
        
        # 4. Cargar relaciones para la respuesta
        db_movimiento = db.query(Movimiento).options(
            joinedload(Movimiento.detalles).joinedload(MovimientoDetalle.item)
        ).filter(Movimiento.id == db_movimiento.id).first()
        
        return db_movimiento
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar movimiento: {str(e)}")


@router.get("/")
def get_movimientos(
    skip: int = 0,
    limit: int = 50,
    tipo: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lista movimientos con paginación y filtros.
    Retorna: { data: [...], total, skip, limit, pages }
    """
    query = db.query(Movimiento).options(
        joinedload(Movimiento.detalles).joinedload(MovimientoDetalle.item)
    )
    
    if tipo:
        query = query.filter(Movimiento.tipo == tipo)
    if fecha_desde:
        query = query.filter(Movimiento.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Movimiento.fecha <= fecha_hasta)
    if search:
        query = query.filter(
            (Movimiento.numero_documento.ilike(f"%{search}%")) |
            (Movimiento.proveedor.ilike(f"%{search}%")) |
            (Movimiento.destino.ilike(f"%{search}%")) |
            (Movimiento.observacion.ilike(f"%{search}%"))
        )
    
    total = query.count()
    movimientos = query.order_by(Movimiento.fecha.desc(), Movimiento.id.desc()).offset(skip).limit(limit).all()
    
    return {
        "data": [MovimientoResponse.model_validate(m) for m in movimientos],
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{movimiento_id}", response_model=MovimientoResponse)
def get_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    """Obtiene un movimiento específico con todos sus detalles."""
    movimiento = db.query(Movimiento).options(
        joinedload(Movimiento.detalles).joinedload(MovimientoDetalle.item)
    ).filter(Movimiento.id == movimiento_id).first()
    
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    return movimiento


@router.delete("/{movimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    """
    Elimina un movimiento y revierte el stock (opcional).
    ⚠️ Cuidado: revertir el stock puede causar descuadres si ya se usó.
    """
    movimiento = db.query(Movimiento).options(
        joinedload(Movimiento.detalles)
    ).filter(Movimiento.id == movimiento_id).first()
    
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    try:
        # Revertir stock
        for detalle in movimiento.detalles:
            db_item = db.query(Item).filter(Item.id == detalle.item_id).first()
            if db_item:
                # Revertir: si fue entrada, restar; si fue salida, sumar
                if movimiento.tipo == 'entrada':
                    db_item.stock = (db_item.stock or 0) - detalle.cantidad
                else:
                    db_item.stock = (db_item.stock or 0) + detalle.cantidad
        
        db.delete(movimiento)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar: {str(e)}")
