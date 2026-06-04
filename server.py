#!/usr/bin/env python3
import copy
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import RLock
from time import localtime, strftime
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
STATE_FILE = ROOT / "data" / "published-state.json"
STATE_LOCK = RLock()
SYSTEM_AVATAR_COUNT = 60
SYSTEM_AVATAR_BASE_COUNT = 24


def route(path):
    return urlparse(path).path


def read_state():
    if not STATE_FILE.exists():
        return {}
    return json.loads(STATE_FILE.read_text(encoding="utf-8") or "{}")


def write_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp_file = STATE_FILE.with_suffix(".json.tmp")
    tmp_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_file.replace(STATE_FILE)


def ensure_state_shape(state):
    state.setdefault("activity", {})
    state.setdefault("joins", [])
    state.setdefault("leads", [])
    state.setdefault("channels", [])
    state.setdefault("events", {})
    state.setdefault("visitors", {})
    return state


def now_label():
    return strftime("%m-%d %H:%M", localtime())


def string_to_color(value):
    colors = ["#2f9b57", "#3b82c4", "#d97706", "#9b5bd6", "#0f8f8f", "#dc5f45"]
    total = sum(ord(char) for char in str(value or "新"))
    return colors[total % len(colors)]


def stable_hash(value):
    total = 7
    for char in str(value or "家长"):
        total = ((total * 31) + ord(char)) & 0xFFFFFFFF
    return total


def system_avatar_url(seed):
    hash_value = stable_hash(seed)
    base = (hash_value % SYSTEM_AVATAR_BASE_COUNT) + 1
    variant = hash_value % SYSTEM_AVATAR_COUNT
    return f"./assets/system-avatars/avatar-{base:02d}.svg?v={variant}"


def max_join_id(state):
    ids = []
    for item in state.get("joins", []):
        try:
            ids.append(int(item.get("id", 0)))
        except (TypeError, ValueError):
            continue
    return max(ids or [0])


def source_label(state, source):
    if not isinstance(source, dict) or source.get("key") in (None, "", "direct"):
        return "自然访问"
    for channel in state.get("channels", []):
        if channel.get("source") == source.get("key"):
            return channel.get("name") or source.get("key")
    if source.get("kind") == "ref":
        return f"{source.get('key')} 分享"
    return source.get("key")


def ensure_channel(state, source):
    if not isinstance(source, dict) or source.get("key") in (None, "", "direct"):
        return None
    for channel in state["channels"]:
        if channel.get("source") == source.get("key"):
            channel.setdefault("views", 0)
            channel.setdefault("joins", 0)
            channel.setdefault("shares", 0)
            channel.setdefault("leads", [])
            return channel
    channel = {
        "type": "家长分享" if source.get("kind") == "ref" else "外部渠道",
        "name": f"{source.get('key')} 分享" if source.get("kind") == "ref" else source.get("key"),
        "source": source.get("key"),
        "views": 0,
        "joins": 0,
        "shares": 0,
        "leads": []
    }
    state["channels"].insert(0, channel)
    return channel


def unique_share_ref(state, base_ref):
    used = {channel.get("source") for channel in state.get("channels", [])}
    ref = base_ref
    offset = 1
    while ref in used:
        ref = f"{base_ref}_{offset}"
        offset += 1
    return ref


def ensure_share_channel(state, name, share_ref):
    for channel in state["channels"]:
        if channel.get("source") == share_ref:
            return channel
    channel = {
        "type": "家长分享",
        "name": f"{name}分享",
        "source": share_ref,
        "views": 0,
        "joins": 0,
        "shares": 0,
        "leads": []
    }
    state["channels"].insert(0, channel)
    return channel


def merge_visitor(state, visitor_id, behavior, source):
    if not visitor_id or not isinstance(behavior, dict):
        return
    visitors = state.setdefault("visitors", {})
    current = visitors.setdefault(visitor_id, {
        "id": visitor_id,
        "visits": 0,
        "totalSeconds": 0,
        "currentSeconds": 0,
        "maxSeconds": 0,
        "clicks": 0,
        "lastSource": "自然访问",
        "lastSeen": ""
    })
    for key in ["visits", "totalSeconds", "currentSeconds", "maxSeconds", "clicks"]:
        try:
            current[key] = max(int(current.get(key) or 0), int(behavior.get(key) or 0))
        except (TypeError, ValueError):
            pass
    current["lastSource"] = source_label(state, source)
    current["lastSeen"] = behavior.get("lastSeen") or now_label()


def replace_share_action(actions, share_url):
    if not share_url or not isinstance(actions, list):
        return actions
    next_actions = []
    replaced = False
    for action in actions:
        if isinstance(action, str) and action.startswith("专属分享链接："):
            next_actions.append(f"专属分享链接：{share_url}")
            replaced = True
        else:
            next_actions.append(action)
    if not replaced:
        next_actions.insert(0, f"专属分享链接：{share_url}")
    return next_actions


def add_lead_submission(state, payload):
    ensure_state_shape(state)
    submission_id = payload.get("submissionId")
    if submission_id:
        for lead in state["leads"]:
            if lead.get("submissionId") == submission_id:
                return {
                    "duplicate": True,
                    "lead": lead,
                    "actualJoinCount": len(state["joins"]),
                    "shareRef": lead.get("shareRef")
                }

    incoming_join = copy.deepcopy(payload.get("join") or {})
    incoming_lead = copy.deepcopy(payload.get("lead") or {})
    if not isinstance(incoming_join, dict) or not isinstance(incoming_lead, dict):
        raise ValueError("invalid lead payload")

    next_id = max_join_id(state) + 1
    name = str(incoming_lead.get("name") or incoming_join.get("name") or "新同学").strip() or "新同学"
    source = payload.get("source") if isinstance(payload.get("source"), dict) else {"kind": "direct", "key": "direct"}
    source_name = source_label(state, source)
    share_ref = unique_share_ref(state, payload.get("shareRef") or f"user_{next_id}")
    share_url = payload.get("shareUrl")
    if isinstance(share_url, str):
        share_url = share_url.replace(payload.get("shareRef") or share_ref, share_ref)

    incoming_join.update({
        "id": next_id,
        "name": name,
        "source": source_name,
        "time": "刚刚",
        "avatar": name[0],
        "avatarColor": incoming_join.get("avatarColor") or string_to_color(name),
        "avatarUrl": incoming_join.get("avatarUrl") or system_avatar_url(f"{name}-{incoming_lead.get('phone') or next_id}"),
        "submissionId": submission_id
    })
    incoming_lead.update({
        "name": name,
        "source": source_name,
        "shareRef": share_ref,
        "submissionId": submission_id,
        "createdAt": now_label()
    })
    incoming_lead["actions"] = replace_share_action(incoming_lead.get("actions", []), share_url)

    state["joins"].insert(0, incoming_join)
    state["leads"].insert(0, incoming_lead)
    state["selectedLead"] = 0

    channel = ensure_channel(state, source)
    if channel:
      channel["joins"] = int(channel.get("joins") or 0) + 1
      if name not in channel["leads"]:
          channel["leads"].insert(0, name)

    ensure_share_channel(state, name, share_ref)

    for key in payload.get("eventKeys") or ["join_click"]:
        state["events"][key] = int(state["events"].get(key) or 0) + 1

    merge_visitor(state, payload.get("visitorId"), payload.get("behavior"), source)
    return {
        "duplicate": False,
        "join": incoming_join,
        "lead": incoming_lead,
        "actualJoinCount": len(state["joins"]),
        "shareRef": share_ref,
        "shareUrl": share_url
    }


def record_visit(state, payload):
    ensure_state_shape(state)
    source = payload.get("source") if isinstance(payload.get("source"), dict) else {"kind": "direct", "key": "direct"}
    if payload.get("recordView"):
        state["events"]["page_view"] = int(state["events"].get("page_view") or 0) + 1
        channel = ensure_channel(state, source)
        if channel:
            channel["views"] = int(channel.get("views") or 0) + 1
    merge_visitor(state, payload.get("visitorId"), payload.get("behavior"), source)


def record_event(state, payload):
    ensure_state_shape(state)
    key = payload.get("key")
    if not key:
        raise ValueError("missing event key")
    state["events"][key] = int(state["events"].get(key) or 0) + 1
    source = payload.get("source") if isinstance(payload.get("source"), dict) else {"kind": "direct", "key": "direct"}
    channel = ensure_channel(state, source)
    if channel and key == "share_click":
        channel["shares"] = int(channel.get("shares") or 0) + 1
    merge_visitor(state, payload.get("visitorId"), payload.get("behavior"), source)


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if route(self.path) == "/api/state":
            self.send_json_state()
            return
        super().do_GET()

    def do_HEAD(self):
        if route(self.path) == "/api/state":
            if not STATE_FILE.exists():
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            return
        super().do_HEAD()

    def do_POST(self):
        path = route(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
            if not isinstance(payload, dict):
                raise ValueError("invalid json payload")

            with STATE_LOCK:
                if path == "/api/state":
                    if not isinstance(payload.get("activity"), dict):
                        raise ValueError("invalid state payload")
                    write_state(payload)
                    result = {"ok": True}
                elif path == "/api/lead":
                    state = read_state()
                    result = add_lead_submission(state, payload)
                    write_state(state)
                    result = {"ok": True, **result}
                elif path == "/api/visit":
                    state = read_state()
                    record_visit(state, payload)
                    write_state(state)
                    result = {"ok": True}
                elif path == "/api/event":
                    state = read_state()
                    record_event(state, payload)
                    write_state(state)
                    result = {"ok": True}
                else:
                    self.send_error(404)
                    return
            self.send_json(result)
        except Exception as exc:
            self.send_json({"ok": False, "error": str(exc)}, status=400)

    def send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def send_json_state(self):
        if not STATE_FILE.exists():
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        with STATE_LOCK:
            self.wfile.write(STATE_FILE.read_bytes())


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4173), Handler)
    print("Serving with publish API at http://127.0.0.1:4173")
    server.serve_forever()
