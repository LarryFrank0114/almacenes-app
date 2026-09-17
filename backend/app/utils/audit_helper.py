from sqlalchemy.orm import Session
from fastapi import Request
from typing import Optional, Any
from ..models.audit_log import AuditLog


def registrar_auditoria(
    db: Session,
    accion: str,
    tabla: str,
    registro_id: Optional[int] = None,
    campo: Optional[str] = None,
    valor_anterior: Optional[Any] = None,
    valor_nuevo: Optional[Any] = None,
    usuario_email: Optional[str] = None,
    usuario_id: Optional[str] = None,
    request: Optional[Request] = None
):
    """Registra un cambio en la tabla de auditoría."""
    try:
        ip = None
        user_agent = None
        if request:
            ip = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
            # ✅ NUEVO: Leer email del header X-User-Email
            if not usuario_email:
                usuario_email = request.headers.get("x-user-email")
        
        valor_anterior_str = str(valor_anterior) if valor_anterior is not None else None
        valor_nuevo_str = str(valor_nuevo) if valor_nuevo is not None else None
        
        log = AuditLog(
            usuario_email=usuario_email or "sistema",
            usuario_id=usuario_id,
            accion=accion,
            tabla=tabla,
            registro_id=registro_id,
            campo=campo,
            valor_anterior=valor_anterior_str,
            valor_nuevo=valor_nuevo_str,
            ip=ip,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        print(f"⚠️ Error al registrar auditoría: {e}")
        db.rollback()
        return None


def registrar_cambios_item(
    db: Session,
    item_id: int,
    datos_anteriores: dict,
    datos_nuevos: dict,
    usuario_email: Optional[str] = None,
    usuario_id: Optional[str] = None,
    request: Optional[Request] = None
):
    """Compara datos anteriores y nuevos, y registra SOLO los campos que cambiaron."""
    campos_a_ignorar = {'id', 'created_at', 'updated_at'}
    
    for campo, valor_nuevo in datos_nuevos.items():
        if campo in campos_a_ignorar:
            continue
        
        valor_anterior = datos_anteriores.get(campo)
        
        valor_anterior_norm = str(valor_anterior) if valor_anterior is not None else None
        valor_nuevo_norm = str(valor_nuevo) if valor_nuevo is not None else None
        
        if valor_anterior_norm != valor_nuevo_norm:
            registrar_auditoria(
                db=db,
                accion="editar",
                tabla="items",
                registro_id=item_id,
                campo=campo,
                valor_anterior=valor_anterior,
                valor_nuevo=valor_nuevo,
                usuario_email=usuario_email,
                usuario_id=usuario_id,
                request=request
            )