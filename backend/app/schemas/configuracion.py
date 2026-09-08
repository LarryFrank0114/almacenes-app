from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConfiguracionBase(BaseModel):
    nombre_empresa: Optional[str] = None
    slogan: Optional[str] = None
    logo_url: Optional[str] = None
    color_principal: Optional[str] = "#00d4ff"
    color_secundario: Optional[str] = "#ff00e5"

class ConfiguracionCreate(ConfiguracionBase):
    pass

class ConfiguracionUpdate(ConfiguracionBase):
    pass

class Configuracion(ConfiguracionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True