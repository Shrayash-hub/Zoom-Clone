"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
import json
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import meetings, participants, users
from seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup, then seed if empty (idempotent — safe on every restart)."""
    Base.metadata.create_all(bind=engine)
    seed()
    yield


app = FastAPI(
    title="Zoom Clone API",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow all origins for development — tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(meetings.router, prefix="/api")
app.include_router(participants.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Zoom Clone API is running"}


# --- WebSocket Real-Time Presence ---

class ConnectionManager:
    def __init__(self):
        # Dict mapping meeting_id -> list of (websocket, participant_info) tuples
        self.rooms: dict[str, list] = {}

    async def connect(self, websocket: WebSocket, meeting_id: str, participant: dict):
        await websocket.accept()
        if meeting_id not in self.rooms:
            self.rooms[meeting_id] = []
        self.rooms[meeting_id].append((websocket, participant))
        await self.broadcast(meeting_id)  # notify all on join

    def disconnect(self, websocket: WebSocket, meeting_id: str):
        if meeting_id in self.rooms:
            self.rooms[meeting_id] = [
                (ws, p) for ws, p in self.rooms[meeting_id] if ws != websocket
            ]
        # clean up empty rooms
        if meeting_id in self.rooms and not self.rooms[meeting_id]:
            del self.rooms[meeting_id]

    async def broadcast(self, meeting_id: str):
        # Send updated participant list to every connected client in the room
        if meeting_id not in self.rooms:
            return
        participants = [p for _, p in self.rooms[meeting_id]]
        message = json.dumps({ "type": "participants_update", "participants": participants })
        dead = []
        for ws, p in self.rooms[meeting_id]:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        # clean up dead connections
        for ws in dead:
            self.rooms[meeting_id] = [(w, p) for w, p in self.rooms[meeting_id] if w != ws]

    async def mute_all(self, meeting_id: str, sender_ws: WebSocket):
        """Broadcast mute_all to every participant EXCEPT the sender (host)."""
        if meeting_id not in self.rooms:
            return
        message = json.dumps({ "type": "mute_all" })
        for ws, p in self.rooms[meeting_id]:
            if ws != sender_ws:
                p["muted"] = True
                try:
                    await ws.send_text(message)
                except Exception:
                    pass
        await self.broadcast(meeting_id)

    async def unmute_all(self, meeting_id: str, sender_ws: WebSocket):
        """Broadcast unmute_all to every participant EXCEPT the sender (host)."""
        if meeting_id not in self.rooms:
            return
        message = json.dumps({ "type": "unmute_all" })
        for ws, p in self.rooms[meeting_id]:
            if ws != sender_ws:
                p["muted"] = False
                try:
                    await ws.send_text(message)
                except Exception:
                    pass
        await self.broadcast(meeting_id)

    async def mute_participant(self, meeting_id: str, display_name: str, requester_ws: WebSocket):
        if meeting_id not in self.rooms:
            return
        target_ws = None
        for ws, p in self.rooms[meeting_id]:
            if p.get("display_name") == display_name and not p.get("is_host"):
                p["muted"] = True
                target_ws = ws
                break
        if target_ws:
            try:
                await target_ws.send_text(json.dumps({"type": "muted_by_host"}))
            except Exception:
                pass
            await self.broadcast(meeting_id)

    async def unmute_participant(self, meeting_id: str, display_name: str, requester_ws: WebSocket):
        if meeting_id not in self.rooms:
            return
        target_ws = None
        for ws, p in self.rooms[meeting_id]:
            if p.get("display_name") == display_name and not p.get("is_host"):
                p["muted"] = False
                target_ws = ws
                break
        if target_ws:
            try:
                await target_ws.send_text(json.dumps({"type": "unmuted_by_host"}))
            except Exception:
                pass
            await self.broadcast(meeting_id)

    async def remove_participant(self, meeting_id: str, display_name: str, requester_ws: WebSocket):
        """Host removes a participant."""
        if meeting_id not in self.rooms:
            return
        
        # Verify requester is host
        requester_is_host = False
        for ws, p in self.rooms[meeting_id]:
            if ws == requester_ws and p.get("is_host"):
                requester_is_host = True
                break
        
        if not requester_is_host:
            return
            
        target_ws = None
        for ws, p in self.rooms[meeting_id]:
            if p.get("display_name") == display_name and not p.get("is_host"):
                target_ws = ws
                break
                
        if target_ws:
            try:
                await target_ws.send_text(json.dumps({"type": "removed"}))
                await target_ws.close()
            except Exception:
                pass
            self.disconnect(target_ws, meeting_id)
            await self.broadcast(meeting_id)

manager = ConnectionManager()

@app.websocket("/ws/room/{meeting_id}")
async def websocket_room(
    websocket: WebSocket,
    meeting_id: str,
    display_name: str = Query(...),
    is_host: bool = Query(False)
):
    participant = {
        "display_name": display_name,
        "is_host": is_host,
        "joined_at": datetime.utcnow().isoformat(),
        "muted": False
    }
    await manager.connect(websocket, meeting_id, participant)
    try:
        while True:
            # Keep connection alive — client sends pings
            data = await websocket.receive_text()
            if data == "ping":
                continue
            try:
                msg = json.loads(data)
                if msg.get("type") == "mute_all":
                    await manager.mute_all(meeting_id, websocket)
                elif msg.get("type") == "unmute_all":
                    await manager.unmute_all(meeting_id, websocket)
                elif msg.get("type") == "mute_participant":
                    await manager.mute_participant(meeting_id, msg.get("display_name"), websocket)
                elif msg.get("type") == "unmute_participant":
                    await manager.unmute_participant(meeting_id, msg.get("display_name"), websocket)
                elif msg.get("type") == "remove_participant":
                    await manager.remove_participant(meeting_id, msg.get("display_name"), websocket)
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)
        await manager.broadcast(meeting_id)  # notify all on leave
