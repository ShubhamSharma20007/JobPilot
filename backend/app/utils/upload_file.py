import re
import uuid

from imagekitio import ImageKit

from config.config import config


imagekit = ImageKit(private_key=config["IMAGEKIT_PRIVATE_KEY"])


def _safe_name(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)[:100] or "file"


def uploadFile(data: bytes, filename: str, folder: str = "/attachments", tags: list[str] | None = None):
    """Upload raw bytes to ImageKit. Returns the SDK response (.url, .file_id). Raises on failure."""
    return imagekit.files.upload(
        file=data,
        file_name=f"{uuid.uuid4().hex}_{_safe_name(filename)}",
        folder=folder,
        tags=tags or [],
    )


def deleteFile(file_id: str) -> None:
    """Best-effort delete, used to clean up when the DB write fails."""
    try:
        imagekit.files.delete(file_id)
    except Exception as e:
        print("ImageKit delete failed:", e)  # replace with real logging