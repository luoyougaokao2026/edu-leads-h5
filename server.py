#!/usr/bin/env python3
import copy
import hashlib
import hmac
import json
import os
import secrets
import string
import time
from http.cookies import SimpleCookie
try:
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
except ImportError:
    from http.server import SimpleHTTPRequestHandler, HTTPServer
    ThreadingHTTPServer = HTTPServer
from pathlib import Path
from threading import RLock
from time import localtime, strftime
from urllib.parse import parse_qs, quote, urlencode, urlparse
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent
STATE_FILE = ROOT / "data" / "published-state.json"
ACTIVITIES_DIR = ROOT / "data" / "activities"
DEFAULT_ACTIVITY_SLUG = "daoshu"
SERVER_HOST = os.environ.get("HOST", "127.0.0.1").strip() or "127.0.0.1"
SERVER_PORT = int(os.environ.get("PORT", "4173").strip() or "4173")
STATE_LOCK = RLock()
SYSTEM_AVATAR_COUNT = 60
SYSTEM_AVATAR_BASE_COUNT = 24
ADMIN_PASSWORD_FILE = ROOT / "data" / ".admin-password"
ADMIN_SESSION_COOKIE = "apply_admin_session"
ADMIN_SESSION_SECONDS = int(os.environ.get("APPLY_ADMIN_SESSION_SECONDS", "43200").strip() or "43200")
WECHAT_APP_ID = os.environ.get("WECHAT_APP_ID", "").strip()
WECHAT_APP_SECRET = os.environ.get("WECHAT_APP_SECRET", "").strip()
WECHAT_AUTH_ENABLED = os.environ.get("WECHAT_AUTH_ENABLED", "").strip() == "1"
WECHAT_TOKEN_CACHE = {"value": "", "expires_at": 0}
WECHAT_TICKET_CACHE = {"value": "", "expires_at": 0}


def route(path):
    return urlparse(path).path


def normalize_activity_slug(value):
    text = str(value or "").strip().lower()
    if not text:
        return DEFAULT_ACTIVITY_SLUG
    cleaned = []
    for char in text:
        if char.isalnum() or char in ("-", "_"):
            cleaned.append(char)
        elif char in (" ", "/", "."):
            cleaned.append("-")
    slug = "".join(cleaned).strip("-_")
    return slug or DEFAULT_ACTIVITY_SLUG


def activity_slug_from_path(path):
    current_route = route(path).strip("/")
    parts = current_route.split("/")
    if len(parts) >= 2 and parts[0] in {"zhaosheng", "parent", "student"}:
        return normalize_activity_slug(parts[1])
    return DEFAULT_ACTIVITY_SLUG


def activity_slug_from_query(path):
    query = parse_qs(urlparse(path).query)
    return normalize_activity_slug(query.get("activity", query.get("slug", [""]))[0])


def activity_slug_from_payload(payload, path=""):
    if isinstance(payload, dict) and payload.get("activitySlug"):
        return normalize_activity_slug(payload.get("activitySlug"))
    return activity_slug_from_query(path)


def state_file_for_slug(slug):
    normalized = normalize_activity_slug(slug)
    if normalized == DEFAULT_ACTIVITY_SLUG:
        return STATE_FILE
    return ACTIVITIES_DIR / f"{normalized}.json"


def read_state(slug=None):
    state_file = state_file_for_slug(slug)
    if not state_file.exists():
        return {}
    return json.loads(state_file.read_text(encoding="utf-8") or "{}")


def write_state(state, slug=None):
    state_file = state_file_for_slug(slug)
    state_file.parent.mkdir(parents=True, exist_ok=True)
    tmp_file = state_file.with_suffix(".json.tmp")
    tmp_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_file.replace(state_file)


def ensure_state_shape(state):
    state.setdefault("activity", {})
    state.setdefault("joins", [])
    state.setdefault("leads", [])
    state.setdefault("channels", [])
    state.setdefault("events", {})
    state.setdefault("visitors", {})
    return state


def public_join(item):
    public = {}
    for key in ["id", "name", "source", "time", "avatar", "avatarColor", "avatarUrl"]:
        if key in item:
            public[key] = item.get(key)
    return public


def public_channel(item):
    public = {}
    for key in ["type", "name", "source", "views", "joins", "shares", "leads"]:
        if key in item:
            public[key] = item.get(key)
    return public


def public_material(item):
    public = {}
    for key in ["type", "title", "description", "body", "teaserText", "url", "fileName", "mimeType", "visibility"]:
        if key in item:
            public[key] = item.get(key)
    return public


def public_state_snapshot(state):
    ensure_state_shape(state)
    snapshot = {
        "activity": state.get("activity", {}),
        "materials": [
            public_material(item)
            for item in state.get("materials", [])
            if item.get("visibility") not in {"隐藏", "领取后展示"}
        ],
        "fields": state.get("fields", []),
        "visibility": state.get("visibility", {}),
        "events": state.get("events", {}),
        "joins": [public_join(item) for item in state.get("joins", []) if not item.get("hiddenFromPublic")],
        "channels": [public_channel(item) for item in state.get("channels", [])],
        "leads": [],
        "visitors": {},
        "publishedAt": state.get("publishedAt", "")
    }
    return snapshot


def visible_join_count(state):
    ensure_state_shape(state)
    return len([item for item in state.get("joins", []) if not item.get("hiddenFromPublic")])


def reset_activity_runtime_data(state):
    ensure_state_shape(state)
    state["joins"] = []
    state["leads"] = []
    state["channels"] = []
    state["visitors"] = {}
    state["selectedLead"] = 0
    state["currentSource"] = {"kind": "direct", "key": "direct"}
    state["sourceVisitRecorded"] = ""
    events = state.setdefault("events", {})
    for key in list(events.keys()):
        events[key] = 0
    return state


def activity_summary(slug, state):
    ensure_state_shape(state)
    activity = state.get("activity", {})
    return {
        "slug": normalize_activity_slug(slug),
        "title": activity.get("title") or activity.get("adminName") or slug,
        "adminName": activity.get("adminName") or activity.get("title") or slug,
        "updatedAt": state.get("publishedAt", ""),
        "leads": len(state.get("leads", [])),
        "joins": len(state.get("joins", [])),
        "views": int((state.get("events") or {}).get("page_view") or 0)
    }


def list_activities():
    items = [activity_summary(DEFAULT_ACTIVITY_SLUG, read_state(DEFAULT_ACTIVITY_SLUG))]
    if ACTIVITIES_DIR.exists():
        for path in sorted(ACTIVITIES_DIR.glob("*.json")):
            slug = normalize_activity_slug(path.stem)
            if slug == DEFAULT_ACTIVITY_SLUG:
                continue
            try:
                items.append(activity_summary(slug, read_state(slug)))
            except Exception:
                continue
    return items


def create_activity(payload):
    slug = normalize_activity_slug(payload.get("slug") or payload.get("title") or f"activity-{int(time.time())}")
    if slug == DEFAULT_ACTIVITY_SLUG:
        raise ValueError("default activity already exists")
    target = state_file_for_slug(slug)
    if target.exists():
        raise ValueError("activity already exists")
    template_slug = normalize_activity_slug(payload.get("templateSlug") or DEFAULT_ACTIVITY_SLUG)
    state = copy.deepcopy(read_state(template_slug) or read_state(DEFAULT_ACTIVITY_SLUG) or {})
    ensure_state_shape(state)
    reset_activity_runtime_data(state)
    title = str(payload.get("title") or "").strip()
    if title:
        state.setdefault("activity", {})
        state["activity"]["title"] = title
        state["activity"]["adminName"] = title
        if not state["activity"].get("shareTitle"):
            state["activity"]["shareTitle"] = title
    state["publishedAt"] = now_label()
    write_state(state, slug)
    return activity_summary(slug, state)


def request_host(handler):
    forwarded = handler.headers.get("X-Forwarded-Host", "")
    raw = forwarded.split(",")[0].strip() or handler.headers.get("Host", "")
    return raw.split(":")[0].strip().lower()


def is_admin_state_request(handler):
    host = request_host(handler)
    query = parse_qs(urlparse(handler.path).query)
    return host == "apply-admin.xdianping.cn" or query.get("admin", [""])[0] == "1"


def get_admin_password():
    env_password = (
        os.environ.get("APPLY_ADMIN_PASSWORD", "").strip()
        or os.environ.get("ADMIN_PASSWORD", "").strip()
    )
    if env_password:
        return env_password
    if ADMIN_PASSWORD_FILE.exists():
        password = ADMIN_PASSWORD_FILE.read_text(encoding="utf-8").strip()
        if password:
            return password
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for _ in range(16))
    ADMIN_PASSWORD_FILE.parent.mkdir(parents=True, exist_ok=True)
    ADMIN_PASSWORD_FILE.write_text(password + "\n", encoding="utf-8")
    try:
        ADMIN_PASSWORD_FILE.chmod(0o600)
    except OSError:
        pass
    return password


def admin_session_secret():
    configured = os.environ.get("APPLY_ADMIN_SESSION_SECRET", "").strip()
    if configured:
        return configured
    raw = f"{get_admin_password()}:{WECHAT_APP_SECRET}:{ROOT}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def sign_admin_session(timestamp):
    return hmac.new(
        admin_session_secret().encode("utf-8"),
        timestamp.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def make_admin_session_token():
    timestamp = str(int(time.time()))
    return f"{timestamp}:{sign_admin_session(timestamp)}"


def read_cookie(handler, name):
    cookie_header = handler.headers.get("Cookie", "")
    if not cookie_header:
        return ""
    cookie = SimpleCookie()
    try:
        cookie.load(cookie_header)
    except Exception:
        return ""
    morsel = cookie.get(name)
    return morsel.value if morsel else ""


def is_admin_authenticated(handler):
    token = read_cookie(handler, ADMIN_SESSION_COOKIE)
    if not token or ":" not in token:
        return False
    timestamp, signature = token.split(":", 1)
    try:
        age = int(time.time()) - int(timestamp)
    except ValueError:
        return False
    if age < 0 or age > ADMIN_SESSION_SECONDS:
        return False
    expected = sign_admin_session(timestamp)
    return hmac.compare_digest(signature, expected)


def admin_cookie_header(token):
    parts = [
        f"{ADMIN_SESSION_COOKIE}={token}",
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        f"Max-Age={ADMIN_SESSION_SECONDS}"
    ]
    return "; ".join(parts)


def expired_admin_cookie_header():
    return f"{ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"


def public_wechat_config():
    return {
        "enabled": bool(WECHAT_AUTH_ENABLED and WECHAT_APP_ID),
        "appId": WECHAT_APP_ID if WECHAT_AUTH_ENABLED else "",
        "scope": os.environ.get("WECHAT_OAUTH_SCOPE", "snsapi_userinfo").strip() or "snsapi_userinfo",
        "configured": bool(WECHAT_APP_ID and WECHAT_APP_SECRET),
        "callbackPath": "/api/wechat/callback"
    }


def fetch_wechat_json(url):
    with urlopen(url, timeout=8) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if payload.get("errcode"):
        raise ValueError(payload.get("errmsg") or "wechat request failed")
    return payload


def get_wechat_access_token():
    now = time.time()
    if WECHAT_TOKEN_CACHE["value"] and WECHAT_TOKEN_CACHE["expires_at"] > now + 60:
        return WECHAT_TOKEN_CACHE["value"]
    if not WECHAT_APP_ID or not WECHAT_APP_SECRET:
        raise ValueError("wechat app id or secret missing")
    token_url = (
        "https://api.weixin.qq.com/cgi-bin/token?"
        + urlencode({
            "grant_type": "client_credential",
            "appid": WECHAT_APP_ID,
            "secret": WECHAT_APP_SECRET
        })
    )
    payload = fetch_wechat_json(token_url)
    token = payload.get("access_token")
    if not token:
        raise ValueError("wechat access token missing")
    WECHAT_TOKEN_CACHE["value"] = token
    WECHAT_TOKEN_CACHE["expires_at"] = now + int(payload.get("expires_in") or 7200) - 120
    return token


def get_wechat_jsapi_ticket():
    now = time.time()
    if WECHAT_TICKET_CACHE["value"] and WECHAT_TICKET_CACHE["expires_at"] > now + 60:
        return WECHAT_TICKET_CACHE["value"]
    token = get_wechat_access_token()
    ticket_url = (
        "https://api.weixin.qq.com/cgi-bin/ticket/getticket?"
        + urlencode({
            "access_token": token,
            "type": "jsapi"
        })
    )
    payload = fetch_wechat_json(ticket_url)
    ticket = payload.get("ticket")
    if not ticket:
        raise ValueError("wechat jsapi ticket missing")
    WECHAT_TICKET_CACHE["value"] = ticket
    WECHAT_TICKET_CACHE["expires_at"] = now + int(payload.get("expires_in") or 7200) - 120
    return ticket


def build_wechat_js_config(page_url):
    if not public_wechat_config()["enabled"]:
        raise ValueError("wechat auth disabled")
    ticket = get_wechat_jsapi_ticket()
    nonce = hashlib.sha1(os.urandom(16)).hexdigest()[:16]
    timestamp = str(int(time.time()))
    raw = f"jsapi_ticket={ticket}&noncestr={nonce}&timestamp={timestamp}&url={page_url}"
    signature = hashlib.sha1(raw.encode("utf-8")).hexdigest()
    return {
        "ok": True,
        "appId": WECHAT_APP_ID,
        "timestamp": timestamp,
        "nonceStr": nonce,
        "signature": signature
    }


def build_oauth_url(redirect_url):
    config = public_wechat_config()
    params = {
        "appid": config["appId"],
        "redirect_uri": redirect_url,
        "response_type": "code",
        "scope": config["scope"],
        "state": "edu_leads_h5"
    }
    return f"https://open.weixin.qq.com/connect/oauth2/authorize?{urlencode(params)}#wechat_redirect"


def request_origin(handler):
    scheme = "https" if handler.headers.get("X-Forwarded-Proto") == "https" else "http"
    host = handler.headers.get("Host", f"127.0.0.1:{SERVER_PORT}")
    return f"{scheme}://{host}"


def exchange_wechat_code(code):
    if not WECHAT_APP_ID or not WECHAT_APP_SECRET:
        raise ValueError("wechat app id or secret missing")
    token_url = (
        "https://api.weixin.qq.com/sns/oauth2/access_token?"
        + urlencode({
            "appid": WECHAT_APP_ID,
            "secret": WECHAT_APP_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        })
    )
    with urlopen(token_url, timeout=8) as response:
        token_payload = json.loads(response.read().decode("utf-8"))
    if token_payload.get("errcode"):
        raise ValueError(token_payload.get("errmsg") or "wechat token failed")

    identity = {
        "openid": token_payload.get("openid", ""),
        "nickname": "",
        "avatarUrl": "",
        "authorizedAt": now_label(),
        "scope": token_payload.get("scope", "")
    }

    if "snsapi_userinfo" in str(token_payload.get("scope", "")) and token_payload.get("access_token") and token_payload.get("openid"):
        user_url = (
            "https://api.weixin.qq.com/sns/userinfo?"
            + urlencode({
                "access_token": token_payload.get("access_token"),
                "openid": token_payload.get("openid"),
                "lang": "zh_CN"
            })
        )
        with urlopen(user_url, timeout=8) as response:
            user_payload = json.loads(response.read().decode("utf-8"))
        if not user_payload.get("errcode"):
            identity["nickname"] = user_payload.get("nickname", "")
            identity["avatarUrl"] = user_payload.get("headimgurl", "")
    return identity


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
    wechat_identity = behavior.get("wechatIdentity")
    if isinstance(wechat_identity, dict) and wechat_identity.get("openid"):
        current["wechatIdentity"] = {
            "openid": wechat_identity.get("openid", ""),
            "nickname": wechat_identity.get("nickname", ""),
            "avatarUrl": wechat_identity.get("avatarUrl", ""),
            "authorizedAt": wechat_identity.get("authorizedAt", "")
        }


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


def lead_openid(lead):
    identity = lead.get("wechatIdentity") or (lead.get("behavior") or {}).get("wechatIdentity") or {}
    return identity.get("openid", "") if isinstance(identity, dict) else ""


def find_existing_lead_index(state, lead):
    phone = str(lead.get("phone") or "").strip()
    openid = lead_openid(lead)
    if not phone and not openid:
        return -1
    for index, item in enumerate(state.get("leads", [])):
        if openid and lead_openid(item) == openid:
            return index
        if phone and str(item.get("phone") or "").strip() == phone:
            return index
    return -1


def find_existing_join_index(state, lead):
    phone = str(lead.get("phone") or "").strip()
    openid = lead_openid(lead)
    for index, item in enumerate(state.get("joins", [])):
        if lead.get("submissionId") and item.get("submissionId") == lead.get("submissionId"):
            return index
        identity = item.get("wechatIdentity") or {}
        if openid and isinstance(identity, dict) and identity.get("openid") == openid:
            return index
        if phone and str(item.get("phone") or "").strip() == phone:
            return index
        if item.get("name") == lead.get("name"):
            return index
    return -1


def merge_actions(existing, incoming):
    seen = set()
    merged = []
    for action in list(incoming or []) + list(existing or []):
        if not action or action in seen:
            continue
        seen.add(action)
        merged.append(action)
    return merged[:12]


def add_lead_submission(state, payload):
    ensure_state_shape(state)
    submission_id = payload.get("submissionId")
    if submission_id:
        for lead in state["leads"]:
            if lead.get("submissionId") == submission_id:
                return {
                    "duplicate": True,
                    "lead": lead,
                    "actualJoinCount": visible_join_count(state),
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
        "phone": incoming_lead.get("phone", ""),
        "submissionId": submission_id
    })
    incoming_lead.update({
        "name": name,
        "source": source_name,
        "shareRef": share_ref,
        "submissionId": submission_id,
        "createdAt": now_label()
    })
    if isinstance(payload.get("wechatIdentity"), dict) and payload["wechatIdentity"].get("openid"):
        incoming_lead["wechatIdentity"] = {
            "openid": payload["wechatIdentity"].get("openid", ""),
            "nickname": payload["wechatIdentity"].get("nickname", ""),
            "avatarUrl": payload["wechatIdentity"].get("avatarUrl", ""),
            "authorizedAt": payload["wechatIdentity"].get("authorizedAt", "")
        }
        if payload["wechatIdentity"].get("avatarUrl"):
            incoming_join["avatarUrl"] = payload["wechatIdentity"]["avatarUrl"]
        incoming_join["wechatIdentity"] = incoming_lead["wechatIdentity"]
    incoming_lead["actions"] = replace_share_action(incoming_lead.get("actions", []), share_url)

    existing_index = find_existing_lead_index(state, incoming_lead)
    if existing_index >= 0:
        existing_lead = state["leads"][existing_index]
        existing_lead["actions"] = merge_actions(
            existing_lead.get("actions", []),
            ["重复提交：已拦截，未重复计入领取动态"]
        )
        existing_lead["repeatSubmits"] = int(existing_lead.get("repeatSubmits") or 0) + 1
        existing_lead["updatedAt"] = now_label()
        if isinstance(payload.get("wechatIdentity"), dict) and payload["wechatIdentity"].get("openid"):
            existing_lead["wechatIdentity"] = incoming_lead.get("wechatIdentity") or existing_lead.get("wechatIdentity")

        existing_join_index = find_existing_join_index(state, existing_lead)
        existing_join = state["joins"][existing_join_index] if existing_join_index >= 0 else None
        duplicate_share_url = share_url
        existing_share_ref = existing_lead.get("shareRef")
        if isinstance(duplicate_share_url, str) and existing_share_ref:
            for token in [payload.get("shareRef"), share_ref]:
                if token:
                    duplicate_share_url = duplicate_share_url.replace(str(token), str(existing_share_ref))
        state["events"]["repeat_submit"] = int(state["events"].get("repeat_submit") or 0) + 1
        merge_visitor(state, payload.get("visitorId"), payload.get("behavior"), source)
        return {
            "duplicate": True,
            "join": existing_join or incoming_join,
            "lead": existing_lead,
            "actualJoinCount": visible_join_count(state),
            "shareRef": existing_lead.get("shareRef"),
            "shareUrl": duplicate_share_url,
            "message": "same user already submitted"
        }

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
        "actualJoinCount": visible_join_count(state),
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

    def serve_index(self):
        self.path = "/index.html"
        super().do_GET()

    def do_GET(self):
        current_route = route(self.path)
        if current_route == "/api/state":
            self.send_json_state(activity_slug_from_query(self.path))
            return
        if current_route == "/data/published-state.json":
            self.send_json_state(activity_slug_from_query(self.path))
            return
        if current_route.startswith("/data/"):
            self.send_error(404)
            return
        if current_route == "/api/activities":
            if not is_admin_authenticated(self):
                self.send_json({"ok": False, "error": "admin login required"}, status=401)
                return
            with STATE_LOCK:
                self.send_json({"ok": True, "activities": list_activities()})
            return
        if current_route == "/api/admin/session":
            self.send_json({"ok": True, "authenticated": is_admin_authenticated(self)})
            return
        if current_route == "/api/wechat/config":
            self.send_json(public_wechat_config())
            return
        if current_route == "/api/wechat/oauth-url":
            if not public_wechat_config()["enabled"]:
                self.send_json({"ok": False, "error": "wechat auth disabled"}, status=400)
                return
            query = parse_qs(urlparse(self.path).query)
            redirect = query.get("redirect", [""])[0]
            if not redirect:
                self.send_json({"ok": False, "error": "missing redirect"}, status=400)
                return
            callback_url = f"{request_origin(self)}/api/wechat/callback?redirect={quote(redirect, safe='')}"
            self.send_json({"ok": True, "url": build_oauth_url(callback_url)})
            return
        if current_route == "/api/wechat/js-config":
            query = parse_qs(urlparse(self.path).query)
            page_url = query.get("url", [""])[0].split("#")[0]
            if not page_url:
                self.send_json({"ok": False, "error": "missing url"}, status=400)
                return
            try:
                self.send_json(build_wechat_js_config(page_url))
            except Exception as exc:
                self.send_json({"ok": False, "error": str(exc)}, status=400)
            return
        if current_route == "/api/wechat/callback":
            self.handle_wechat_callback()
            return
        if current_route in ("/parent", "/student", "/admin", "/zhaosheng"):
            self.serve_index()
            return
        if current_route.startswith(("/parent/", "/student/", "/zhaosheng/")):
            self.serve_index()
            return
        super().do_GET()

    def do_HEAD(self):
        if route(self.path) == "/api/state":
            if not state_file_for_slug(activity_slug_from_query(self.path)).exists():
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
                    if not is_admin_authenticated(self):
                        self.send_json({"ok": False, "error": "admin login required"}, status=401)
                        return
                    if not isinstance(payload.get("activity"), dict):
                        raise ValueError("invalid state payload")
                    slug = activity_slug_from_payload(payload, self.path)
                    write_state(payload, slug)
                    result = {"ok": True}
                elif path == "/api/activities":
                    if not is_admin_authenticated(self):
                        self.send_json({"ok": False, "error": "admin login required"}, status=401)
                        return
                    activity = create_activity(payload)
                    result = {"ok": True, "activity": activity, "activities": list_activities()}
                elif path == "/api/activities/reset":
                    if not is_admin_authenticated(self):
                        self.send_json({"ok": False, "error": "admin login required"}, status=401)
                        return
                    slug = activity_slug_from_payload(payload, self.path)
                    state = read_state(slug)
                    reset_activity_runtime_data(state)
                    state["publishedAt"] = now_label()
                    write_state(state, slug)
                    result = {"ok": True, "activity": activity_summary(slug, state), "state": state, "activities": list_activities()}
                elif path == "/api/admin/login":
                    password = str(payload.get("password") or "")
                    if not password or not hmac.compare_digest(password, get_admin_password()):
                        self.send_json({"ok": False, "error": "invalid password"}, status=401)
                        return
                    self.send_admin_login_response()
                    return
                elif path == "/api/admin/logout":
                    self.send_admin_logout_response()
                    return
                elif path == "/api/lead":
                    slug = activity_slug_from_payload(payload, self.path)
                    state = read_state(slug)
                    result = add_lead_submission(state, payload)
                    write_state(state, slug)
                    result = {"ok": True, **result}
                elif path == "/api/visit":
                    slug = activity_slug_from_payload(payload, self.path)
                    state = read_state(slug)
                    record_visit(state, payload)
                    write_state(state, slug)
                    result = {"ok": True}
                elif path == "/api/event":
                    slug = activity_slug_from_payload(payload, self.path)
                    state = read_state(slug)
                    record_event(state, payload)
                    write_state(state, slug)
                    result = {"ok": True}
                else:
                    self.send_error(404)
                    return
            self.send_json(result)
        except Exception as exc:
            self.send_json({"ok": False, "error": str(exc)}, status=400)

    def handle_wechat_callback(self):
        query = parse_qs(urlparse(self.path).query)
        code = query.get("code", [""])[0]
        redirect = query.get("redirect", ["/"])[0] or "/"
        try:
            if not code:
                raise ValueError("missing wechat code")
            identity = exchange_wechat_code(code)
            payload = json.dumps(identity, ensure_ascii=False)
            safe_redirect = json.dumps(redirect)
            html = f"""<!doctype html>
<html lang=\"zh-CN\">
<meta charset=\"utf-8\" />
<title>微信授权完成</title>
<body>
<p>微信身份已确认，正在返回页面...</p>
<script>
localStorage.setItem('zhaosheng_wechat_identity_v1', {json.dumps(payload)});
window.location.replace({safe_redirect});
</script>
</body>
</html>"""
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))
        except Exception as exc:
            self.send_json({"ok": False, "error": str(exc)}, status=400)

    def send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def send_admin_login_response(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Set-Cookie", admin_cookie_header(make_admin_session_token()))
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "authenticated": True}, ensure_ascii=False).encode("utf-8"))

    def send_admin_logout_response(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Set-Cookie", expired_admin_cookie_header())
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "authenticated": False}, ensure_ascii=False).encode("utf-8"))

    def send_json_state(self, slug=None):
        if not state_file_for_slug(slug).exists():
            self.send_error(404)
            return
        with STATE_LOCK:
            state = read_state(slug)
        if is_admin_state_request(self):
            if not is_admin_authenticated(self):
                self.send_json({"ok": False, "error": "admin login required"}, status=401)
                return
            payload = state
        else:
            payload = public_state_snapshot(state)
        self.send_json(payload)


if __name__ == "__main__":
    get_admin_password()
    server = ThreadingHTTPServer((SERVER_HOST, SERVER_PORT), Handler)
    print(f"Serving with publish API at http://{SERVER_HOST}:{SERVER_PORT}")
    server.serve_forever()
