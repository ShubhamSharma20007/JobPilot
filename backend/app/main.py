from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth_router
from config.config import config
from database.db import engine, Base
from sqlalchemy import text
import models.user_model  # ensures the model is registered with Base


app = FastAPI(
    title="JobPilot API",
    description="API for JobPilot application",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config["CLIENT_URL"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)


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
