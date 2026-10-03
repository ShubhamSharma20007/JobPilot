from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text

from routes import auth_router, user_router,file_route,settings_route,gmail_route,sheet_route
from config.config import config
from database.db import engine, Base
from middlewares.auth_middleware import auth_middleware
from scheduler import scheduler, start_scheduler

app = FastAPI(
    title="JobPilot API",
    description="API for JobPilot application",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(BaseHTTPMiddleware, dispatch=auth_middleware)  # inner
app.add_middleware(                                               # outer, added last
    CORSMiddleware,
    allow_origins=[
        config["CLIENT_URL"],
        'https://jobpilot-1bc0e.firebaseapp.com',
        'https://jobpilot-1bc0e.web.app'
    ],
    allow_credentials=True,
    allow_methods=["GET","POST","DELETE","PUT","PATCH"],
    allow_headers=["*"],
)
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(user_router.router, prefix="/user", tags=["user"])
app.include_router(file_route.router, prefix="/file", tags=["file"])
app.include_router(settings_route.router, prefix="/settings", tags=["settings"])
app.include_router(gmail_route.router, prefix="/gmail", tags=["gmail"])
app.include_router(sheet_route.router, prefix="/sheet", tags=["sheet"])


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    


@app.get("/")
async def root():
    return {"message": "Server is running!"}


@app.get("/db-check")
async def db_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "detail": str(e)}