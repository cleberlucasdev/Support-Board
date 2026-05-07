import hashlib
import os

from fastapi import Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from api.index import app

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

app.mount("/static", StaticFiles(directory=os.path.join(PUBLIC_DIR, "static")), name="static")


def _make_token(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _is_authed(request: Request) -> bool:
    pw = os.environ.get("ACCESS_PASSWORD", "")
    return request.cookies.get("noc_auth") == _make_token(pw)


@app.post("/auth")
async def auth_login(req: Request):
    pw = os.environ.get("ACCESS_PASSWORD", "")
    body = await req.json()
    if body.get("password", "") != pw:
        return JSONResponse({"ok": False, "detail": "Senha incorreta"}, status_code=401)
    resp = JSONResponse({"ok": True})
    resp.set_cookie("noc_auth", _make_token(pw), httponly=True, samesite="lax", max_age=86400 * 30)
    return resp


@app.get("/")
async def root():
    return RedirectResponse("/admin", status_code=302)


@app.get("/login")
async def login_page():
    return FileResponse(os.path.join(PUBLIC_DIR, "login.html"))


@app.get("/display")
async def display_page(request: Request):
    if not _is_authed(request):
        return RedirectResponse("/login?next=/display", status_code=302)
    return FileResponse(os.path.join(PUBLIC_DIR, "display.html"))


@app.get("/admin")
async def admin_page(request: Request):
    if not _is_authed(request):
        return RedirectResponse("/login?next=/admin", status_code=302)
    return FileResponse(os.path.join(PUBLIC_DIR, "admin.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
