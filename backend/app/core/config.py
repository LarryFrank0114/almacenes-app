import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "change_this_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

settings = type('Settings', (), {
    'SUPABASE_URL': SUPABASE_URL,
    'SUPABASE_KEY': SUPABASE_KEY,
    'DATABASE_URL': DATABASE_URL,
    'SECRET_KEY': SECRET_KEY,
    'ALGORITHM': ALGORITHM,
    'ACCESS_TOKEN_EXPIRE_MINUTES': ACCESS_TOKEN_EXPIRE_MINUTES
})()