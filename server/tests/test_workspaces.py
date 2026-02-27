import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_workspace(auth_client: AsyncClient):
    response = await auth_client.post("/api/workspaces", json={"name": "My Workspace"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Workspace"
    assert data["role"] == "owner"


@pytest.mark.asyncio
async def test_list_workspaces(auth_client: AsyncClient):
    await auth_client.post("/api/workspaces", json={"name": "WS 1"})
    await auth_client.post("/api/workspaces", json={"name": "WS 2"})
    response = await auth_client.get("/api/workspaces")
    assert response.status_code == 200
    assert len(response.json()) >= 2


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    response = await client.get("/api/workspaces")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_task_in_workspace(auth_client: AsyncClient):
    ws_resp = await auth_client.post("/api/workspaces", json={"name": "Task WS"})
    ws_id = ws_resp.json()["id"]

    board_resp = await auth_client.get(f"/api/workspaces/{ws_id}/board")
    assert board_resp.status_code == 200

    col_resp = await auth_client.post(
        f"/api/workspaces/{ws_id}/board/columns",
        json={"name": "To Do"},
    )
    assert col_resp.status_code == 201
    col_id = col_resp.json()["id"]

    task_resp = await auth_client.post(
        f"/api/workspaces/{ws_id}/board/columns/{col_id}/tasks",
        json={"title": "First Task", "priority": "high"},
    )
    assert task_resp.status_code == 201
    assert task_resp.json()["title"] == "First Task"
    assert task_resp.json()["priority"] == "high"


@pytest.mark.asyncio
async def test_invitation_flow(client: AsyncClient):
    # Register owner
    owner_resp = await client.post("/api/auth/register", json={
        "email": "inv_owner@example.com",
        "name": "Owner",
        "password": "pass123",
    })
    owner_token = owner_resp.json()["access_token"]

    # Register member
    member_resp = await client.post("/api/auth/register", json={
        "email": "inv_member@example.com",
        "name": "Member",
        "password": "pass123",
    })
    member_token = member_resp.json()["access_token"]

    # Owner creates workspace
    client.headers["Authorization"] = f"Bearer {owner_token}"
    ws_resp = await client.post("/api/workspaces", json={"name": "Invite WS"})
    ws_id = ws_resp.json()["id"]

    # Owner creates invitation
    inv_resp = await client.post(
        f"/api/invitations/workspace/{ws_id}",
        json={"email": "inv_member@example.com"},
    )
    assert inv_resp.status_code == 201
    inv_token = inv_resp.json()["token"]

    # Member accepts invitation
    client.headers["Authorization"] = f"Bearer {member_token}"
    accept_resp = await client.post(
        "/api/invitations/accept",
        json={"token": inv_token},
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # Member can now see workspace
    ws_list = await client.get("/api/workspaces")
    assert any(ws["id"] == ws_id for ws in ws_list.json())


@pytest.mark.asyncio
async def test_access_control(client: AsyncClient):
    # Register two users
    user1_resp = await client.post("/api/auth/register", json={
        "email": "ac_user1@example.com",
        "name": "User 1",
        "password": "pass123",
    })
    user1_token = user1_resp.json()["access_token"]

    user2_resp = await client.post("/api/auth/register", json={
        "email": "ac_user2@example.com",
        "name": "User 2",
        "password": "pass123",
    })
    user2_token = user2_resp.json()["access_token"]

    # User 1 creates workspace
    client.headers["Authorization"] = f"Bearer {user1_token}"
    ws_resp = await client.post("/api/workspaces", json={"name": "Private WS"})
    ws_id = ws_resp.json()["id"]

    # User 2 tries to access the board
    client.headers["Authorization"] = f"Bearer {user2_token}"
    board_resp = await client.get(f"/api/workspaces/{ws_id}/board")
    assert board_resp.status_code == 403
