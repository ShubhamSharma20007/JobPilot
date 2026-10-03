import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.config import config
from urllib.parse import quote_plus

# Render provides DATABASE_URL directly; fall back to individual vars for local dev
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render uses postgres:// scheme; SQLAlchemy needs postgresql+psycopg://
    CONNECTION_STRING = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
else:
    CONNECTION_STRING = (
        f"postgresql+psycopg://{config['DB_USER']}:{quote_plus(config['DB_PASSWORD'])}"
        f"@{config['DB_HOST']}:{config['DB_PORT']}/{config['DB_DATABASE']}"
    )

engine = create_engine(CONNECTION_STRING,
 pool_pre_ping=True,
 echo=True ,
 pool_recycle=300,
 connect_args={"prepare_threshold": None})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
