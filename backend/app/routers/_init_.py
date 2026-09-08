from .almacenes import router as almacenes_router
from .items import router as items_router
from .configuracion import router as configuracion_router

__all__ = ["almacenes_router", "items_router", "configuracion_router"]