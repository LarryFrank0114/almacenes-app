from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.item import Item
from ..utils.email_service import send_low_stock_alert, send_email

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.post("/test/")
def test_email():
    """Envía un email de prueba."""
    result = send_email(
        to=["larryfranckp@gmail.com"],
        subject="✅ Prueba de notificación",
        html="<h1>¡Funciona!</h1><p>Las notificaciones por email están configuradas correctamente.</p>"
    )
    if not result.get("success"):
        return {
           "success": False,
           "error": result.get("error"),
           "message": "Error al enviar email. Revisa la configuración de Resend."
         }

@router.post("/low-stock/")
def check_low_stock(
    limit: int = 10,  # ✅ Limitar a 10 productos por defecto
    send_individual: bool = False,  # ✅ Enviar un solo email resumen
    db: Session = Depends(get_db)
):
    """
    Verifica todos los productos con stock bajo y envía notificaciones.
    
    - limit: Máximo de productos a incluir (default: 10)
    - send_individual: Si es True, envía un email por producto. Si es False, envía un email resumen.
    """
    # Buscar productos con stock bajo
    low_stock_items = db.query(Item).filter(
        Item.activo == True,
        Item.stock <= Item.stock_minimo
    ).limit(limit).all()

    total_count = db.query(Item).filter(
        Item.activo == True,
        Item.stock <= Item.stock_minimo
    ).count()

    if not low_stock_items:
        return {"message": "No hay productos con stock bajo", "count": 0, "total": 0}

    # ✅ OPCIÓN 1: Email RESUMEN (más rápido, 1 solo email)
    if not send_individual:
        rows_html = ""
        for item in low_stock_items:
            rows_html += f"""
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.codigo}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.nombre}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.almacen.nombre if item.almacen else 'N/A'}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc3545; font-weight: bold;">{item.stock}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.stock_minimo}</td>
            </tr>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 30px; text-align: center; }}
            .content {{ padding: 30px; }}
            .alert-box {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th {{ background: #00d4ff; color: white; padding: 10px; text-align: left; }}
            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Alerta de Stock Bajo</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>Se han detectado <strong>{total_count}</strong> productos con stock bajo. Aquí los primeros {len(low_stock_items)}:</p>
              
              <div class="alert-box">
                <strong>Acción requerida:</strong> Por favor, reabastece estos productos lo antes posible.
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Almacén</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows_html}
                </tbody>
              </table>
            </div>
            <div class="footer">
              <p>Sistema de Gestión de Almacenes</p>
              <p>Este es un mensaje automático, no responder.</p>
            </div>
          </div>
        </body>
        </html>
        """

        result = send_email(
            to=["larryfranckp@gmail.com"],
            subject=f"⚠️ Alerta de Stock Bajo: {total_count} productos",
            html=html
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error"))

        return {
            "message": f"Se envió 1 email resumen con {len(low_stock_items)} productos (de {total_count} totales)",
            "count": len(low_stock_items),
            "total": total_count,
            "mode": "resumen"
        }

    # ✅ OPCIÓN 2: Email INDIVIDUAL por producto (más lento)
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
        "message": f"Se enviaron {len(sent)} notificaciones individuales",
        "count": len(sent),
        "total": total_count,
        "mode": "individual",
        "details": sent
    }
