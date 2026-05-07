"""Local development runner — not used by Vercel."""
import os

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.index import app

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

app.mount("/static", StaticFiles(directory=os.path.join(PUBLIC_DIR, "static")), name="static")


@app.get("/display")
async def display_page():
    return FileResponse(os.path.join(PUBLIC_DIR, "display.html"))


@app.get("/admin")
async def admin_page():
    return FileResponse(os.path.join(PUBLIC_DIR, "admin.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
