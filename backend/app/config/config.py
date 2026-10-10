import os
# from dotenv import load_dotenv
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# load_dotenv(os.path.join(BASE_DIR, ".env"))


def getKey(key:str)->str|None:
    return os.getenv(key)

config = {
    "GOOGLE_CLIENT_ID": getKey("GOOGLE_CLIENT_ID") or None,
    "GOOGLE_CLIENT_SECRET": getKey("GOOGLE_CLIENT_SECRET") or None,
    "GOOGLE_REDIRECT_URI": getKey("GOOGLE_REDIRECT_URI") or None,
    "GOOGLE_AUTH_URI": getKey("GOOGLE_AUTH_URI") or None,
    "GOOGLE_SPREADSHEET_ID": getKey("GOOGLE_SPREADSHEET_ID") or None,
    "GOOGLE_GMAIL_ID": getKey("GOOGLE_GMAIL_ID") or None,
    "CLIENT_URL": getKey("CLIENT_URL") or None,
    "DB_PASSWORD":getKey('DB_PASSWORD') or None,
    "DB_DATABASE":getKey('DB_DATABASE') or None,
    "SUPABASE_SECRET_KEY":getKey('SUPABASE_SECRET_KEY') or None,
    "DB_PORT":getKey('DB_PORT') or None,
    "DB_HOST":getKey('DB_HOST') or None,
    "DB_USER":getKey('DB_USER') or None,
    "JWT_SECRET": getKey('JWT_SECRET') or None,
    "JWT_ALGORITHM": getKey('JWT_ALGORITHM') or 'HS256',
    "JWT_EXPIRE_DAYS": int(getKey('JWT_EXPIRE_DAYS') or 7),
    "IMAGEKIT_PUBLIC_KEY":getKey('IMAGEKIT_PUBLIC_KEY') or None,
    "IMAGEKIT_PRIVATE_KEY":getKey('IMAGEKIT_PRIVATE_KEY') or None,
    "IMAGEKIT_URL_ENDPOINT":getKey('IMAGEKIT_URL_ENDPOINT') or None,
    "ENCRYPTION_KEY":getKey('ENCRYPTION_KEY') or None,
    "REDIS_URL": getKey("REDIS_URL") or None,
    "RENDER":getKey('RENDER') or "",
    "ADZUNA_APP_ID": getKey("ADZUNA_APP_ID"),
    "ADZUNA_APP_KEY": getKey("ADZUNA_APP_KEY"),
    "OPENWEBNINJA_API_KEY": getKey("OPENWEBNINJA_API_KEY"),
}