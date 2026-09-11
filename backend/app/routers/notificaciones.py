from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.item import Item
from ..utils.email_service import send_low_stock_alert, send_email

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.post("/test")
def test_email():
    """Envía un email de prueba."""
    result = send_email(
        to=["larryfranckp@gmail.com"],
        subject="✅ Prueba de notificación",
        html="<h1>¡Funciona!</h1><p>Las notificaciones por email están configuradas correctamente.</p>"
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return {"message": "Email enviado correctamente", "result": result}


@router.post("/low-stock/")
def check_low_stock(db: Session = Depends(get_db)):
    """
    Verifica todos los productos con stock bajo y envía notificaciones.
    """
    # Buscar productos con stock bajo
    low_stock_items = db.query(Item).filter(
        Item.activo == True,
        Item.stock <= Item.stock_minimo
    ).all()

    if not low_stock_items:
        return {"message": "No hay productos con stock bajo", "count": 0}

    sent = []
    for item in low_stock_items:
        result = send_low_stock_alert(
            product_name=item.nombre,
            product_code=item.codigo,
            current_stock=item.stock,
            min_stock=item.stock_minimo,
            warehouse_name=item.almacen.nombre if item.almacen else "N/A"
        )
        sent.append({
            "product": item.nombre,
            "success": result.get("success")
        })

    return {
        "message": f"Se enviaron {len(sent)} notificaciones",
        "count": len(sent),
        "details": sent
    }
