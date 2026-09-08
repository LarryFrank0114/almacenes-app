from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..models.configuracion import Configuracion
from ..schemas.configuracion import Configuracion as ConfiguracionSchema, ConfiguracionCreate, ConfiguracionUpdate

router = APIRouter(prefix="/configuracion", tags=["Configuración"])

@router.get("/", response_model=ConfiguracionSchema)
def get_configuracion(db: Session = Depends(get_db)):
    config = db.query(Configuracion).first()
    if not config:
        # Crear configuración por defecto
        config = Configuracion(
            nombre_empresa="Mi Empresa S.A.C.",
            slogan="Gestiona tu inventario de forma inteligente",
            color_principal="#00d4ff",
            color_secundario="#ff00e5"
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/", response_model=ConfiguracionSchema)
def update_configuracion(
    config_update: ConfiguracionUpdate,
    db: Session = Depends(get_db)
):
    config = db.query(Configuracion).first()
    if not config:
        config = Configuracion()
        db.add(config)
    
    update_data = config_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    
    db.commit()
    db.refresh(config)
    return config

@router.patch("/logo", response_model=ConfiguracionSchema)
def update_logo(
    logo_url: str,
    db: Session = Depends(get_db)
):
    config = db.query(Configuracion).first()
    if not config:
        config = Configuracion()
        db.add(config)
    
    config.logo_url = logo_url
    db.commit()
    db.refresh(config)
    return config