from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, users, workspaces, invitations, boards

app = FastAPI(
    title="Velora",
    description="Task Planner + CRM Board API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(invitations.router, prefix="/api")
app.include_router(boards.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
