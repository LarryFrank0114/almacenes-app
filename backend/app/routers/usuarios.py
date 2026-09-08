from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.auth import require_admin
from ..models.usuario import Usuario
from ..schemas.usuario import Usuario as UsuarioSchema, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=List[UsuarioSchema])
def get_usuarios(
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    usuarios = db.query(Usuario).all()
    return usuarios

@router.put("/{usuario_id}/rol", response_model=UsuarioSchema)
def update_rol(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir cambiar el rol del propio admin
    if usuario.email == current_user.user.email:
        raise HTTPException(status_code=403, detail="No puedes cambiar tu propio rol")
    
    usuario.rol = usuario_update.rol
    db.commit()
    db.refresh(usuario)
    return usuario

@router.put("/{usuario_id}/estado", response_model=UsuarioSchema)
def update_estado(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir desactivar al propio admin
    if usuario.email == current_user.user.email:
        raise HTTPException(status_code=403, detail="No puedes desactivar tu propio usuario")
    
    usuario.activo = usuario_update.activo
    db.commit()
    db.refresh(usuario)
    return usuario