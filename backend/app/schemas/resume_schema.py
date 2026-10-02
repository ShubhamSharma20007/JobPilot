from models.file_model import File as FileModel


def resume_out(f: FileModel) -> dict:
    """Serialize a files row. Shape matches the client's Resume type."""
    return {
        "id": str(f.id),
        "name": f.original_name,
        "size": f.size_bytes,
        "uploadedAt": f.created_at.isoformat() if f.created_at else None,
        "isDefault": bool(f.is_default),
        "url": f.file_path,
    }