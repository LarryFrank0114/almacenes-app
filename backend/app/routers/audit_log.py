from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
from datetime import datetime, timedelta
from ..core.database import get_db
from ..models.audit_log import AuditLog
from ..schemas.audit_log import AuditLog as AuditLogSchema

router = APIRouter(prefix="/audit-log", tags=["Auditoría"])


@router.get("/")
def get_audit_log(
    skip: int = 0,
    limit: int = 50,
    usuario_email: Optional[str] = None,
    accion: Optional[str] = None,
    tabla: Optional[str] = None,
    registro_id: Optional[int] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial de auditoría con filtros y paginación.
    """
    query = db.query(AuditLog)
    
    # Aplicar filtros
    if usuario_email:
        query = query.filter(AuditLog.usuario_email.ilike(f"%{usuario_email}%"))
    if accion:
        query = query.filter(AuditLog.accion == accion)
    if tabla:
        query = query.filter(AuditLog.tabla == tabla)
    if registro_id:
        query = query.filter(AuditLog.registro_id == registro_id)
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde.replace('Z', '+00:00'))
            query = query.filter(AuditLog.created_at >= fecha_desde_dt)
        except ValueError:
            pass
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta.replace('Z', '+00:00'))
            # Sumar un día para incluir todo el día
            fecha_hasta_dt = fecha_hasta_dt + timedelta(days=1)
            query = query.filter(AuditLog.created_at < fecha_hasta_dt)
        except ValueError:
            pass
    
    # Contar total
    total = query.count()
    
    # Ordenar por fecha descendente (más reciente primero)
    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    
    return {
        "data": [AuditLogSchema.model_validate(log) for log in logs],
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/stats")
def get_audit_stats(db: Session = Depends(get_db)):
    """
    Estadísticas generales de auditoría.
    """
    total = db.query(func.count(AuditLog.id)).scalar()
    
    # Cambios por acción
    por_accion = db.query(
        AuditLog.accion,
        func.count(AuditLog.id)
    ).group_by(AuditLog.accion).all()
    
    # Cambios por usuario (top 5)
    por_usuario = db.query(
        AuditLog.usuario_email,
        func.count(AuditLog.id)
    ).group_by(AuditLog.usuario_email).order_by(func.count(AuditLog.id).desc()).limit(5).all()
    
    # Cambios por tabla
    por_tabla = db.query(
        AuditLog.tabla,
        func.count(AuditLog.id)
    ).group_by(AuditLog.tabla).all()
    
    return {
        "total": total,
        "por_accion": [{"accion": a, "count": c} for a, c in por_accion],
        "por_usuario": [{"usuario": u, "count": c} for u, c in por_usuario],
        "por_tabla": [{"tabla": t, "count": c} for t, c in por_tabla]
    }


@router.get("/item/{item_id}")
def get_item_history(item_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el historial de cambios de un producto específico.
    """
    logs = db.query(AuditLog).filter(
        AuditLog.tabla == "items",
        AuditLog.registro_id == item_id
    ).order_by(desc(AuditLog.created_at)).all()
    
    return {
        "data": [AuditLogSchema.model_validate(log) for log in logs],
        "total": len(logs)
    }