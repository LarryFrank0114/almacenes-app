import os
import resend
from typing import List, Optional

# ✅ Configurar API Key
resend.api_key = os.getenv("RESEND_API_KEY")

EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
EMAIL_ADMIN = os.getenv("EMAIL_ADMIN", "admin@example.com")


def send_email(
    to: List[str],
    subject: str,
    html: str,
    from_email: Optional[str] = None
) -> dict:
    """
    Envía un email usando Resend.
    """
    try:
        if not resend.api_key:
            print("⚠️ RESEND_API_KEY no configurada, saltando envío de email")
            return {"success": False, "error": "API Key no configurada"}

        params = {
            "from": from_email or EMAIL_FROM,
            "to": to,
            "subject": subject,
            "html": html,
        }

        response = resend.Emails.send(params)
        print(f"✅ Email enviado a {to}: {response}")
        return {"success": True, "response": response}

    except Exception as e:
        print(f"❌ Error al enviar email: {e}")
        return {"success": False, "error": str(e)}


def send_low_stock_alert(
    product_name: str,
    product_code: str,
    current_stock: float,
    min_stock: float,
    warehouse_name: str,
    to_email: Optional[str] = None
) -> dict:
    """
    Envía una notificación de stock bajo.
    """
    subject = f"⚠️ Stock Bajo: {product_name}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .content {{ padding: 30px; }}
        .alert-box {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .info-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
        .info-label {{ font-weight: bold; color: #555; }}
        .info-value {{ color: #333; }}
        .stock-critical {{ color: #dc3545; font-weight: bold; font-size: 18px; }}
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
          <p>El siguiente producto ha alcanzado un nivel de stock crítico:</p>
          
          <div class="alert-box">
            <strong>{product_name}</strong>
          </div>
          
          <div class="info-row">
            <span class="info-label">Código:</span>
            <span class="info-value">{product_code}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Almacén:</span>
            <span class="info-value">{warehouse_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Stock Actual:</span>
            <span class="info-value stock-critical">{current_stock}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Stock Mínimo:</span>
            <span class="info-value">{min_stock}</span>
          </div>
          
          <p style="margin-top: 30px;">Por favor, considera reabastecer este producto lo antes posible.</p>
        </div>
        <div class="footer">
          <p>Sistema de Gestión de Almacenes</p>
          <p>Este es un mensaje automático, no responder.</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    return send_email(
        to=[to_email or EMAIL_ADMIN],
        subject=subject,
        html=html
    )


def send_movement_notification(
    movement_type: str,
    product_name: str,
    quantity: float,
    warehouse_name: str,
    user_name: str,
    to_email: Optional[str] = None
) -> dict:
    """
    Envía una notificación de nuevo movimiento.
    """
    subject = f"📦 Nuevo Movimiento: {movement_type} - {product_name}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #00d4ff, #00ff87); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .content {{ padding: 30px; }}
        .info-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
        .info-label {{ font-weight: bold; color: #555; }}
        .info-value {{ color: #333; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Nuevo Movimiento</h1>
        </div>
        <div class="content">
          <p>Se ha registrado un nuevo movimiento en el sistema:</p>
          
          <div class="info-row">
            <span class="info-label">Tipo:</span>
            <span class="info-value">{movement_type}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Producto:</span>
            <span class="info-value">{product_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cantidad:</span>
            <span class="info-value">{quantity}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Almacén:</span>
            <span class="info-value">{warehouse_name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Usuario:</span>
            <span class="info-value">{user_name}</span>
          </div>
        </div>
        <div class="footer">
          <p>Sistema de Gestión de Almacenes</p>
        </div>
      </div>
    </body>
    </html>
    """
    
    return send_email(
        to=[to_email or EMAIL_ADMIN],
        subject=subject,
        html=html
    )
