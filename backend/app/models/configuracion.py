from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..core.database import Base

class Configuracion(Base):
    __tablename__ = "configuracion"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    nombre_empresa = Column(String(200), nullable=True)
    slogan = Column(String(500), nullable=True)
    logo_url = Column(Text, nullable=True)  # 👈 CAMBIADO a Text (sin límite)
    color_principal = Column(String(20), nullable=True, default="#00d4ff")
    color_secundario = Column(String(20), nullable=True, default="#ff00e5")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())