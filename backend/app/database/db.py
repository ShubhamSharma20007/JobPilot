from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.config import config
from urllib.parse import quote_plus

CONNECTION_STRING = (
    f"postgresql+psycopg://{config['DB_USER']}:{quote_plus(config['DB_PASSWORD'])}"
    f"@{config['DB_HOST']}:{config['DB_PORT']}/{config['DB_DATABASE']}"
)

engine = create_engine(CONNECTION_STRING, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()