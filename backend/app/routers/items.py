from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from openpyxl import load_workbook
import io
from ..core.database import get_db
from ..models.item import Item
from ..schemas.item import Item as ItemSchema, ItemCreate, ItemUpdate
from ..utils.audit_helper import registrar_auditoria, registrar_cambios_item

router = APIRouter(prefix="/items", tags=["Items"])


# ============================================
# HELPERS
# ============================================
def normalizar_codigo(codigo):
    """Convierte un código a string, eliminando espacios y decimales .0"""
    if codigo is None:
        return ""
    s = str(codigo).strip()
    # Si es un número flotante (ej: 204240009.0), quitar el .0
    if s.endswith(".0"):
        s = s[:-2]
    return s


def encontrar_columna(headers, posibles_nombres):
    """Busca una columna en los headers que coincida con alguno de los posibles nombres."""
    for idx, h in enumerate(headers):
        if h is None:
            continue
        h_norm = str(h).strip().lower()
        for nombre in posibles_nombres:
            if nombre in h_norm:
                return idx
    return None


# ============================================
# ENDPOINTS EXISTENTES
# ============================================
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
    
    registrar_auditoria(
        db=db,
        accion="crear",
        tabla="items",
        registro_id=db_item.id,
        campo=None,
        valor_anterior=None,
        valor_nuevo=f"Producto '{db_item.nombre}' (código: {db_item.codigo})",
        usuario_email=None,
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
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
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
        usuario_email=None,
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
    
    nombre_producto = db_item.nombre
    codigo_producto = db_item.codigo
    
    db_item.activo = False
    db.commit()
    
    registrar_auditoria(
        db=db,
        accion="eliminar",
        tabla="items",
        registro_id=item_id,
        campo=None,
        valor_anterior=f"Producto '{nombre_producto}' (código: {codigo_producto})",
        valor_nuevo=None,
        usuario_email=None,
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
    
    registrar_auditoria(
        db=db,
        accion="editar",
        tabla="items",
        registro_id=item_id,
        campo="stock",
        valor_anterior=stock_anterior,
        valor_nuevo=nueva_cantidad,
        usuario_email=None,
        request=request
    )
    
    return {"id": item_id, "stock": db_item.stock}


# ============================================
# ✅ NUEVOS ENDPOINTS PARA ACTUALIZACIÓN MASIVA
# ============================================

@router.post("/preview-bulk-update")
async def preview_bulk_update(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analiza un Excel y devuelve los cambios que se aplicarían, SIN modificar la BD.
    Solo requiere las columnas 'codigo' y 'stock'. Las demás son ignoradas.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos Excel (.xlsx, .xls)")
    
    try:
        contents = await file.read()
        workbook = load_workbook(io.BytesIO(contents), data_only=True)
        sheet = workbook.active
        
        # Leer encabezados (buscar la fila con "codigo" y "stock")
        headers = []
        header_row_idx = 0
        for row_idx, row in enumerate(sheet.iter_rows(min_row=1, max_row=20, values_only=True), start=1):
            row_values = [str(v).strip().lower() if v else "" for v in row]
            if any("codigo" in v or "código" in v or "cod" == v for v in row_values) and \
               any("stock" in v or "stock" in v or "cantidad" in v for v in row_values):
                headers = list(row)
                header_row_idx = row_idx
                break
        
        if not headers:
            raise HTTPException(status_code=400, detail="No se encontró una fila con columnas 'codigo' y 'stock' en el Excel")
        
        # Buscar índices de las columnas
        idx_codigo = encontrar_columna(headers, ["codigo", "código", "cod", "código2"])
        idx_stock = encontrar_columna(headers, ["stock", "stock ", "cantidad", "stoc"])
        
        if idx_codigo is None:
            raise HTTPException(status_code=400, detail="No se encontró la columna 'codigo'")
        if idx_stock is None:
            raise HTTPException(status_code=400, detail="No se encontró la columna 'stock'")
        
        cambios = []
        no_encontrados = []
        errores = []
        total_filas = 0
        
        # Procesar cada fila
        for row in sheet.iter_rows(min_row=header_row_idx + 1, values_only=True):
            try:
                if not row or all(v is None for v in row):
                    continue
                
                total_filas += 1
                codigo_raw = row[idx_codigo] if idx_codigo < len(row) else None
                stock_raw = row[idx_stock] if idx_stock < len(row) else None
                
                codigo = normalizar_codigo(codigo_raw)
                
                if not codigo:
                    continue
                
                # Ignorar filas que no sean códigos válidos (números o alfanuméricos sin espacios raros)
                if len(codigo) < 3 or len(codigo) > 30:
                    continue
                
                # Parsear stock
                try:
                    stock_nuevo = float(stock_raw) if stock_raw is not None and str(stock_raw).strip() != "" else None
                except (ValueError, TypeError):
                    stock_nuevo = None
                
                # Buscar el producto por código
                db_item = db.query(Item).filter(Item.codigo == codigo).first()
                
                if db_item:
                    stock_anterior = db_item.stock or 0
                    stock_nuevo_final = stock_nuevo if stock_nuevo is not None else stock_anterior
                    
                    if stock_anterior != stock_nuevo_final:
                        cambios.append({
                            "item_id": db_item.id,
                            "codigo": db_item.codigo,
                            "nombre": db_item.nombre,
                            "stock_anterior": float(stock_anterior),
                            "stock_nuevo": float(stock_nuevo_final),
                            "diferencia": float(stock_nuevo_final - stock_anterior),
                            "almacen": db_item.almacen.nombre if db_item.almacen else "Sin almacén"
                        })
                else:
                    no_encontrados.append(codigo)
                    
            except Exception as e:
                errores.append(f"Fila con código {codigo_raw}: {str(e)}")
        
        return {
            "total_filas": total_filas,
            "total_cambios": len(cambios),
            "total_no_encontrados": len(no_encontrados),
            "total_errores": len(errores),
            "cambios": cambios,
            "no_encontrados": no_encontrados[:100],  # Limitar a 100
            "errores": errores[:20]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el Excel: {str(e)}")


@router.post("/apply-bulk-update")
def apply_bulk_update(
    cambios: List[Dict[str, Any]] = Body(...),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Aplica solo los cambios aprobados por el usuario.
    Recibe una lista de {item_id, stock_nuevo}.
    """
    try:
        actualizados = 0
        errores = []
        
        for cambio in cambios:
            try:
                item_id = cambio.get("item_id")
                stock_nuevo = cambio.get("stock_nuevo")
                
                if item_id is None or stock_nuevo is None:
                    continue
                
                db_item = db.query(Item).filter(Item.id == item_id).first()
                if not db_item:
                    errores.append(f"Item {item_id} no encontrado")
                    continue
                
                stock_anterior = db_item.stock or 0
                db_item.stock = float(stock_nuevo)
                actualizados += 1
                
                # Registrar auditoría individual
                registrar_auditoria(
                    db=db,
                    accion="editar",
                    tabla="items",
                    registro_id=item_id,
                    campo="stock",
                    valor_anterior=stock_anterior,
                    valor_nuevo=stock_nuevo,
                    usuario_email=None,
                    request=request
                )
            except Exception as e:
                errores.append(f"Error al actualizar item {cambio.get('item_id')}: {str(e)}")
        
        db.commit()
        
        # Registrar evento global de importación
        registrar_auditoria(
            db=db,
            accion="importar",
            tabla="items",
            registro_id=None,
            campo="bulk_update",
            valor_anterior=None,
            valor_nuevo=f"{actualizados} productos actualizados desde Excel",
            usuario_email=None,
            request=request
        )
        
        return {
            "message": "Actualización masiva completada",
            "actualizados": actualizados,
            "errores": len(errores),
            "detalle_errores": errores[:20]
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al aplicar cambios: {str(e)}")