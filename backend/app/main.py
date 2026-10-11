from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text

from routes import auth_router, user_router, file_route, settings_route, gmail_route, sheet_route, jobs_route
from config.config import config
from database.db import engine, Base, SessionLocal
from middlewares.auth_middleware import auth_middleware
from scheduler import start_scheduler
from models.job_model import Job
from utils.categories import classify

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
        'https://jobpilot-1bc0e.web.app',
    ],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH"],
    allow_headers=["*"],
)
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(user_router.router, prefix="/user", tags=["user"])
app.include_router(file_route.router, prefix="/file", tags=["file"])
app.include_router(settings_route.router, prefix="/settings", tags=["settings"])
app.include_router(gmail_route.router, prefix="/gmail", tags=["gmail"])
app.include_router(sheet_route.router, prefix="/sheet", tags=["sheet"])
app.include_router(jobs_route.router, prefix="/jobs", tags=["jobs"])


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category VARCHAR(32)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_jobs_category ON jobs (category)"))

    db = SessionLocal()
    try:  # tag jobs saved before categories existed; classify() never returns None, so this ends
        while True:
            batch = db.query(Job).filter(Job.category.is_(None)).limit(500).all()
            if not batch:
                break
            for j in batch:
                j.category = classify(j.title, j.description)
            db.commit()
    except Exception as e:   # never block the server from starting
        db.rollback()
        print("startup: category backfill failed:", e)
    finally:
        db.close()

    start_scheduler()


@app.get("/")
async def root():
    return {"message": "Server is running!"}


@app.api_route("/db-check", methods=["GET", "HEAD"])
async def db_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "detail": str(e)}