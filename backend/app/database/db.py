from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.config import config
from urllib.parse import quote_plus
CONNECTION_STRING = (
    f"postgresql+psycopg://postgres:{quote_plus(config['DB_PASSWORD'])}"
    f"@db.orispqjazqegvexhciba.supabase.co:"
    f"{config['DB_PORT']}/{config['DB_DATABASE']}"
)


engine = create_engine(CONNECTION_STRING,pool_pre_ping=True,echo=True)
print(engine.url.render_as_string(hide_password=True))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
