from functools import lru_cache

from cryptography.fernet import Fernet

from config.config import config


@lru_cache(maxsize=1)
def _fernet() -> Fernet:
    key = config.get("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY is not set")
    return Fernet(key.encode())


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    """Used by the sender later. Raises cryptography.fernet.InvalidToken if the key changed."""
    return _fernet().decrypt(value.encode()).decode()