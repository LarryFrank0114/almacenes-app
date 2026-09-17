from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from .core.database import engine, Base
from .routers import almacenes, items, configuracion, usuarios, notificaciones, movimientos

app = FastAPI(
    title="Sistema de Gestión de Almacenes",
    description="API para gestionar múltiples almacenes e inventario",
    version="1.0.0"
)

# ✅ CRÍTICO: Confiar en los headers del proxy de Railway
# Esto hace que FastAPI detecte correctamente HTTPS detrás del proxy
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://almacenes-app-five.vercel.app",
        "https://almacenes-app-larrys-projects-c1f6434d.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Routers
app.include_router(almacenes.router)
app.include_router(items.router)
app.include_router(configuracion.router)
app.include_router(usuarios.router)
app.include_router(notificaciones.router)
app.include_router(movimientos.router)  # ✅ NUEVO

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {
        "message": "API de Gestión de Almacenes",
        "version": "1.0.0",
        "endpoints": {
            "almacenes": "/almacenes/",
            "items": "/items/",
            "notificaciones": "/notificaciones/",
            "movimientos": "/movimientos/"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}