from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .routers import almacenes, items

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Gestión de Almacenes",
    description="API para gestionar múltiples almacenes e inventario",
    version="1.0.0"
)

# ============================================
# CONFIGURACIÓN CORS CORRECTA (Para desarrollo)
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",     # Frontend en desarrollo (React)
        "http://127.0.0.1:3000",     # Frontend en desarrollo (alternativo)
        "http://localhost:5173",     # Si usas Vite en vez de CRA
        "https://*.vercel.app",      # Frontend en producción (Vercel)
    ],
    allow_credentials=True,
    allow_methods=["*"],             # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],             # Permite todos los headers
    expose_headers=["*"],            # Expone todos los headers
    max_age=3600,                    # Cache de preflight por 1 hora
)

# Incluir routers
app.include_router(almacenes.router)
app.include_router(items.router)

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