import os
import uvicorn

if __name__ == "__main__":
    on_render = os.getenv("RENDER") is not None  # Render sets this automatically
    uvicorn.run(
        "main:app",
        host="0.0.0.0" if on_render else "localhost",
        port=int(os.getenv("PORT", 8001)),
        reload=not on_render,
    )
