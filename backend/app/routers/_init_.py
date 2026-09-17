from .almacenes import router as almacenes_router
from .items import router as items_router
from .configuracion import router as configuracion_router
from .usuarios import router as usuarios_router
from .notificaciones import router as notificaciones_router
from .movimientos import router as movimientos_router
from .audit_log import router as audit_log_router

__all__ = [
    "almacenes_router",
    "items_router",
    "configuracion_router",
    "usuarios_router",
    "notificaciones_router",
    "movimientos_router",
    "audit_log_router",
]