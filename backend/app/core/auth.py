from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# ✅ MODO DESARROLLO: Siempre retorna un usuario admin
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Ignorar el token, siempre retorna un usuario válido
    return {"user": {"email": "admin@almacenes.com", "id": "temp-user", "role": "admin"}}

# ✅ MODO DESARROLLO: Siempre permite el acceso
async def require_admin(current_user = Depends(get_current_user)):
    # Siempre retorna el usuario sin verificar
    return current_user