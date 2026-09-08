from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..core.database import get_db
from ..models.almacen import Almacen
from ..models.item import Item
from ..schemas.almacen import Almacen as AlmacenSchema, AlmacenCreate, AlmacenUpdate

router = APIRouter(prefix="/almacenes", tags=["Almacenes"])

@router.get("/", response_model=List[AlmacenSchema])
def get_almacenes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # ✅ Traer TODOS los almacenes activos (sin importar si tienen items)
    almacenes = db.query(Almacen).filter(Almacen.activo == True).offset(skip).limit(limit).all()
    
    # ✅ Agregar conteo de items a cada almacén
    for almacen in almacenes:
        almacen.items_count = db.query(func.count(Item.id)).filter(
            Item.almacen_id == almacen.id, 
            Item.activo == True
        ).scalar() or 0
    
    return almacenes

@router.get("/{almacen_id}", response_model=AlmacenSchema)
def get_almacen(almacen_id: int, db: Session = Depends(get_db)):
    almacen = db.query(Almacen).filter(Almacen.id == almacen_id, Almacen.activo == True).first()
    if not almacen:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    
    # ✅ Agregar conteo de items
    almacen.items_count = db.query(func.count(Item.id)).filter(
        Item.almacen_id == almacen_id, 
        Item.activo == True
    ).scalar() or 0
    
    return almacen

@router.post("/", response_model=AlmacenSchema, status_code=status.HTTP_201_CREATED)
def create_almacen(almacen: AlmacenCreate, db: Session = Depends(get_db)):
    db_almacen = Almacen(**almacen.model_dump())
    db.add(db_almacen)
    db.commit()
    db.refresh(db_almacen)
    return db_almacen

@router.put("/{almacen_id}", response_model=AlmacenSchema)
def update_almacen(almacen_id: int, almacen_update: AlmacenUpdate, db: Session = Depends(get_db)):
    db_almacen = db.query(Almacen).filter(Almacen.id == almacen_id).first()
    if not db_almacen:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    
    update_data = almacen_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_almacen, key, value)
    
    db.commit()
    db.refresh(db_almacen)
    return db_almacen

@router.delete("/{almacen_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_almacen(almacen_id: int, db: Session = Depends(get_db)):
    db_almacen = db.query(Almacen).filter(Almacen.id == almacen_id).first()
    if not db_almacen:
        raise HTTPException(status_code=404, detail="Almacén no encontrado")
    
    db_almacen.activo = False
    db.commit()
    return None