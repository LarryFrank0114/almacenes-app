from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .routers import almacenes, items

app = FastAPI(
    title="Sistema de Gestión de Almacenes",
    description="API para gestionar múltiples almacenes e inventario",
    version="1.0.0"
)

# ✅ CONFIGURACIÓN CORS (CON TU DOMINIO DE VERCEL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://almacenes-app-five.vercel.app",  # ✅ TU DOMINIO DE PRODUCCIÓN
        "https://almacenes-app-larrys-projects-c1f6434d.vercel.app",  # ✅ URL de preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(almacenes.router)
app.include_router(items.router)

# ✅ EVENTO DE STARTUP
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
            "items": "/items/"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
