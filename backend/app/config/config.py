import os
# from dotenv import load_dotenv
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# load_dotenv(os.path.join(BASE_DIR, ".env"))


def getKey(key:str)->str|None:
    return os.getenv(key)

config = {
    "GOOGLE_CLIENT_ID": getKey("GOOGLE_CLIENT_ID"),
    "GOOGLE_CLIENT_SECRET": getKey("GOOGLE_CLIENT_SECRET"),
    "GOOGLE_REDIRECT_URI": getKey("GOOGLE_REDIRECT_URI"),
    "GOOGLE_AUTH_URI": getKey("GOOGLE_AUTH_URI"),
    "GOOGLE_SPREADSHEET_ID": getKey("GOOGLE_SPREADSHEET_ID"),
    "GOOGLE_GMAIL_ID": getKey("GOOGLE_GMAIL_ID"),
    "CLIENT_URL": getKey("CLIENT_URL"),
    "DB_PASSWORD":getKey('DB_PASSWORD'),
    "DB_DATABASE":getKey('DB_DATABASE'),
    "SUPABASE_SECRET_KEY":getKey('SUPABASE_SECRET_KEY'),
    "DB_PORT":getKey('DB_PORT'),
    "DB_HOST":getKey('DB_HOST'),
    "DB_USER":getKey('DB_USER'),
    "JWT_SECRET": getKey('JWT_SECRET'),
    "JWT_ALGORITHM": getKey('JWT_ALGORITHM') or 'HS256',
    "JWT_EXPIRE_DAYS": int(getKey('JWT_EXPIRE_DAYS') or 7),
}