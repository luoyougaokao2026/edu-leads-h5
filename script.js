const STORAGE_KEY_BASE = "zhaosheng_prototype_state_v1";
const VISITOR_KEY = "zhaosheng_visitor_id";
const WECHAT_IDENTITY_KEY = "zhaosheng_wechat_identity_v1";
const DEFAULT_ACTIVITY_SLUG = "daoshu";
const ADMIN_ACTIVITY_KEY = "zhaosheng_admin_activity_slug";
const DEFAULT_COVER_IMAGE = "/assets/daoshu-preview-cover.png";
const DEFAULT_SHARE_IMAGE = "https://apply.xdianping.cn/assets/share-target.jpg";
const DEFAULT_SHARE_DESCRIPTION = "50道高三数学精选导数题 源自靶向刷题集训营";
const LEGACY_COVER_IMAGES = ["/assets/luoyou-daoshu-cover.jpg"];
const TEACHER_QR_IMAGE = "/assets/teacher-qr.svg";
const PUBLIC_BASE_URL = "https://apply.xdianping.cn";
const SYSTEM_AVATAR_COUNT = 60;
const SYSTEM_AVATAR_BASE_COUNT = 24;
const SCHOOL_SUGGESTIONS = [
  "合肥市第一中学滨湖校区",
  "合肥市第一中学瑶海校区",
  "合肥市第一中学淝河校区",
  "合肥市第一中学长江路校区",
  "屯溪一中",
  "六安一中",
  "合肥滨湖寿春中学",
  "合肥市第六中学菱湖校区",
  "合肥市第六中学百花井校区",
  "合肥市第六中学新桥校区",
  "合肥市第八中学匡河校区",
  "合肥市第八中学运河校区",
  "合肥一六八中学始信路校区",
  "合肥市第四中学",
  "合肥市第五中学长江路校区",
  "合肥市第七中学",
  "合肥市第九中学新站校区",
  "合肥市第九中学四牌楼校区",
  "合肥市第十中学",
  "合肥市第二中学",
  "合肥市第三中学",
  "合肥市第十一中学",
  "合肥市第三十二中学",
  "合肥工业大学附属中学",
  "合肥市庐阳高级中学"
];
const urlParams = new URLSearchParams(window.location.search);
const publicVersion = urlParams.get("v") || "";
const routePath = window.location.pathname.replace(/\/+$/, "") || "/";
const isApplyAdminHost = window.location.hostname === "apply-admin.xdianping.cn";
const isApplyPublicHost = window.location.hostname === "apply.xdianping.cn";
const isAdminPreview = isApplyAdminHost || routePath === "/admin" || urlParams.get("admin") === "1" || urlParams.get("view") === "admin";
function normalizeActivitySlug(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return DEFAULT_ACTIVITY_SLUG;
  const slug = text
    .replace(/[\s/.]+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[-_]+|[-_]+$/g, "");
  return slug || DEFAULT_ACTIVITY_SLUG;
}
function readActivitySlugFromPath() {
  const parts = routePath.split("/").filter(Boolean);
  if (["zhaosheng", "parent", "student"].includes(parts[0])) {
    return parts[1] ? normalizeActivitySlug(parts[1]) : DEFAULT_ACTIVITY_SLUG;
  }
  if (isApplyPublicHost && parts[0] && !["api", "assets", "admin"].includes(parts[0]) && !parts[0].includes(".")) {
    return normalizeActivitySlug(parts[0]);
  }
  return normalizeActivitySlug(urlParams.get("activity") || (isAdminPreview ? localStorage.getItem(ADMIN_ACTIVITY_KEY) : "") || DEFAULT_ACTIVITY_SLUG);
}
let activeActivitySlug = readActivitySlugFromPath();
const isPublicPage =
  !isAdminPreview &&
  (isApplyPublicHost ||
    routePath === "/zhaosheng" ||
    routePath.startsWith("/zhaosheng/") ||
    routePath === "/parent" ||
    routePath.startsWith("/parent/") ||
    routePath === "/student" ||
    routePath.startsWith("/student/") ||
    window.location.hostname.includes("trycloudflare.com") ||
    publicVersion.includes("clean") ||
    publicVersion.includes("public") ||
    publicVersion.includes("spine"));
const publicActivityCopy = {
  tag: "高三数学资料",
  title: "导数专题资料包",
  subtitle: "50道精选好题 + 配套讲解片段"
};
if (isPublicPage) {
  document.documentElement.classList.add("public-page");
}
if (isAdminPreview) {
  document.documentElement.classList.add("admin-preview");
}

function storageKey() {
  return `${STORAGE_KEY_BASE}_${activeActivitySlug}`;
}

function getPublicActivityUrl(slug = activeActivitySlug) {
  const normalized = normalizeActivitySlug(slug);
  return normalized === DEFAULT_ACTIVITY_SLUG ? PUBLIC_BASE_URL : `${PUBLIC_BASE_URL}/${normalized}`;
}

function apiWithActivity(path) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set("activity", activeActivitySlug);
  if (isAdminPreview) url.searchParams.set("admin", "1");
  return `${url.pathname}${url.search}`;
}

const defaultState = {
  activity: {
    tag: "高三数学资料",
    title: "高三导数专题资料包领取",
    subtitle: "精选往季保校训练营导数题，进群领取小册子和配套讲解视频。",
    joinLabel: "已领取",
    totalQuota: "50",
    deadline: "2026-06-10T22:00",
    adminName: "高三导数资料包",
    contentTitle: "资料预览",
    contentNote: "题册 + 视频",
    noticeLeft: "302 位高三学生/家长已领取",
    ctaText: "立即领取资料",
    formHint: "为给孩子预留资料，请填写领取信息。",
    teacherWechat: "math-guide-2026",
    passphrase: "导数资料",
    successTitle: "领取预约已提交",
    successSubtitle: "资料已为孩子预留",
    successContactText: "老师会尽快联系您确认领取安排。",
    qrTitle: "长按二维码添加老师",
    qrSubtitle: "领取题册和讲解视频",
    teacherQrImage: "",
    teacherQrFileName: "",
    shareLead: "如果身边有同样需要导数资料的高三家长，可以顺手转给他。",
    shareTitle: "高三导数50题精讲资料领取",
    shareDescription: DEFAULT_SHARE_DESCRIPTION,
    shareImage: DEFAULT_SHARE_IMAGE,
    audience: ["导数基础题能做，但压轴题不稳定", "恒成立、零点、分类讨论容易卡住", "想进群跟着刷题和看讲解视频"]
  },
  followStatuses: ["新领取", "已加微信", "已进群", "已发资料", "已互动", "有训练营意向", "已报名", "无效"],
  joins: [
    { id: 302, name: "肖雅雯", grade: "高三", subject: "数学", source: "张老师朋友圈", time: "刚刚", avatar: "肖", avatarColor: "#2f9b57" },
    { id: 301, name: "陈伟", grade: "高三", subject: "数学", source: "微信群", time: "2分钟前", avatar: "陈", avatarColor: "#3b82c4" },
    { id: 300, name: "李同学", grade: "高三", subject: "数学", source: "抖音短视频", time: "5分钟前", avatar: "李", avatarColor: "#d97706" },
    { id: 299, name: "王子涵", grade: "高三", subject: "数学", source: "小红书", time: "8分钟前", avatar: "王", avatarColor: "#9b5bd6" },
    { id: 298, name: "张俊", grade: "高三", subject: "数学", source: "老师私发", time: "12分钟前", avatar: "张", avatarColor: "#0f8f8f" }
  ],
  leads: [
    {
      name: "肖雅雯",
      phone: "18130050515",
      grade: "高三",
      subject: "数学",
      source: "张老师朋友圈",
      score: 92,
      status: "已进群",
      issue: "导数压轴题不稳",
      note: "已进资料群，适合推导数专题训练。",
      actions: ["访问 3 次", "完成诊断", "进群接龙", "点击预约试听"]
    },
    {
      name: "陈伟",
      phone: "18905694821",
      grade: "高三",
      subject: "数学",
      source: "微信群",
      score: 78,
      status: "已加微信",
      issue: "恒成立分类讨论",
      note: "已加微信，等老师拉群。",
      actions: ["访问 2 次", "查看资料内容", "进群接龙"]
    },
    {
      name: "李同学",
      phone: "13956092344",
      grade: "高三",
      subject: "数学",
      source: "抖音短视频",
      score: 64,
      status: "已发资料",
      issue: "零点问题卡住",
      note: "资料已私发，后续观察是否看视频。",
      actions: ["访问 1 次", "领取资料", "资料领取"]
    },
    {
      name: "王子涵",
      phone: "17305691230",
      grade: "高三",
      subject: "数学",
      source: "小红书",
      score: 57,
      status: "新领取",
      issue: "导数复习规划不清",
      note: "还未添加老师微信。",
      actions: ["访问 1 次", "痛点投票"]
    },
    {
      name: "刘同学",
      phone: "18600001234",
      grade: "高三",
      subject: "数学",
      source: "肖雅雯分享",
      score: 71,
      status: "新领取",
      issue: "恒成立分类讨论",
      note: "由肖雅雯分享带入，等待添加老师微信。",
      actions: ["通过肖雅雯分享进入", "领取导数资料"]
    },
    {
      name: "赵同学",
      phone: "18600005678",
      grade: "高三",
      subject: "数学",
      source: "肖雅雯分享",
      score: 69,
      status: "已加微信",
      issue: "函数构造不会",
      note: "由肖雅雯分享带入，已加老师微信。",
      actions: ["通过肖雅雯分享进入", "已加微信"]
    },
    {
      name: "周同学",
      phone: "18600009876",
      grade: "高三",
      subject: "数学",
      source: "陈伟分享",
      score: 66,
      status: "已进群",
      issue: "零点问题卡住",
      note: "由陈伟分享带入，已进入资料群。",
      actions: ["通过陈伟分享进入", "已进资料群"]
    }
  ],
  channels: [
    { type: "老师渠道", name: "张老师朋友圈", source: "teacher_zhang", views: 218, joins: 86, shares: 14, leads: ["肖雅雯", "陈伟", "张俊"] },
    { type: "社群渠道", name: "微信群", source: "wechat_group_01", views: 164, joins: 72, shares: 9, leads: ["陈伟", "李同学"] },
    { type: "短视频渠道", name: "抖音导数视频 01", source: "douyin_derivative_001", views: 201, joins: 59, shares: 18, leads: ["李同学"] },
    { type: "图文渠道", name: "小红书笔记", source: "xiaohongshu_note_0529", views: 93, joins: 31, shares: 7, leads: ["王子涵"] },
    { type: "家长分享", name: "肖雅雯分享", source: "user_303", views: 42, joins: 11, shares: 4, leads: ["刘同学", "赵同学"] },
    { type: "家长分享", name: "陈伟分享", source: "user_301", views: 28, joins: 6, shares: 2, leads: ["周同学"] }
  ],
  fields: [
    { key: "name", name: "学生姓名或昵称", type: "填空", required: true, options: [] },
    { key: "phone", name: "联系方式", type: "填空", required: true, options: [] },
    { key: "scoreRange", name: "最近数学分数区间", type: "单选", required: false, options: ["90 分以下", "90-110 分", "110-130 分", "130 分以上"] },
    { key: "issue", name: "导数最卡在哪里", type: "单选", required: false, options: ["导数压轴题不稳", "恒成立分类讨论", "零点问题卡住", "函数构造不会"] }
  ],
  materials: [
    {
      type: "文字",
      title: "这份资料适合谁",
      description: "导数基础题能做，但压轴题、恒成立、零点问题不稳定的高三学生。",
      body: "领取后可进入资料群，按专题领取题册和讲解视频。",
      teaserText: "",
      url: "",
      fileName: "",
      fileData: "",
      mimeType: "",
      visibility: "前台预览"
    },
    {
      type: "图片",
      title: "高三导数好题封面预览",
      description: "洛优好题系列导数专题封面，家长可第一眼看到资料质感。",
      body: "",
      teaserText: "",
      url: DEFAULT_COVER_IMAGE,
      fileName: "daoshu-preview-cover.png",
      fileData: "",
      mimeType: "image/png",
      visibility: "前台预览"
    },
    {
      type: "视频",
      title: "导数压轴题试看",
      description: "3 分钟讲解片段，领取后进群看完整版。",
      body: "",
      teaserText: "",
      url: "",
      fileName: "",
      fileData: "",
      mimeType: "",
      visibility: "前台预览"
    },
    {
      type: "语音",
      title: "老师语音说明",
      description: "说明资料适合哪些学生，以及后续进群安排。",
      body: "",
      teaserText: "",
      url: "",
      fileName: "",
      fileData: "",
      mimeType: "",
      visibility: "领取后展示"
    },
    {
      type: "PDF",
      title: "小册子样章",
      description: "可放 PDF 样章或资料目录链接。",
      body: "",
      teaserText: "",
      url: "",
      fileName: "",
      fileData: "",
      mimeType: "",
      visibility: "前台预览"
    }
  ],
  events: {
    page_view: 760,
    interest_click: 96,
    diagnosis_click: 126,
    join_click: 302,
    trial_click: 38,
    share_click: 54
  },
  visibility: {
    showStats: true,
    showRecentJoins: true,
    showAvatars: true,
    maskNames: true,
    showGradeSubject: true,
    showCampus: false,
    showPhone: false
  },
  currentSource: null,
  sourceVisitRecorded: false,
  visitors: {},
  selectedLead: 0
};

const state = loadState();
let wechatIdentity = loadWechatIdentity();
const visitSession = {
  id: getVisitorId(),
  startedAt: Date.now(),
  lastSyncedAt: Date.now(),
  serverSourceRecorded: null,
  recorded: false
};
let joinAutoScrollTimer = null;
let joinAutoScrollPaused = false;
let joinAutoScrollResumeTimer = null;
let joinAutoScrollInternal = false;
const RECENT_JOIN_PREVIEW_LIMIT = 4;
let activeLeadFilter = "全部访客";
let selectedCrmEntryKey = "";
let latestPublishedAt = "";
let adminAuthenticated = !isAdminPreview;
let activityCatalog = [];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()));
    return normalizeStateSnapshot(saved);
  } catch {
    return structuredClone(defaultState);
  }
}

function loadWechatIdentity() {
  try {
    return JSON.parse(localStorage.getItem(WECHAT_IDENTITY_KEY)) || null;
  } catch {
    return null;
  }
}

function saveWechatIdentity(identity) {
  if (!identity?.openid) return;
  wechatIdentity = identity;
  localStorage.setItem(WECHAT_IDENTITY_KEY, JSON.stringify(identity));
  if (typeof state !== "undefined") {
    const behavior = ensureVisitorBehavior();
    behavior.wechatIdentity = identity;
    behavior.lastSeen = formatDateTime(new Date());
    saveState();
  }
  configureWechatShareCard();
}

function isWeChatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent || "");
}

function initMockWechatIdentity() {
  if (urlParams.get("mock_wechat") !== "1") return;
  const seed = localStorage.getItem(VISITOR_KEY) || `mock_${Date.now()}`;
  saveWechatIdentity({
    openid: `mock_openid_${stableHash(seed).toString(16)}`,
    nickname: "微信家长",
    avatarUrl: getSystemAvatarUrl(seed),
    authorizedAt: formatDateTime(new Date()),
    mock: true
  });
}

async function ensureWechatAuthorization() {
  initMockWechatIdentity();
  if (!isPublicPage || wechatIdentity?.openid || !isWeChatBrowser()) return;
  const config = await postJsonSafeGet("/api/wechat/config");
  if (!config?.enabled) return;
  const authUrl = await postJsonSafeGet(`/api/wechat/oauth-url?redirect=${encodeURIComponent(window.location.href)}`);
  if (authUrl?.url) window.location.replace(authUrl.url);
}

async function configureWechatShareCard() {
  updateShareMeta();
  if (!isPublicPage || !isWeChatBrowser() || !window.wx) return;
  const payload = getSharePayload("page");
  const imgUrl = getShareImageUrl();
  const pageUrl = window.location.href.split("#")[0];
  const config = await postJsonSafeGet(`/api/wechat/js-config?url=${encodeURIComponent(pageUrl)}`);
  if (!config?.ok) return;
  window.wx.config({
    debug: false,
    appId: config.appId,
    timestamp: config.timestamp,
    nonceStr: config.nonceStr,
    signature: config.signature,
    jsApiList: ["updateAppMessageShareData", "updateTimelineShareData", "onMenuShareAppMessage", "onMenuShareTimeline"]
  });
  window.wx.ready(() => {
    const friendPayload = {
      title: payload.title,
      desc: payload.text,
      link: payload.url,
      imgUrl
    };
    const timelinePayload = {
      title: payload.title,
      link: payload.url,
      imgUrl
    };
    if (window.wx.updateAppMessageShareData) window.wx.updateAppMessageShareData(friendPayload);
    if (window.wx.updateTimelineShareData) window.wx.updateTimelineShareData(timelinePayload);
    if (window.wx.onMenuShareAppMessage) window.wx.onMenuShareAppMessage(friendPayload);
    if (window.wx.onMenuShareTimeline) window.wx.onMenuShareTimeline(timelinePayload);
  });
}

function normalizeStateSnapshot(snapshot) {
  if (!snapshot) return structuredClone(defaultState);
  const merged = {
    ...structuredClone(defaultState),
    ...snapshot,
    activity: { ...defaultState.activity, ...(snapshot.activity || {}) },
    events: { ...defaultState.events, ...(snapshot.events || {}) },
    visibility: { ...defaultState.visibility, ...(snapshot.visibility || {}) }
  };
  if (merged.activity.contentTitle === "资料包内容") merged.activity.contentTitle = defaultState.activity.contentTitle;
  if (merged.activity.contentNote === "文字 / 图片 / 视频 / PDF") merged.activity.contentNote = defaultState.activity.contentNote;
  merged.leads = Array.isArray(snapshot.leads) ? snapshot.leads : defaultState.leads;
  merged.channels = Array.isArray(snapshot.channels) ? snapshot.channels : defaultState.channels;
  merged.fields = normalizeFields(snapshot.fields || defaultState.fields);
  merged.materials = mergeMaterials(Array.isArray(snapshot.materials) ? snapshot.materials : defaultState.materials, !Array.isArray(snapshot.materials));
  return merged;
}

function replaceState(snapshot) {
  const normalized = normalizeStateSnapshot(snapshot);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, normalized);
}

function mergeByKey(defaultItems, savedItems, key) {
  const merged = [...savedItems];
  defaultItems.forEach((item) => {
    if (!merged.some((saved) => saved[key] === item[key])) merged.push(structuredClone(item));
  });
  return merged;
}

function saveState() {
  localStorage.setItem(storageKey(), JSON.stringify(state));
}

function getPublishSnapshot() {
  return {
    ...JSON.parse(JSON.stringify(state)),
    activitySlug: activeActivitySlug,
    publishedAt: new Date().toISOString()
  };
}

async function fetchPublishedState() {
  if (window.location.protocol === "file:") return null;
  const endpoints = isAdminPreview ? [apiWithActivity("/api/state")] : [apiWithActivity("/api/state"), apiWithActivity("/data/published-state.json")];
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}t=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin"
      });
      if (isAdminPreview && response.status === 401) {
        adminAuthenticated = false;
        return null;
      }
      if (!response.ok) continue;
      const snapshot = await response.json();
      if (snapshot?.activity) return snapshot;
    } catch {
      // Static file previews and file:// previews may not expose a publish endpoint.
    }
  }
  return null;
}

async function postJsonSafeGet(endpoint) {
  try {
    const response = await fetch(endpoint, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function loadActivityCatalog() {
  if (!isAdminPreview || !adminAuthenticated) return;
  const result = await postJsonSafeGet("/api/activities");
  if (Array.isArray(result?.activities)) activityCatalog = result.activities;
}

function renderActivitySwitcher() {
  if (!isAdminPreview) return;
  let switcher = document.querySelector("#activitySwitcher");
  if (!adminAuthenticated) {
    switcher?.remove();
    return;
  }
  const brand = document.querySelector(".brand-mark");
  if (!brand) return;
  if (!switcher) {
    switcher = document.createElement("div");
    switcher.id = "activitySwitcher";
    switcher.className = "activity-switcher";
    brand.insertAdjacentElement("afterend", switcher);
  }
  const options = (activityCatalog.length ? activityCatalog : [{ slug: activeActivitySlug, title: state.activity.adminName || state.activity.title }])
    .map((item) => `<option value="${item.slug}" ${item.slug === activeActivitySlug ? "selected" : ""}>${item.title || item.slug}</option>`)
    .join("");
  const publicUrl = getPublicActivityUrl();
  switcher.innerHTML = `
    <label>
      <span>当前活动</span>
      <select id="activitySelect">${options}</select>
    </label>
    <div class="activity-switcher-actions">
      <button type="button" id="createActivityButton">新建活动</button>
    </div>
    <div class="activity-link-card">
      <span>家长端链接</span>
      <code>${publicUrl}</code>
      <div>
        <button type="button" data-copy-activity-link="${publicUrl}">复制链接</button>
        <button type="button" data-open-activity-link="${publicUrl}">打开预览</button>
      </div>
    </div>
    <details class="activity-danger-box">
      <summary>高级操作</summary>
      <p>这些操作会影响当前活动，请确认后再使用。</p>
      <button type="button" class="activity-muted-danger" id="resetActivityConfigButton">重置页面配置</button>
      <button type="button" class="activity-hard-danger" id="clearActivityDataButton">清空当前活动数据</button>
    </details>
  `;
}

async function switchActivity(slug) {
  const nextSlug = normalizeActivitySlug(slug);
  if (!nextSlug || nextSlug === activeActivitySlug) return;
  saveState();
  activeActivitySlug = nextSlug;
  localStorage.setItem(ADMIN_ACTIVITY_KEY, activeActivitySlug);
  latestPublishedAt = "";
  selectedCrmEntryKey = "";
  activeLeadFilter = "全部访客";
  await hydratePublishedState();
  renderAll();
  showToast("已切换活动");
}

async function createNewActivity() {
  if (!adminAuthenticated) {
    showToast("请先登录后台");
    return;
  }
  const title = window.prompt("新活动名称，例如：高三圆锥曲线资料领取", "");
  if (!title?.trim()) return;
  const defaultSlug = `activity-${new Date().toISOString().slice(5, 10).replace("-", "")}`;
  const slug = normalizeActivitySlug(window.prompt("活动链接后缀，只用英文/数字，例如：yuanzhui", defaultSlug));
  if (!slug || slug === DEFAULT_ACTIVITY_SLUG) {
    showToast("请换一个活动链接后缀");
    return;
  }
  const result = await postJson("/api/activities", { title: title.trim(), slug, templateSlug: activeActivitySlug });
  if (!result?.ok) {
    showToast("新建失败，可能链接后缀已存在");
    return;
  }
  if (Array.isArray(result.activities)) activityCatalog = result.activities;
  await switchActivity(result.activity.slug);
  showActivityCreatedDialog(result.activity);
}

function closeActivityCreatedDialog() {
  document.querySelector("#activityCreatedDialog")?.remove();
}

function showActivityCreatedDialog(activity = {}) {
  if (!isAdminPreview) return;
  const slug = normalizeActivitySlug(activity.slug || activeActivitySlug);
  const publicUrl = getPublicActivityUrl(slug);
  closeActivityCreatedDialog();
  const dialog = document.createElement("div");
  dialog.id = "activityCreatedDialog";
  dialog.className = "activity-created-dialog";
  dialog.innerHTML = `
    <div class="activity-created-backdrop" data-close-activity-dialog></div>
    <section class="activity-created-card" role="dialog" aria-modal="true" aria-labelledby="activityCreatedTitle">
      <button type="button" class="activity-created-close" data-close-activity-dialog aria-label="关闭">×</button>
      <span class="activity-created-badge">新活动已创建</span>
      <h2 id="activityCreatedTitle">${activity.title || activity.adminName || state.activity.title || "资料领取活动"}</h2>
      <p>家长端链接已经生成，可以直接复制发给家长或打开预览。</p>
      <div class="activity-created-link">
        <span>家长端链接</span>
        <code>${publicUrl}</code>
      </div>
      <div class="activity-created-actions">
        <button type="button" data-copy-created-link="${publicUrl}">复制链接</button>
        <button type="button" data-open-created-link="${publicUrl}">打开预览</button>
      </div>
    </section>
  `;
  document.body.appendChild(dialog);
}

async function clearCurrentActivityData() {
  if (!adminAuthenticated) {
    showToast("请先登录后台");
    return;
  }
  const confirmText = "清空当前活动数据";
  const typed = window.prompt(
    `清空当前活动数据？\n\n这会删除当前活动的访问记录、领取记录、CRM客户、分享关系和近期动态。\n页面内容、资料、标题不会删除。\n\n请输入：${confirmText}`
  );
  if (typed === null) return;
  if (typed !== confirmText) {
    showToast("未清空：确认文字不一致");
    return;
  }
  const result = await postJson(apiWithActivity("/api/activities/reset"), { activitySlug: activeActivitySlug });
  if (!result?.ok) {
    showToast("清空失败，请稍后重试");
    return;
  }
  if (Array.isArray(result.activities)) activityCatalog = result.activities;
  replaceState(result.state);
  saveState();
  renderAll();
  showToast("当前活动数据已清空");
}

function resetActivityConfig() {
  const ok = window.confirm("确定重置当前活动页面配置吗？\n\n这会恢复标题、文案、名额、资料展示等页面配置。\n客户数据不会删除。");
  if (!ok) return;
  state.activity = {
    tag: "高三数学资料",
    title: "高三导数专题资料包领取",
    subtitle: "精选往季保校训练营导数题，进群领取小册子和配套讲解视频。",
    joinLabel: "已领取",
    totalQuota: "50",
    deadline: "2026-06-10T22:00",
    adminName: "高三导数资料包",
    contentTitle: "资料预览",
    contentNote: "题册 + 视频",
    noticeLeft: "302 位高三学生/家长已领取",
    ctaText: "立即领取资料",
    formHint: "为给孩子预留资料，请填写领取信息。",
    teacherWechat: "math-guide-2026",
    passphrase: "导数资料",
    successTitle: "领取预约已提交",
    successSubtitle: "资料已为孩子预留",
    successContactText: "老师会尽快联系您确认领取安排。",
    qrTitle: "长按二维码添加老师",
    qrSubtitle: "领取题册和讲解视频",
    teacherQrImage: "",
    teacherQrFileName: "",
    shareLead: "如果身边有同样需要导数资料的高三家长，可以顺手转给他。",
    shareTitle: "高三导数50题精讲资料领取",
    shareDescription: DEFAULT_SHARE_DESCRIPTION,
    shareImage: DEFAULT_SHARE_IMAGE,
    audience: ["导数基础题能做，但压轴题不稳定", "恒成立、零点、分类讨论容易卡住", "想进群跟着刷题和看讲解视频"]
  };
  saveState();
  renderAll();
  showToast("页面配置已重置");
}

async function checkAdminSession() {
  if (!isAdminPreview) return true;
  const session = await postJsonSafeGet("/api/admin/session");
  adminAuthenticated = Boolean(session?.authenticated);
  return adminAuthenticated;
}

async function loginAdmin(password) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ password })
  });
  if (!response.ok) return false;
  const result = await response.json();
  adminAuthenticated = Boolean(result?.authenticated);
  return adminAuthenticated;
}

async function logoutAdmin() {
  await fetch("/api/admin/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: "{}"
  });
  adminAuthenticated = false;
  renderAdminAuthGate();
}

async function unlockAdmin(password) {
  const ok = await loginAdmin(password);
  if (!ok) return false;
  await hydratePublishedState();
  renderAdminAuthGate();
  renderAll();
  return true;
}

async function hydratePublishedState() {
  if (isAdminPreview && !adminAuthenticated) return;
  await loadActivityCatalog();
  const hasLocalDraft = Boolean(localStorage.getItem(storageKey()));
  const snapshot = await fetchPublishedState();
  if (!snapshot) return;
  if (isAdminPreview || isPublicPage || !hasLocalDraft) {
    replaceState(snapshot);
    latestPublishedAt = snapshot.publishedAt || "";
    saveState();
  }
}

async function refreshPublishedState() {
  if (!isPublicPage) return;
  if (document.querySelector("#drawer")?.classList.contains("is-open")) return;
  const snapshot = await fetchPublishedState();
  if (!snapshot || (snapshot.publishedAt || "") === latestPublishedAt) return;

  const localVisitors = state.visitors || {};
  const sourceVisitRecorded = state.sourceVisitRecorded;
  replaceState(snapshot);
  state.visitors = { ...(state.visitors || {}), ...localVisitors };
  state.sourceVisitRecorded = sourceVisitRecorded;
  latestPublishedAt = snapshot.publishedAt || "";
  saveState();
  renderAll();
}

async function postJson(endpoint, payload, options = {}) {
  if (window.location.protocol === "file:") return null;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: Boolean(options.keepalive),
      credentials: "same-origin"
    });
    if (!response.ok) throw new Error("request failed");
    return await response.json();
  } catch {
    return null;
  }
}

function serverSyncPayload(extra = {}) {
  return {
    activitySlug: activeActivitySlug,
    visitorId: visitSession.id,
    source: state.currentSource,
    behavior: getVisitorSnapshot(),
    wechatIdentity,
    ...extra
  };
}

function syncVisitToServer(recordView = false, keepalive = false) {
  if (!isPublicPage) return;
  postJson(apiWithActivity("/api/visit"), serverSyncPayload({ recordView }), { keepalive });
}

function syncEventToServer(key) {
  if (!isPublicPage) return;
  postJson(apiWithActivity("/api/event"), serverSyncPayload({ key }), { keepalive: true });
}

async function syncLeadSubmissionToServer(submission) {
  if (!isPublicPage) return null;
  const result = await postJson(apiWithActivity("/api/lead"), { ...submission, activitySlug: activeActivitySlug });
  if (!result?.ok) return null;
  return {
    ...submission,
    join: result.join || submission.join,
    lead: result.lead || submission.lead,
    shareRef: result.shareRef || submission.shareRef,
    shareUrl: result.shareUrl || submission.shareUrl,
    actualJoinCount: result.actualJoinCount,
    duplicate: Boolean(result.duplicate),
    serverMessage: result.message || "",
    synced: true
  };
}

function syncFullStateToServer() {
  if (window.location.protocol === "file:") return;
  postJson(apiWithActivity("/api/state"), getPublishSnapshot(), { keepalive: true });
}

function applySyncedStateSnapshot(snapshot) {
  if (!snapshot) return;
  replaceState(snapshot);
  saveState();
}

async function readPublishError(response) {
  try {
    const payload = await response.clone().json();
    return payload?.error || "";
  } catch {
    try {
      return (await response.text()).trim();
    } catch {
      return "";
    }
  }
}

function publishErrorMessage(status, detail = "") {
  if (status === 401) return "后台登录已失效，或正在家长端域名操作；请到管理端重新登录后发布";
  if (status === 413) return "图片太大，发布失败；请压缩后重新上传";
  if (status >= 500) return "服务器保存失败，请稍后重试或查看服务日志";
  if (detail) return `发布失败：${detail}`;
  return `发布失败：HTTP ${status}`;
}

async function publishState() {
  saveState();
  const button = document.querySelector("#publishActivity");
  const originalText = button?.textContent || "保存并发布";
  if (button) {
    button.disabled = true;
    button.textContent = "发布中";
  }
  try {
    const response = await fetch(apiWithActivity("/api/state"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(getPublishSnapshot())
    });
    if (response.status === 401) {
      adminAuthenticated = false;
      renderAdminAuthGate();
      showToast(publishErrorMessage(response.status));
      return false;
    }
    if (!response.ok) {
      showToast(publishErrorMessage(response.status, await readPublishError(response)));
      return false;
    }
    showToast("已发布，家长端刷新后生效");
    return true;
  } catch (error) {
    console.error("publish failed", error);
    showToast(adminAuthenticated ? "发布失败，请检查网络后重试" : "请先登录后台");
    return false;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function getActualJoinCount() {
  return getVisibleJoins().length;
}

function getVisibleJoins() {
  return state.joins.filter((item) => !item.hiddenFromPublic);
}

function getTotalQuota() {
  const value = Number.parseInt(state.activity.totalQuota || state.activity.quota || "0", 10);
  return Number.isFinite(value) ? value : 0;
}

function getRemainingQuota() {
  return Math.max(0, getTotalQuota() - getActualJoinCount());
}

function getDeadlineDate() {
  const date = new Date(state.activity.deadline || "");
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDeadline(date) {
  if (!date) return "暂未设置";
  return `${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderCountdown() {
  const deadline = getDeadlineDate();
  const deadlineText = document.querySelector("#deadlineText");
  const countdownUnits = document.querySelector("#countdownUnits");
  if (!deadlineText || !countdownUnits) return;

  deadlineText.textContent = formatDeadline(deadline);
  if (!deadline) {
    countdownUnits.innerHTML = `<span>暂未设置截止时间</span>`;
    return;
  }

  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) {
    countdownUnits.innerHTML = `<span class="countdown-ended">本轮已截止</span>`;
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const label = days > 0 ? `距截止 ${days}天${hours}小时` : `距截止 ${Math.max(1, hours)}小时内`;
  countdownUnits.innerHTML = `<span>${label}</span>`;
}

function normalizeFields(fields) {
  return fields.map((field, index) => ({
    key: field.key || inferFieldKey(field, index),
    name: field.name || "自定义问题",
    type: field.type || "填空",
    required: Boolean(field.required),
    options: Array.isArray(field.options) ? field.options : []
  }));
}

function mergeMaterials(savedItems, includeDefaults = false) {
  const merged = [...savedItems];
  if (includeDefaults) {
    defaultState.materials.forEach((item) => {
      const hasSameItem = merged.some((saved) => saved.title === item.title && saved.type === item.type);
      const hasCoverItem =
        item.type === "图片" &&
        merged.some((saved) => saved.type === "图片" && (saved.title === "题册目录预览" || saved.title.includes("封面") || saved.title.includes("目录")));
      if (!hasSameItem && !hasCoverItem) merged.push(structuredClone(item));
    });
  }
  const cover = merged.find((item) => item.type === "图片" && (item.title === "题册目录预览" || item.title.includes("封面") || item.title.includes("目录")));
  if (cover && !cover.fileData && (!cover.url || LEGACY_COVER_IMAGES.includes(cover.url))) {
    cover.title = "高三导数好题封面预览";
    cover.description = "洛优好题系列导数专题封面，家长可第一眼看到资料质感。";
    cover.url = DEFAULT_COVER_IMAGE;
    cover.fileName = "daoshu-preview-cover.png";
    cover.mimeType = "image/png";
    cover.visibility = "前台预览";
  }
  return merged;
}

function inferFieldKey(field, index) {
  if (field.name?.includes("姓名")) return "name";
  if (field.name?.includes("联系") || field.name?.includes("电话") || field.name?.includes("手机")) return "phone";
  if (field.name?.includes("分数")) return "scoreRange";
  if (field.name?.includes("当前问题") || field.name?.includes("最卡") || field.name?.includes("卡点")) return "issue";
  return `custom_${index}`;
}

function resetState() {
  localStorage.removeItem(storageKey());
  localStorage.removeItem(VISITOR_KEY);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, structuredClone(defaultState));
  visitSession.id = getVisitorId();
  visitSession.startedAt = Date.now();
  visitSession.lastSyncedAt = Date.now();
  visitSession.serverSourceRecorded = null;
  visitSession.recorded = false;
}

const eventLabels = {
  page_view: "页面访问",
  interest_click: "领取资料",
  diagnosis_click: "学习诊断",
  join_click: "进群接龙",
  trial_click: "预约试听",
  share_click: "分享点击",
  detail_click: "资料详情"
};

const panels = {
  diagnosis: {
    title: "学习诊断",
    type: "diagnosis"
  },
  join: {
    title: "领取导数资料包",
    type: "join"
  },
  trial: {
    title: "预约试听",
    type: "trial"
  },
  newChannel: {
    title: "新建渠道链接",
    type: "newChannel"
  },
  allJoins: {
    title: "全部领取动态",
    type: "allJoins"
  },
  detail: {
    title: "资料适合谁",
    type: "detail"
  }
};

function getSharePayload(ref = "page") {
  const shareRef = ref === "page" ? getPersonalShareRef() : ref;
  const url = new URL(getPublicActivityUrl(), window.location.origin);
  url.searchParams.delete("source");
  url.searchParams.set("ref", shareRef);
  return {
    title: getShareTitle(),
    text: getShareDescription(),
    url: url.toString()
  };
}

function getShareTitle() {
  return state.activity.shareTitle || state.activity.title || "高三导数50题精讲资料领取";
}

function getShareDescription() {
  return state.activity.shareDescription || DEFAULT_SHARE_DESCRIPTION;
}

function getShareImageUrl() {
  const source = state.activity.shareImage || DEFAULT_SHARE_IMAGE;
  if (/^data:/i.test(source)) return DEFAULT_SHARE_IMAGE;
  try {
    return new URL(source, window.location.origin).toString();
  } catch {
    return DEFAULT_SHARE_IMAGE;
  }
}

function getPersonalShareRef() {
  if (wechatIdentity?.openid) return `wx_${stableHash(wechatIdentity.openid).toString(36)}`;
  return `visitor_${stableHash(visitSession.id || getVisitorId()).toString(36)}`;
}

function setMetaContent(selector, value) {
  const node = document.head.querySelector(selector);
  if (node) node.setAttribute("content", value);
}

function updateShareMeta() {
  const payload = getSharePayload("page");
  const imageUrl = getShareImageUrl();
  document.title = payload.title;
  setMetaContent('meta[name="description"]', payload.text);
  setMetaContent('meta[property="og:title"]', payload.title);
  setMetaContent('meta[property="og:description"]', payload.text);
  setMetaContent('meta[property="og:image"]', imageUrl);
  setMetaContent('meta[property="og:url"]', payload.url);
}

function maskName(name) {
  if (name.length <= 1) return name;
  return `${name[0]}*`;
}

function maskOpenId(openid = "") {
  if (openid.length <= 10) return openid || "未记录";
  return `${openid.slice(0, 6)}...${openid.slice(-4)}`;
}

function publicName(name) {
  return state.visibility.maskNames ? maskName(name) : name;
}

function publicJoinTitle(item) {
  const gradeSubject = state.visibility.showGradeSubject ? `｜${item.grade}${item.subject}` : "";
  return `${publicName(item.name)}家长${gradeSubject}`;
}

function publicJoinMeta(item) {
  const lead = findLeadByName(item.name);
  const parts = [item.time];
  const school = item.school || lead?.school || lead?.answers?.school || lead?.answers?.["所在学校"];
  if (state.visibility.showCampus && school) parts.push(school);
  if (state.visibility.showPhone && lead?.phone) parts.push(lead.phone);
  return parts.join(" · ");
}

function renderAvatar(item) {
  const identity = item.wechatIdentity || item.behavior?.wechatIdentity || {};
  const avatarUrl = identity.avatarUrl || item.avatarUrl || getSystemAvatarUrl(`${item.name}-${item.id || item.source || ""}`);
  if (avatarUrl) return `<span class="avatar avatar-photo"><img src="${avatarUrl}" alt="${maskName(item.name)}家长头像" /></span>`;
  const label = item.avatar || item.name?.[0] || "家";
  const color = item.avatarColor || stringToColor(item.name || label);
  return `<span class="avatar" style="background:${color}">${label}</span>`;
}

function renderJoinAvatar(item) {
  return state.visibility.showAvatars ? renderAvatar(item) : "";
}

function stringToColor(value) {
  const colors = ["#2f9b57", "#3b82c4", "#d97706", "#9b5bd6", "#0f8f8f", "#dc5f45"];
  const total = [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function stableHash(value) {
  return [...String(value || "家长")].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function getSystemAvatarUrl(seed) {
  const hash = stableHash(seed);
  const base = (hash % SYSTEM_AVATAR_BASE_COUNT) + 1;
  const variant = hash % SYSTEM_AVATAR_COUNT;
  return `/assets/system-avatars/avatar-${String(base).padStart(2, "0")}.svg?v=${variant}`;
}

function readCurrentSource() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("source");
  const ref = params.get("ref");
  if (ref) return { kind: "ref", key: ref };
  if (source) return { kind: "source", key: source };
  return { kind: "direct", key: "direct" };
}

function resolveSourceLabel(source) {
  if (!source || source.key === "direct") return "自然访问";
  const channel = state.channels.find((item) => item.source === source.key);
  if (channel) return channel.name;
  if (source.kind === "ref") return `用户分享 ${source.key}`;
  return source.key;
}

function ensureChannelForSource(source) {
  if (!source || source.key === "direct") return null;
  let channel = state.channels.find((item) => item.source === source.key);
  if (channel) return channel;
  channel = {
    type: source.kind === "ref" ? "家长分享" : "外部渠道",
    name: source.kind === "ref" ? `${source.key} 分享` : source.key,
    source: source.key,
    views: 0,
    joins: 0,
    shares: 0,
    leads: []
  };
  state.channels.unshift(channel);
  return channel;
}

function makeUniqueShareRef(baseId) {
  let ref = `user_${baseId}`;
  let offset = 1;
  while (state.channels.some((channel) => channel.source === ref)) {
    ref = `user_${baseId}_${offset}`;
    offset += 1;
  }
  return ref;
}

function ensureShareChannelForLead(name, shareRef) {
  let channel = state.channels.find((item) => item.source === shareRef);
  if (channel) return channel;
  channel = {
    type: "家长分享",
    name: `${name}分享`,
    source: shareRef,
    views: 0,
    joins: 0,
    shares: 0,
    leads: []
  };
  state.channels.unshift(channel);
  return channel;
}

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
}

function ensureVisitorBehavior() {
  state.visitors ||= {};
  if (!state.visitors[visitSession.id]) {
    state.visitors[visitSession.id] = {
      id: visitSession.id,
      visits: 0,
      totalSeconds: 0,
      currentSeconds: 0,
      maxSeconds: 0,
      clicks: 0,
      lastSource: "自然访问",
      lastSeen: "",
      wechatIdentity: wechatIdentity || null
    };
  }
  if (wechatIdentity?.openid) state.visitors[visitSession.id].wechatIdentity = wechatIdentity;
  return state.visitors[visitSession.id];
}

function recordVisitSession() {
  if (visitSession.recorded) return;
  const behavior = ensureVisitorBehavior();
  behavior.visits += 1;
  behavior.lastSource = resolveSourceLabel(state.currentSource);
  behavior.lastSeen = formatDateTime(new Date());
  visitSession.recorded = true;
  saveState();
}

function syncVisitorBehavior() {
  const now = Date.now();
  const elapsed = Math.max(0, Math.round((now - visitSession.lastSyncedAt) / 1000));
  if (!elapsed) return ensureVisitorBehavior();

  const behavior = ensureVisitorBehavior();
  behavior.totalSeconds += elapsed;
  behavior.currentSeconds = Math.round((now - visitSession.startedAt) / 1000);
  behavior.maxSeconds = Math.max(behavior.maxSeconds, behavior.currentSeconds);
  behavior.lastSource = resolveSourceLabel(state.currentSource);
  behavior.lastSeen = formatDateTime(new Date(now));
  if (wechatIdentity?.openid) behavior.wechatIdentity = wechatIdentity;
  visitSession.lastSyncedAt = now;
  saveState();
  return behavior;
}

function getVisitorSnapshot() {
  const behavior = syncVisitorBehavior();
  return {
    visits: behavior.visits,
    totalSeconds: behavior.totalSeconds,
    currentSeconds: behavior.currentSeconds,
    maxSeconds: behavior.maxSeconds,
    clicks: behavior.clicks,
    lastSource: behavior.lastSource,
    lastSeen: behavior.lastSeen,
    wechatIdentity
  };
}

function scoreBehaviorIntent(behavior) {
  if (!behavior) return 0;
  const stayScore = Math.min(10, Math.floor((behavior.currentSeconds || 0) / 15));
  const visitScore = Math.min(8, Math.max(0, (behavior.visits || 1) - 1) * 2);
  const clickScore = Math.min(8, (behavior.clicks || 0) * 2);
  return stayScore + visitScore + clickScore;
}

function formatDuration(seconds = 0) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  if (minutes <= 0) return `${remainder} 秒`;
  return `${minutes} 分 ${remainder} 秒`;
}

function formatDateTime(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getReferralForLead(lead) {
  return state.channels.find((channel) => channel.type === "家长分享" && channel.name.startsWith(lead.name));
}

function getFollowReasons(lead) {
  const behavior = lead.behavior || {};
  const referral = getReferralForLead(lead);
  const reasons = [];

  if (lead.score >= 85) reasons.push(`意向分 ${lead.score}`);
  if (behavior.visits >= 2) reasons.push(`进入 ${behavior.visits} 次`);
  if (behavior.currentSeconds >= 60 || behavior.totalSeconds >= 120) reasons.push(`停留 ${formatDuration(Math.max(behavior.currentSeconds || 0, behavior.totalSeconds || 0))}`);
  if (behavior.clicks >= 2) reasons.push(`点击 ${behavior.clicks} 次`);
  if (["新领取", "已加微信", "已进群", "有训练营意向"].includes(lead.status)) reasons.push(lead.status);
  if (referral?.joins > 0) reasons.push(`分享带来 ${referral.joins} 人`);
  if (lead.issue) reasons.push(lead.issue);

  return reasons.slice(0, 4);
}

function getNextFollowAction(lead) {
  if (lead.status === "新领取") return "先加微信，确认资料是否收到";
  if (lead.status === "已加微信") return "拉进资料群，发送导数小册子";
  if (lead.status === "已进群") return "观察互动，邀请做学习诊断";
  if (lead.status === "已发资料") return "追问资料使用感受";
  if (lead.status === "已互动") return "推荐对应专题训练";
  if (lead.status === "有训练营意向") return "安排试听或电话沟通";
  if (lead.status === "已报名") return "维护关系，鼓励分享";
  return "低优先级，暂缓跟进";
}

function getFollowPriority(lead) {
  const behavior = lead.behavior || {};
  const referral = getReferralForLead(lead);
  const statusBoost = {
    "有训练营意向": 18,
    "已互动": 14,
    "已进群": 12,
    "已加微信": 10,
    "新领取": 8,
    "已发资料": 8,
    "已报名": 4,
    "无效": -50
  };

  return (
    lead.score +
    (statusBoost[lead.status] || 0) +
    Math.min(12, (behavior.visits || 0) * 3) +
    Math.min(12, Math.floor((behavior.totalSeconds || behavior.currentSeconds || 0) / 30)) +
    Math.min(8, (behavior.clicks || 0) * 2) +
    (referral ? Math.min(10, referral.joins * 2) : 0)
  );
}

function getFollowReminderGroups() {
  const groups = [
    {
      key: "new",
      title: "马上联系",
      action: "先加微信，确认资料是否收到",
      statuses: ["新领取"]
    },
    {
      key: "group",
      title: "拉进资料群",
      action: "发送进群方式和资料领取口令",
      statuses: ["已加微信"]
    },
    {
      key: "material",
      title: "发资料后互动",
      action: "提醒看题册/视频，追问卡点",
      statuses: ["已进群", "已发资料", "已互动"]
    },
    {
      key: "trial",
      title: "转试听/训练营",
      action: "安排试听或电话沟通",
      statuses: ["有训练营意向"]
    }
  ];

  return groups.map((group) => ({
    ...group,
    leads: state.leads
      .map((lead, index) => ({ lead, index, priority: getFollowPriority(lead) }))
      .filter(({ lead }) => group.statuses.includes(lead.status))
      .sort((a, b) => b.priority - a.priority)
  }));
}

function getSharerNameFromSource(source) {
  if (!source || source.kind !== "ref") return null;
  const channel = state.channels.find((item) => item.source === source.key);
  if (!channel || channel.type !== "家长分享") return null;
  return channel.name.replace(/分享$/, "").trim() || null;
}

function getOrderedPublicJoins() {
  const sharerName = getSharerNameFromSource(state.currentSource);
  const visibleJoins = getVisibleJoins();
  if (!sharerName) return visibleJoins;

  const sharerJoin = visibleJoins.find((item) => item.name === sharerName);
  if (!sharerJoin) return visibleJoins;

  return [sharerJoin, ...visibleJoins.filter((item) => item.name !== sharerName)];
}

function getRecentJoins() {
  return getOrderedPublicJoins().slice(0, RECENT_JOIN_PREVIEW_LIMIT);
}

function renderSourceNotice() {
  const notice = document.querySelector("#sourceNotice");
  if (!notice) return;
  const label = resolveSourceLabel(state.currentSource);
  notice.textContent = `当前来源：${label}`;
}

function renderActivity() {
  updateShareMeta();
  document.querySelectorAll("[data-activity-field]").forEach((node) => {
    const key = node.dataset.activityField;
    node.textContent = state.activity[key] || publicActivityCopy[key] || "";
  });
  document.querySelector("#audienceList").innerHTML = state.activity.audience
    .map((item) => `<li>${item}</li>`)
    .join("");
  document.querySelectorAll("[data-edit-activity]").forEach((input) => {
    const key = input.dataset.editActivity;
    if (document.activeElement !== input) input.value = state.activity[key] || "";
  });
  const qrStatus = document.querySelector("[data-activity-qr-status]");
  if (qrStatus) {
    qrStatus.innerHTML = state.activity.teacherQrImage
      ? `<span>已上传：${state.activity.teacherQrFileName || "老师二维码"}</span><button type="button" data-clear-activity-image="teacherQrImage">清除二维码</button>`
      : `<span>未上传时使用系统默认二维码。</span>`;
  }
  const shareCoverStatus = document.querySelector("[data-share-cover-status]");
  if (shareCoverStatus) {
    shareCoverStatus.innerHTML = state.activity.shareImageFileName
      ? `<span>已上传：${state.activity.shareImageFileName}</span><button type="button" data-clear-share-cover>恢复默认封面</button>`
      : `<span>未上传时使用分享封面图地址。</span>`;
  }
}

function renderJoins() {
  const container = document.querySelector("#recentJoins");
  const joins = getRecentJoins();
  const allJoins = getOrderedPublicJoins();
  const allButton = document.querySelector('.join-list [data-open-panel="allJoins"]');
  if (allButton) {
    allButton.textContent = allJoins.length > RECENT_JOIN_PREVIEW_LIMIT ? `查看全部 ${allJoins.length} 位家长` : "已全部显示";
    allButton.hidden = allJoins.length <= RECENT_JOIN_PREVIEW_LIMIT;
  }
  const loopJoins = joins.length > 3 ? [...joins, ...joins] : joins;
  container.innerHTML = loopJoins
    .map(
      (item) => `
        <article class="join-item">
          ${renderJoinAvatar(item)}
          <div>
            <strong>${publicJoinTitle(item)}</strong>
            <small>${publicJoinMeta(item)}</small>
          </div>
          <span class="join-rank">#${item.id}</span>
        </article>
      `
    )
    .join("");
  setupJoinAutoScroll();
}

function setupJoinAutoScroll() {
  const container = document.querySelector("#recentJoins");
  if (!container) return;
  window.clearInterval(joinAutoScrollTimer);
  window.clearTimeout(joinAutoScrollResumeTimer);
  joinAutoScrollPaused = false;

  const pause = () => {
    if (joinAutoScrollInternal) return;
    joinAutoScrollPaused = true;
    window.clearTimeout(joinAutoScrollResumeTimer);
    joinAutoScrollResumeTimer = window.setTimeout(() => {
      joinAutoScrollPaused = false;
    }, 3200);
  };

  if (!container.dataset.autoScrollBound) {
    container.addEventListener("touchstart", pause, { passive: true });
    container.addEventListener("mousedown", pause);
    container.addEventListener("scroll", pause, { passive: true });
    container.dataset.autoScrollBound = "true";
  }

  joinAutoScrollTimer = window.setInterval(() => {
    if (joinAutoScrollPaused || container.scrollHeight <= container.clientHeight) return;
    joinAutoScrollInternal = true;
    container.scrollTop += 1;
    if (container.scrollTop >= container.scrollHeight / 2) container.scrollTop = 0;
    window.requestAnimationFrame(() => {
      joinAutoScrollInternal = false;
    });
  }, 55);
}

function renderEvents() {
  const max = Math.max(...Object.values(state.events));
  document.querySelector("#eventBars").innerHTML = Object.entries(state.events)
    .map(([key, value]) => {
      const width = Math.max(6, Math.round((value / max) * 100));
      return `
        <div class="event-row">
          <span>${eventLabels[key] || key}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join("");
}

function renderHotLeads() {
  const hot = [...state.leads]
    .map((lead, index) => ({ lead, index, priority: getFollowPriority(lead), reasons: getFollowReasons(lead) }))
    .filter((item) => item.lead.status !== "无效")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
  document.querySelector("#hotLeadList").innerHTML = hot
    .map(
      ({ lead, index, priority, reasons }) => `
        <article class="follow-card" data-focus-lead="${index}">
          <div class="follow-head">
            <span class="avatar">${lead.name[0]}</span>
            <div>
              <strong>${lead.name}</strong>
              <small>${lead.status} · ${lead.source}</small>
            </div>
            <span class="score">${Math.round(priority)}</span>
          </div>
          <div class="reason-tags">
            ${reasons.map((reason) => `<span>${reason}</span>`).join("")}
          </div>
          <p>${getNextFollowAction(lead)}</p>
        </article>
      `
    )
    .join("");
}

function renderFollowReminders() {
  const container = document.querySelector("#followReminderBoard");
  if (!container) return;
  container.innerHTML = getFollowReminderGroups()
    .map(
      (group) => `
        <article class="follow-reminder-card">
          <div class="follow-reminder-head">
            <div>
              <strong>${group.title}</strong>
              <span>${group.action}</span>
            </div>
            <b>${group.leads.length}</b>
          </div>
          <div class="follow-reminder-leads">
            ${
              group.leads.length
                ? group.leads
                    .slice(0, 3)
                    .map(
                      ({ lead, index, priority }) => `
                        <button type="button" data-focus-lead="${index}">
                          <span>${lead.name}</span>
                          <small>${lead.issue || lead.source}</small>
                          <em>${Math.round(priority)}</em>
                        </button>
                      `
                    )
                    .join("")
                : `<p>暂无待处理客户</p>`
            }
          </div>
        </article>
      `
    )
    .join("");
}

function renderLeadRows() {
  const entries = getFilteredLeadEntries();
  if (!entries.length) selectedCrmEntryKey = "";
  if (entries.length && !entries.some(({ key }) => key === selectedCrmEntryKey)) selectedCrmEntryKey = entries[0].key;
  const selectedEntry = entries.find(({ key }) => key === selectedCrmEntryKey);
  if (selectedEntry?.kind === "lead") state.selectedLead = selectedEntry.index;
  document.querySelector("#leadRows").innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <tr data-crm-entry-key="${entry.key}" class="${entry.key === selectedCrmEntryKey ? "is-selected" : ""}">
              <td>${renderCrmCustomerCell(entry)}</td>
              <td>${entry.grade}</td>
              <td>${entry.subject}</td>
              <td>${entry.school}</td>
              <td>${entry.source}</td>
              <td><span class="score">${entry.score}</span></td>
              <td><span class="status">${entry.status}</span></td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="7" class="empty-table">当前筛选下暂无客户</td></tr>`;
}

function setLeadFilter(filter) {
  activeLeadFilter = filter;
  document.querySelectorAll("[data-lead-filter]").forEach((item) => item.classList.toggle("is-selected", item.dataset.leadFilter === filter));
  selectedCrmEntryKey = "";
  renderLeadRows();
  renderLeadDetail();
}

function getFilteredLeadEntries() {
  return getCrmEntries().filter((entry) => {
    if (activeLeadFilter === "全部访客") return true;
    if (activeLeadFilter === "已微信授权") return Boolean(entry.wechatIdentity?.openid);
    if (activeLeadFilter === "已提交预约") return entry.kind === "lead";
    if (activeLeadFilter === "已接龙") return entry.hasJoin;
    return entry.status === activeLeadFilter;
  });
}

function getRecordWechatIdentity(item = {}) {
  return item.wechatIdentity || item.behavior?.wechatIdentity || null;
}

function getLeadOpenid(lead = {}) {
  return getRecordWechatIdentity(lead)?.openid || "";
}

function leadHasJoin(lead) {
  const openid = getLeadOpenid(lead);
  return state.joins.some((item) => {
    if (lead.submissionId && item.submissionId === lead.submissionId) return true;
    if (openid && item.wechatIdentity?.openid === openid) return true;
    if (lead.phone && item.phone === lead.phone) return true;
    return item.name === lead.name;
  });
}

function getCrmEntries() {
  const leadEntries = state.leads.map((lead, index) => {
    const wechat = getRecordWechatIdentity(lead);
    return {
      key: `lead:${index}`,
      kind: "lead",
      index,
      item: lead,
      name: lead.name,
      phone: lead.phone || "未填写",
      grade: lead.grade || "高三",
      subject: lead.subject || "数学",
      school: lead.school || lead.answers?.school || lead.answers?.["所在学校"] || "未填写",
      source: lead.source || "自然访问",
      score: lead.score || 0,
      status: lead.status || "正式线索",
      wechatIdentity: wechat,
      behavior: lead.behavior || {},
      hasJoin: leadHasJoin(lead)
    };
  });

  const leadOpenids = new Set(leadEntries.map((entry) => entry.wechatIdentity?.openid).filter(Boolean));
  const leadVisitorIds = new Set(state.leads.map((lead) => lead.visitorId).filter(Boolean));
  const visitorEntries = Object.values(state.visitors || {})
    .filter((visitor) => {
      const openid = visitor.wechatIdentity?.openid;
      if (openid && leadOpenids.has(openid)) return false;
      if (visitor.id && leadVisitorIds.has(visitor.id)) return false;
      return true;
    })
    .map((visitor) => {
      const wechat = visitor.wechatIdentity || null;
      return {
        key: `visitor:${visitor.id}`,
        kind: "visitor",
        item: visitor,
        name: wechat?.nickname || "访客",
        phone: "未提交",
        grade: "-",
        subject: "-",
        school: "未填写",
        source: visitor.lastSource || "自然访问",
        score: scoreBehaviorIntent(visitor),
        status: wechat?.openid ? "微信授权访客" : "普通访客",
        wechatIdentity: wechat,
        behavior: visitor,
        hasJoin: false
      };
    });

  return [...leadEntries, ...visitorEntries].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "lead" ? -1 : 1;
    return String(b.behavior?.lastSeen || "").localeCompare(String(a.behavior?.lastSeen || ""));
  });
}

function renderCrmCustomerCell(entry) {
  const wechat = entry.wechatIdentity;
  const avatar = wechat?.avatarUrl
    ? `<img src="${wechat.avatarUrl}" alt="${wechat.nickname || "微信头像"}" />`
    : `<span>${(entry.name || "访")[0]}</span>`;
  return `
    <div class="crm-customer-cell">
      <span class="crm-avatar">${avatar}</span>
      <div>
        <b>${entry.name}</b>
        <small>${entry.kind === "lead" ? entry.phone : "微信授权访客"}</small>
        ${
          wechat?.openid
            ? `<small>微信：${wechat.nickname || "已授权"} · ${maskOpenId(wechat.openid)}</small><small>授权：${wechat.authorizedAt || "已记录"}</small>`
            : `<small>未授权微信</small>`
        }
      </div>
    </div>
  `;
}

function renderLeadDetail() {
  const visibleEntries = getFilteredLeadEntries();
  const entry = visibleEntries.find((item) => item.key === selectedCrmEntryKey) || visibleEntries[0];
  if (!entry) {
    document.querySelector("#leadDetail").innerHTML = `<p class="empty-hint">暂无客户或访客数据。</p>`;
    return;
  }
  if (entry.kind === "visitor") {
    renderVisitorDetail(entry);
    return;
  }
  const lead = entry.item;
  const referral = state.channels.find((channel) => channel.type === "家长分享" && channel.name.startsWith(lead.name));
  const behavior = lead.behavior || {};
  const leadWechat = lead.wechatIdentity || behavior.wechatIdentity || null;
  const leadJoinIndex = findExistingJoinIndex(lead);
  const leadJoin = leadJoinIndex >= 0 ? state.joins[leadJoinIndex] : null;
  const hiddenFromPublic = Boolean(lead.hiddenFromPublic || leadJoin?.hiddenFromPublic);
  document.querySelector("#leadDetail").innerHTML = `
    <div class="brand-mark">
      <span>${lead.name[0]}</span>
      <div>
        <strong>${lead.name}</strong>
        <small>${lead.status} · 意向分 ${lead.score}</small>
      </div>
    </div>
    <div class="detail-kv">
      <div><span>电话</span><strong>${lead.phone}</strong></div>
      <div><span>年级</span><strong>${lead.grade}</strong></div>
      <div><span>科目</span><strong>${lead.subject}</strong></div>
      <div><span>学生学校</span><strong>${lead.school || lead.answers?.school || lead.answers?.["所在学校"] || "未填写"}</strong></div>
      <div><span>来源</span><strong>${lead.source}</strong></div>
      <div><span>问题</span><strong>${lead.issue}</strong></div>
    </div>
    <div class="behavior-box">
      <strong>页面行为</strong>
      <div class="detail-kv">
        <div><span>进入次数</span><strong>${behavior.visits || "未记录"}</strong></div>
        <div><span>本次停留</span><strong>${behavior.currentSeconds ? formatDuration(behavior.currentSeconds) : "未记录"}</strong></div>
        <div><span>累计停留</span><strong>${behavior.totalSeconds ? formatDuration(behavior.totalSeconds) : "未记录"}</strong></div>
        <div><span>页面点击</span><strong>${behavior.clicks || 0}</strong></div>
        <div><span>最后访问</span><strong>${behavior.lastSeen || "未记录"}</strong></div>
      </div>
    </div>
    <div class="behavior-box">
      <strong>微信身份</strong>
      ${
        leadWechat?.openid
          ? `<div class="wechat-identity-card">
              ${leadWechat.avatarUrl ? `<img src="${leadWechat.avatarUrl}" alt="${leadWechat.nickname || "微信头像"}" />` : `<span>${leadWechat.nickname?.[0] || "微"}</span>`}
              <div>
                <b>${leadWechat.nickname || "已授权家长"}</b>
                <small>openid：${maskOpenId(leadWechat.openid)}</small>
                <small>授权时间：${leadWechat.authorizedAt || "已记录"}</small>
              </div>
            </div>`
          : `<p class="empty-hint">未授权微信身份；可先按访客 ID 记录，提交手机号后合并。</p>`
      }
    </div>
    <div class="behavior-box">
      <strong>填写信息</strong>
      <div class="detail-kv">
        ${renderLeadAnswers(lead)}
      </div>
    </div>
    <div class="admin-record-actions">
      <button type="button" data-toggle-lead-public>
        ${hiddenFromPublic ? "恢复前台动态" : "隐藏前台动态"}
      </button>
      <button type="button" class="danger" data-delete-selected-lead>删除线索</button>
      <small>${hiddenFromPublic ? "这条记录当前不显示在家长端近期领取和领取统计中。" : "隐藏只影响家长端展示，后台仍保留原始记录。"}</small>
    </div>
    <div class="share-contribution">
      <strong>分享贡献</strong>
      ${
        referral
          ? `
            <div class="detail-kv">
              <div><span>分享链接</span><strong>?ref=${referral.source}</strong></div>
              <div><span>带来访问</span><strong>${referral.views}</strong></div>
              <div><span>带来领取</span><strong>${referral.joins}</strong></div>
            </div>
            <div class="referred-leads compact">
              ${renderReferredLeadDetails(referral.leads)}
            </div>
          `
          : `<p>暂无分享带来的客户。</p>`
      }
    </div>
    <div class="follow-box">
      <label>
        跟进状态
        <select id="leadStatusSelect">
          ${state.followStatuses
            .map((status) => `<option value="${status}" ${status === lead.status ? "selected" : ""}>${status}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        跟进备注
        <textarea id="leadNoteInput" rows="4" placeholder="记录老师沟通情况">${lead.note || ""}</textarea>
      </label>
      <button class="primary-button" id="saveLeadFollow">保存跟进</button>
      <small id="followSavedHint"></small>
    </div>
    <div class="timeline">
      ${lead.actions.map((action) => `<p>${action}</p>`).join("")}
    </div>
  `;
}

function renderVisitorDetail(entry) {
  const visitor = entry.item || {};
  const behavior = entry.behavior || visitor;
  const wechat = entry.wechatIdentity || null;
  document.querySelector("#leadDetail").innerHTML = `
    <div class="brand-mark">
      <span>${wechat?.nickname?.[0] || "访"}</span>
      <div>
        <strong>${wechat?.nickname || "微信授权访客"}</strong>
        <small>${entry.status} · 尚未提交预约</small>
      </div>
    </div>
    <div class="behavior-box">
      <strong>微信身份</strong>
      ${
        wechat?.openid
          ? `<div class="wechat-identity-card">
              ${wechat.avatarUrl ? `<img src="${wechat.avatarUrl}" alt="${wechat.nickname || "微信头像"}" />` : `<span>${wechat.nickname?.[0] || "微"}</span>`}
              <div>
                <b>${wechat.nickname || "已授权家长"}</b>
                <small>openid：${maskOpenId(wechat.openid)}</small>
                <small>授权时间：${wechat.authorizedAt || "已记录"}</small>
              </div>
            </div>`
          : `<p class="empty-hint">未授权微信身份。</p>`
      }
    </div>
    <div class="behavior-box">
      <strong>页面行为</strong>
      <div class="detail-kv">
        <div><span>访客 ID</span><strong>${visitor.id || "未记录"}</strong></div>
        <div><span>进入次数</span><strong>${behavior.visits || "未记录"}</strong></div>
        <div><span>本次停留</span><strong>${behavior.currentSeconds ? formatDuration(behavior.currentSeconds) : "未记录"}</strong></div>
        <div><span>累计停留</span><strong>${behavior.totalSeconds ? formatDuration(behavior.totalSeconds) : "未记录"}</strong></div>
        <div><span>页面点击</span><strong>${behavior.clicks || 0}</strong></div>
        <div><span>最后访问</span><strong>${behavior.lastSeen || "未记录"}</strong></div>
        <div><span>来源</span><strong>${behavior.lastSource || "自然访问"}</strong></div>
      </div>
    </div>
    <div class="behavior-box">
      <strong>数据类型</strong>
      <p class="empty-hint">这是微信授权访客，只记录 openid、微信昵称、头像和访问行为。家长提交预约后，会升级为正式线索。</p>
    </div>
  `;
}

function renderLeadAnswers(lead) {
  if (!lead.answers) return `<div><span>暂无自定义字段</span><strong>未记录</strong></div>`;
  const configured = state.fields
    .map((field) => `<div><span>${field.name}</span><strong>${lead.answers[field.key] || lead.answers[field.name] || "未填写"}</strong></div>`)
    .join("");
  const deliveryFields = [
    ["领取方式", lead.answers.deliveryMethod],
    ["学生姓名", lead.answers.name || lead.answers["学生姓名"]],
    ["所在学校", lead.answers.school || lead.answers["所在学校"]],
    ["联系电话", lead.answers.phone || lead.answers["联系电话"]],
    ["收件地址", lead.answers.address || lead.answers["收件地址"]]
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
  return deliveryFields || configured;
}

function getSelectedLeadEntry() {
  const entries = getCrmEntries();
  return entries.find((item) => item.key === selectedCrmEntryKey && item.kind === "lead") || null;
}

function toggleSelectedLeadPublicVisibility() {
  const entry = getSelectedLeadEntry();
  if (!entry) return;
  const lead = entry.item;
  const joinIndex = findExistingJoinIndex(lead);
  const join = joinIndex >= 0 ? state.joins[joinIndex] : null;
  const nextHidden = !Boolean(lead.hiddenFromPublic || join?.hiddenFromPublic);
  lead.hiddenFromPublic = nextHidden;
  if (join) join.hiddenFromPublic = nextHidden;
  const action = nextHidden ? "后台隐藏前台领取动态" : "后台恢复前台领取动态";
  lead.actions = mergeActions(lead.actions, [action]);
  saveState();
  renderAll();
  syncFullStateToServer();
  showToast(nextHidden ? "已隐藏前台动态" : "已恢复前台动态");
}

function deleteSelectedLead() {
  const entry = getSelectedLeadEntry();
  if (!entry) return;
  const lead = entry.item;
  const ok = window.confirm(`确定删除 ${lead.name} 的领取记录吗？会同时从近期领取里移除。`);
  if (!ok) return;

  const joinIndex = findExistingJoinIndex(lead);
  if (joinIndex >= 0) state.joins.splice(joinIndex, 1);

  state.leads.splice(entry.index, 1);
  state.channels = state.channels
    .map((channel) => {
      const nextLeads = (channel.leads || []).filter((name) => name !== lead.name);
      const removedCount = (channel.leads || []).length - nextLeads.length;
      return {
        ...channel,
        leads: nextLeads,
        joins: removedCount ? Math.max(0, Number(channel.joins || 0) - removedCount) : channel.joins
      };
    })
    .filter((channel) => !(channel.type === "家长分享" && channel.source === lead.shareRef));

  selectedCrmEntryKey = "";
  state.selectedLead = Math.max(0, Math.min(state.selectedLead, state.leads.length - 1));
  saveState();
  renderAll();
  syncFullStateToServer();
  showToast("线索和近期领取已删除");
}

function renderChannels() {
  const totals = state.channels.reduce(
    (sum, channel) => {
      sum.views += channel.views;
      sum.joins += channel.joins;
      sum.shares += channel.shares;
      return sum;
    },
    { views: 0, joins: 0, shares: 0 }
  );
  const totalRate = totals.views ? `${((totals.joins / totals.views) * 100).toFixed(1)}%` : "0%";
  document.querySelector("#channelList").innerHTML = state.channels
    .map((channel) => {
      const rate = channel.views ? `${((channel.joins / channel.views) * 100).toFixed(1)}%` : "0%";
      return `
        <article class="channel-row">
          <div>
            <div class="channel-title">
              <strong>${channel.name}</strong>
              <span>${channel.type}</span>
            </div>
            <code>${getPublicActivityUrl()}?source=${encodeURIComponent(channel.source)}</code>
            <div class="source-leads">
              ${channel.leads.map((lead) => `<span>${lead}</span>`).join("")}
            </div>
          </div>
          <div class="mini-metrics">
            <span>${channel.views} 访问</span>
            <span>${channel.joins} 报名</span>
            <span>${channel.shares} 分享</span>
            <span>${rate}</span>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelector("#channelSummary").innerHTML = `
    <article><span>总访问</span><strong>${totals.views}</strong></article>
    <article><span>资料领取</span><strong>${totals.joins}</strong></article>
    <article><span>分享次数</span><strong>${totals.shares}</strong></article>
    <article><span>转化率</span><strong>${totalRate}</strong></article>
  `;
}

function getMaterialIcon(type) {
  return {
    文字: "文",
    图片: "图",
    视频: "视",
    语音: "音",
    PDF: "PDF"
  }[type] || "材";
}

function getMaterialAccept(type) {
  return {
    文字: ".txt,.md,text/plain",
    图片: "image/*",
    视频: "video/*",
    语音: "audio/*,.mp3,.m4a,.wav,.aac,.ogg",
    PDF: ".pdf,application/pdf"
  }[type] || "*/*";
}

function getMaterialUploadHint(type) {
  return {
    文字: "可上传 txt/md，也可以直接在“文字正文”里填写。",
    图片: "从相册选择图片，或上传图片文件。",
    视频: "从相册选择视频，或上传视频文件。",
    语音: "选择手机文件里的 mp3/m4a/wav 等音频；微信聊天语音通常需先另存为文件。",
    PDF: "选择手机文件里的 PDF；微信聊天里的 PDF 通常需先保存到文件。"
  }[type] || "选择对应素材文件。";
}

function getAlbumAccept(type) {
  if (type === "视频") return "video/*";
  return "image/*,video/*";
}

function getMaterialSource(item) {
  return item.fileData || item.url || "";
}

function getPreviewMaterials() {
  const priority = { 图片: 1, 视频: 2, PDF: 3, 文字: 4, 语音: 5 };
  return state.materials
    .filter((item) => item.visibility !== "领取后展示")
    .sort((a, b) => (priority[a.type] || 9) - (priority[b.type] || 9))
    .slice(0, 5);
}

function renderMaterialMedia(item, compact = false) {
  const source = getMaterialSource(item);
  if (item.type === "文字") {
    const text = item.body || item.description || "后台可直接填写文字内容。";
    return `<p class="material-body">${compact ? text.slice(0, 46) : text}</p>`;
  }
  if (!source) return item.teaserText ? `<em>${item.teaserText}</em>` : "";
  if (item.type === "图片") return `<img class="material-thumb" src="${source}" alt="${item.title}" />`;
  if (item.type === "视频") return `<video class="material-player" src="${source}" controls playsinline></video>`;
  if (item.type === "语音") return `<audio class="material-audio" src="${source}" controls></audio>`;
  if (item.type === "PDF") return `<a href="${source}" target="_blank" rel="noreferrer">打开 PDF${item.fileName ? `：${item.fileName}` : ""}</a>`;
  return `<a href="${source}" target="_blank" rel="noreferrer">打开素材</a>`;
}

function isDefaultBookCover(item) {
  return item.type === "图片" && (item.url === DEFAULT_COVER_IMAGE || item.title.includes("封面") || item.title.includes("导数好题"));
}

function renderBookSampleCard() {
  return `
    <div class="book-sample-card" aria-label="高三数学导数精讲手本封面">
      <div class="book-spine">
        <span class="spine-edition">第<b>7</b>届</span>
        <i class="book-spine-divider"></i>
        <strong>高三靶向刷题集训营</strong>
        <em class="spine-subtitle">多分集训</em>
      </div>
      <div class="book-face">
        <div class="book-gutter"></div>
        <div class="book-page-edge"></div>
        <div class="book-topline">
          <div class="book-brand">
            <span>洛优高考</span>
            <small>LUO YOU GAOKAO</small>
          </div>
          <em>2027届专版 · 第一册</em>
        </div>
        <div class="book-copy">
          <span class="book-kicker">高三数学资料</span>
          <h3>
            <span>高三导数</span>
            <em>精讲手本</em>
          </h3>
        </div>
        <div class="book-badge">
          <strong>50</strong>
          <span>道</span>
          <em>精选好题</em>
        </div>
        <div class="book-source">源自往届集训营真实题库</div>
        <div class="book-swoosh"></div>
        <div class="math-notes">
          <span>f'(x)=0 → 极值点</span>
          <span>f'(x)&gt;0 → 单调递增</span>
        </div>
        <div class="sample-tags">
          <span>精选好题</span>
          <span>方法拆解</span>
          <span>往届答题卡</span>
        </div>
      </div>
    </div>
  `;
}

function renderMaterialsPreview() {
  const container = document.querySelector("#contentPreviewList");
  if (!container) return;
  const visibleItems = getPreviewMaterials();
  container.innerHTML = visibleItems
    .map((item, index) => {
      const media = renderMaterialMedia(item, true);
      const isMediaCard = ["图片", "视频"].includes(item.type) && getMaterialSource(item);
      return `
        <article class="content-preview-card ${index === 0 ? "is-featured" : ""} ${isMediaCard ? "is-media-card" : ""}">
          ${isMediaCard ? media : ""}
          <div class="content-preview-copy">
            <strong>${item.title}</strong>
            <small>${item.description}</small>
            ${isMediaCard ? "" : media}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderUnlockedMaterials() {
  const items = state.materials.filter((item) => item.visibility !== "隐藏");
  if (!items.length) return "";
  return `
    <div class="share-guide">
      <strong>资料内容入口</strong>
      <div class="unlocked-materials">
        ${items
          .map(
            (item) => `
              <article>
                <span class="material-icon">${getMaterialIcon(item.type)}</span>
                <div>
                  <strong>${item.title}</strong>
                  <small>${item.description}</small>
                  ${renderMaterialMedia(item)}
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function getTeacherQrImage() {
  return state.activity.teacherQrImage || TEACHER_QR_IMAGE;
}

function renderSuccessPanel({ name, actualJoinCount, shareRef, shareText, deliveryMethod }) {
  return `
    <div class="success-page">
      <section class="success-hero">
        <span class="success-check">✓</span>
        <div>
          <h3>${state.activity.successTitle || "领取预约已提交"}</h3>
          <p>${state.activity.successSubtitle || `资料已为${maskName(name)}同学预留`}。${state.activity.successContactText || `老师会尽快联系您，确认${deliveryMethod || "包邮或自提"}安排。`}</p>
        </div>
      </section>

      <section class="success-section">
        <div class="section-title">
          <h3>下一步安排</h3>
          <span>已预留</span>
        </div>
        <div class="reserve-info">
          <div>
            <strong>自提地点</strong>
            <span>滨湖方圆荟</span>
          </div>
          <p>具体地址和领取时间将通过电话或微信发送。</p>
        </div>
        <div class="wechat-copy-card">
          <div>
            <span>加入资料群，看配套讲解</span>
            <strong id="teacherWechat">${state.activity.teacherWechat}</strong>
            <small>添加老师后发送口令：${state.activity.passphrase}</small>
          </div>
          <button type="button" data-copy-wechat>加入资料群，看讲解视频</button>
        </div>
      </section>

      <section class="success-section">
        <div class="section-title">
          <h3>顺手分享</h3>
          <span>可选</span>
        </div>
        <p class="share-note">${state.activity.shareLead}</p>
        <textarea id="shareText" readonly rows="4">${shareText}</textarea>
        <button type="button" class="primary-button full-button" data-share-success="${shareRef}">转发给需要的家长</button>
      </section>
    </div>
  `;
}

function renderMaterials() {
  document.querySelector("#materialList").innerHTML = state.materials
    .map(
      (item, index) => `
        <article class="material-row">
          <div class="material-edit-grid">
            <label>
              类型
              <select data-edit-material="${index}" data-material-prop="type">
                ${["文字", "图片", "视频", "语音", "PDF"]
                  .map((type) => `<option ${item.type === type ? "selected" : ""}>${type}</option>`)
                  .join("")}
              </select>
            </label>
            <label>
              标题
              <input data-edit-material="${index}" data-material-prop="title" value="${item.title}" />
            </label>
            <label>
              展示位置
              <select data-edit-material="${index}" data-material-prop="visibility">
                <option ${item.visibility === "前台预览" ? "selected" : ""}>前台预览</option>
                <option ${item.visibility === "领取后展示" ? "selected" : ""}>领取后展示</option>
                <option ${item.visibility === "隐藏" ? "selected" : ""}>隐藏</option>
              </select>
            </label>
            <label class="wide">
              简介
              <textarea data-edit-material="${index}" data-material-prop="description" rows="2">${item.description}</textarea>
            </label>
            <label class="wide">
              文字正文
              <textarea data-edit-material="${index}" data-material-prop="body" rows="3" placeholder="文字类型可以直接写正文；其他类型可写补充说明。">${item.body || ""}</textarea>
            </label>
            <label class="wide">
              素材链接
              <input data-edit-material="${index}" data-material-prop="url" value="${item.url}" placeholder="也可以粘贴图片 / 视频 / 语音 / PDF 的 URL" />
              <small>如果微信 H5 无法直接选 PDF 或语音，可以先把文件上传到网盘/OSS，再粘贴链接。</small>
            </label>
            <label class="wide">
              预览提示语
              <input data-edit-material="${index}" data-material-prop="teaserText" value="${item.teaserText || ""}" placeholder="可选。为空则前台不显示，例如：完整内容领取后开放" />
              <small>没有上传文件时才会显示；不想显示任何提示就留空。</small>
            </label>
            <div class="wide upload-choice-grid">
              <label>
                从相册选择图片/视频
                <input type="file" data-upload-material="${index}" data-upload-source="album" accept="${getAlbumAccept(item.type)}" />
              </label>
              <label>
                从文件选择${item.type}
                <input type="file" data-upload-material="${index}" data-upload-source="file" accept="${getMaterialAccept(item.type)}" />
              </label>
            </div>
            <div class="wide upload-status">
              <span>${item.fileName ? `已上传：${item.fileName}` : `相册适合图片/视频；文件入口适合 PDF/语音。${getMaterialUploadHint(item.type)}`}</span>
              ${item.fileName ? `<button type="button" data-clear-material-file="${index}">清除文件</button>` : ""}
            </div>
            <div class="wide material-admin-preview">
              ${renderMaterialMedia(item)}
            </div>
          </div>
          <div class="material-actions">
            <button class="primary-button" data-finish-material="${index}">完成</button>
            <button class="secondary-button" data-remove-material="${index}">删除</button>
          </div>
        </article>
      `
    )
    .join("");
}

function updateMaterialFromControl(input) {
  const material = state.materials[Number(input.dataset.editMaterial)];
  if (!material) return;
  material[input.dataset.materialProp] = input.value;
  saveState();
  if (input.dataset.materialProp === "type") renderMaterials();
  renderMaterialsPreview();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function prepareImageUpload(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const targetDataUrlLength = 420 * 1024;
  if (originalDataUrl.length <= targetDataUrlLength) {
    return {
      dataUrl: originalDataUrl,
      fileName: file.name,
      mimeType: file.type || "image/jpeg"
    };
  }

  const image = await loadImageFromDataUrl(originalDataUrl);
  const maxSide = 1000;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > targetDataUrlLength && quality > 0.42) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return {
    dataUrl,
    fileName: file.name.replace(/\.[^.]+$/, "") + "-h5.jpg",
    mimeType: "image/jpeg"
  };
}

function uploadMaterialFile(input) {
  const material = state.materials[Number(input.dataset.uploadMaterial)];
  const file = input.files?.[0];
  if (!material || !file) return;
  const isImage = file.type.startsWith("image/");
  const maxSize = isImage ? 12 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast(isImage ? "图片请控制在 12MB 以内" : "原型阶段请先上传 5MB 以内文件");
    input.value = "";
    return;
  }
  const finishUpload = async () => {
    const prepared = isImage
      ? await prepareImageUpload(file)
      : {
          dataUrl: await readFileAsDataUrl(file),
          fileName: file.name,
          mimeType: file.type
        };
    material.fileName = file.name;
    material.mimeType = prepared.mimeType;
    material.fileData = prepared.dataUrl;
    if (isImage) material.fileName = prepared.fileName;
    if (file.type.startsWith("image/")) material.type = "图片";
    if (file.type.startsWith("video/")) material.type = "视频";
    if (file.type.startsWith("audio/")) material.type = "语音";
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) material.type = "PDF";
    saveState();
    renderMaterials();
    renderMaterialsPreview();
    const published = await publishState();
    if (published) showToast(isImage ? "图片已压缩并发布" : "文件已加入资料内容并发布");
  };
  finishUpload().catch(() => {
    showToast("文件读取失败，请换一张图片重试");
    input.value = "";
  });
}

function uploadActivityImage(input) {
  const key = input.dataset.uploadActivityImage;
  const file = input.files?.[0];
  if (!key || !file) return;
  if (!file.type.startsWith("image/")) {
    showToast("请选择图片格式的二维码");
    input.value = "";
    return;
  }
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast("二维码图片请控制在 2MB 以内");
    input.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.activity[key] = String(reader.result || "");
    state.activity[`${key.replace(/Image$/, "")}FileName`] = file.name;
    saveState();
    renderActivity();
    publishState().then((published) => {
      if (published) showToast("老师二维码已上传并发布");
    });
  };
  reader.readAsDataURL(file);
}

async function uploadShareCoverImage(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("请选择图片格式的分享封面");
    input.value = "";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    showToast("分享封面原图请控制在 8MB 以内");
    input.value = "";
    return;
  }
  try {
    showToast("分享封面压缩上传中");
    const prepared = await prepareImageUpload(file);
    const response = await fetch(apiWithActivity("/api/share-image"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        activitySlug: activeActivitySlug,
        dataUrl: prepared.dataUrl,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType
      })
    });
    if (response.status === 401) {
      adminAuthenticated = false;
      renderAdminAuthGate();
      showToast(publishErrorMessage(response.status));
      return;
    }
    if (!response.ok) {
      showToast(publishErrorMessage(response.status, await readPublishError(response)));
      return;
    }
    const result = await response.json();
    if (!result?.url) {
      showToast("封面上传失败，请重试");
      return;
    }
    state.activity.shareImage = result.url;
    state.activity.shareImageFileName = file.name;
    saveState();
    renderActivity();
    const published = await publishState();
    if (published) showToast("分享封面已上传并发布");
  } catch (error) {
    console.error("share cover upload failed", error);
    showToast("分享封面上传失败，请换一张图片重试");
  } finally {
    input.value = "";
  }
}

function getReferralChannels() {
  return state.channels.filter((channel) => channel.type === "家长分享" || channel.source.startsWith("user_"));
}

function findLeadByName(name) {
  return state.leads.find((lead) => lead.name === name);
}

function renderReferredLeadDetails(names) {
  if (!names.length) return `<p class="empty-note">暂无领取客户</p>`;
  return names
    .map((name) => {
      const lead = findLeadByName(name);
      if (!lead) {
        return `
          <article class="referred-lead-card">
            <strong>${name}</strong>
            <span>暂未补充联系方式</span>
          </article>
        `;
      }
      return `
        <article class="referred-lead-card">
          <div>
            <strong>${lead.name}</strong>
            <span>${lead.phone}</span>
          </div>
          <div>
            <small>${lead.status}</small>
            <small>${lead.issue}</small>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderReferrals() {
  const referrals = getReferralChannels();
  const totals = referrals.reduce(
    (sum, channel) => {
      sum.views += channel.views;
      sum.joins += channel.joins;
      sum.shares += channel.shares;
      sum.leads += channel.leads.length;
      return sum;
    },
    { views: 0, joins: 0, shares: 0, leads: 0 }
  );

  document.querySelector("#referralSummary").innerHTML = `
    <article><span>分享人数</span><strong>${referrals.length}</strong></article>
    <article><span>带来访问</span><strong>${totals.views}</strong></article>
    <article><span>带来领取</span><strong>${totals.joins}</strong></article>
    <article><span>具体客户</span><strong>${totals.leads}</strong></article>
  `;

  document.querySelector("#referralList").innerHTML = referrals
    .map((channel) => {
      const sharer = channel.name.replace(/分享$/, "");
      return `
        <article class="referral-row">
          <div>
            <div class="channel-title">
              <strong>${sharer}</strong>
              <span>${channel.source}</span>
            </div>
            <code>${getPublicActivityUrl()}?ref=${encodeURIComponent(channel.source)}</code>
            <div class="referred-leads">
              ${renderReferredLeadDetails(channel.leads)}
            </div>
          </div>
          <div class="mini-metrics">
            <span>${channel.shares} 分享</span>
            <span>${channel.views} 访问</span>
            <span>${channel.joins} 领取</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFields() {
  document.querySelector("#formBuilder").innerHTML = state.fields
    .map(
      (field, index) => `
        <article class="field-row">
          <div>
            <div class="field-edit-grid">
              <label>
                字段名称
                <input data-edit-field="${index}" data-field-prop="name" value="${field.name}" />
              </label>
              <label>
                字段类型
                <select data-edit-field="${index}" data-field-prop="type">
                  <option ${field.type === "填空" ? "selected" : ""}>填空</option>
                  <option ${field.type === "单选" ? "selected" : ""}>单选</option>
                  <option ${field.type === "多选" ? "selected" : ""}>多选</option>
                </select>
              </label>
              <label>
                是否必填
                <select data-edit-field="${index}" data-field-prop="required">
                  <option value="true" ${field.required ? "selected" : ""}>必填</option>
                  <option value="false" ${!field.required ? "selected" : ""}>选填</option>
                </select>
              </label>
              <label class="wide">
                选项，用逗号分隔
                <input data-edit-field="${index}" data-field-prop="options" value="${field.options.join("，")}" placeholder="如：90 分以下，90-110 分" />
              </label>
            </div>
          </div>
          <button class="secondary-button" data-remove-field="${index}">删除</button>
        </article>
      `
    )
    .join("");
}

function updateFieldFromControl(input) {
  const field = state.fields[Number(input.dataset.editField)];
  if (!field) return;
  const prop = input.dataset.fieldProp;
  if (prop === "required") {
    field.required = input.value === "true";
  } else if (prop === "options") {
    field.options = input.value
      .split(/[，,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else {
    field[prop] = input.value;
  }
  if (prop === "name") field.key = inferFieldKey(field, Number(input.dataset.editField));
  saveState();
}

function renderMetrics() {
  const actualJoins = getActualJoinCount();
  const remaining = getRemainingQuota();
  document.querySelector("#viewCount").textContent = state.events.page_view;
  document.querySelector("#joinCount").textContent = actualJoins;
  document.querySelector("#remainingQuota").textContent = remaining;
  const heroRemaining = document.querySelector("#heroRemainingQuota");
  if (heroRemaining) heroRemaining.textContent = `剩余${remaining}份`;
  const noticeLeft = document.querySelector('[data-activity-field="noticeLeft"]');
  if (noticeLeft) noticeLeft.textContent = `${actualJoins} 位高三学生/家长已领取`;
  document.querySelector("#metricViews").textContent = state.events.page_view;
  document.querySelector("#metricJoins").textContent = actualJoins;
  document.querySelector("#metricDiagnosis").textContent = state.events.diagnosis_click;
  document.querySelector("#metricTrials").textContent = state.events.trial_click;
  renderCountdown();
}

function track(key) {
  state.events[key] = (state.events[key] || 0) + 1;
  const behavior = syncVisitorBehavior();
  behavior.clicks += 1;
  saveState();
  renderEvents();
  renderMetrics();
  syncEventToServer(key);
}

function showToast(message) {
  const toast = document.querySelector("#toast") || document.createElement("div");
  toast.id = "toast";
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportLeadData() {
  const rows = [
    ["姓名", "手机号", "微信昵称", "微信openid", "微信授权时间", "年级", "科目", "学生学校", "领取方式", "自提地点", "收件地址", "来源", "意向分", "跟进状态", "学习问题", "进入次数", "累计停留秒", "点击次数", "最后访问", "备注"],
    ...state.leads.map((lead) => {
      const behavior = lead.behavior || {};
      const wechat = getRecordWechatIdentity(lead) || {};
      const answers = lead.answers || {};
      const deliveryMethod = answers.deliveryMethod || "";
      const pickupLocation = deliveryMethod === "到校自提" ? "滨湖方圆荟" : "";
      const address = answers.address || answers["收件地址"] || "";
      return [
        lead.name,
        lead.phone,
        wechat.nickname || "",
        wechat.openid || "",
        wechat.authorizedAt || "",
        lead.grade,
        lead.subject,
        lead.school || lead.answers?.school || lead.answers?.["所在学校"] || "",
        deliveryMethod,
        pickupLocation,
        address,
        lead.source,
        lead.score,
        lead.status,
        lead.issue,
        behavior.visits || "",
        behavior.totalSeconds || "",
        behavior.clicks || 0,
        behavior.lastSeen || "",
        lead.note || ""
      ];
    })
  ];
  downloadCsv("客户数据.csv", rows);
  showToast("客户数据已导出");
}

function exportReferralData() {
  const rows = [["分享人", "分享标识", "带来访问", "带来领取", "分享次数", "被带来客户", "手机号", "跟进状态", "学习问题"]];
  getReferralChannels().forEach((channel) => {
    const sharer = channel.name.replace(/分享$/, "");
    if (!channel.leads.length) {
      rows.push([sharer, channel.source, channel.views, channel.joins, channel.shares, "", "", "", ""]);
      return;
    }
    channel.leads.forEach((name) => {
      const lead = findLeadByName(name) || {};
      rows.push([sharer, channel.source, channel.views, channel.joins, channel.shares, name, lead.phone || "", lead.status || "", lead.issue || ""]);
    });
  });
  downloadCsv("分享关系.csv", rows);
  showToast("分享关系已导出");
}

function renderVisibilityControls() {
  document.querySelectorAll("[data-visibility-setting]").forEach((input) => {
    const key = input.dataset.visibilitySetting;
    input.checked = Boolean(state.visibility[key]);
  });
}

function applyVisibilitySettings() {
  const root = document.documentElement;
  root.classList.toggle("hide-stats", !state.visibility.showStats);
  root.classList.toggle("hide-recent-joins", !state.visibility.showRecentJoins);
  root.classList.toggle("hide-avatars", !state.visibility.showAvatars);
}

function showWeChatShareGuide(copied = false) {
  let guide = document.querySelector("#wechatShareGuide");
  if (!guide) {
    guide = document.createElement("div");
    guide.id = "wechatShareGuide";
    guide.className = "wechat-share-guide";
    guide.innerHTML = `
      <div class="wechat-share-arrow">···</div>
      <div class="wechat-share-card">
        <strong>点右上角分享</strong>
        <p>选择“转发给朋友”或“分享到朋友圈”</p>
        <small></small>
      </div>
    `;
    guide.addEventListener("click", () => guide.classList.remove("is-visible"));
    document.body.appendChild(guide);
  }
  guide.querySelector("small").textContent = copied ? "分享链接已复制" : "微信会使用当前页面卡片";
  guide.classList.add("is-visible");
}

async function shareActivity(ref = "page", customText = "") {
  const payload = getSharePayload(ref);
  const shareText = customText || `${payload.text}\n${payload.url}`;
  track("share_click");
  updateShareMeta();

  if (isWeChatBrowser()) {
    let copied = false;
    try {
      await navigator.clipboard.writeText(shareText);
      copied = true;
    } catch {
      copied = false;
    }
    showWeChatShareGuide(copied);
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share(payload);
      showToast("已打开系统分享");
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareText);
    showToast("分享链接已复制，直接发给家人或同学");
  } catch {
    showToast("请长按复制分享文案");
  }
}

function sharePrompt(ref) {
  const payload = getSharePayload(ref);
  return `我刚领了一份${state.activity.title}。\n\n${state.activity.shareLead}\n\n领取入口：\n${payload.url}`;
}

function renderLeadFormFields() {
  return state.fields
    .map((field, index) => {
      const fieldName = `field_${index}`;
      const required = field.required ? "required" : "";
      if (field.type === "填空" || !field.options.length) {
        return `
          <label>
            ${field.name}
            <input name="${fieldName}" data-field-key="${field.key}" placeholder="${field.required ? "请填写" : "可选填"}" ${required} />
          </label>
        `;
      }

      return `
        <label>
          ${field.name}
          <div class="choice-row" data-choice-group="${fieldName}" data-field-key="${field.key}" data-required="${field.required}" data-multiple="${field.type === "多选"}">
            ${field.options
              .map((option, optionIndex) => `<button type="button" class="${optionIndex === 0 ? "is-picked" : ""}">${option}</button>`)
              .join("")}
          </div>
        </label>
      `;
    })
    .join("");
}

function renderDeliveryFormFields() {
  return `
    <label>
      学生姓名
      <input name="studentName" placeholder="请填写学生姓名" required />
    </label>
    <label>
      所在学校
      <input name="school" placeholder="请填写所在学校" required />
    </label>
    <label>
      联系电话
      <input name="phone" placeholder="请填写联系电话" required />
    </label>
    <label data-address-field>
      收件地址
      <textarea name="address" rows="3" placeholder="请填写收件地址" required></textarea>
    </label>
  `;
}

function deliveryMethodCopy(method) {
  if (method === "包邮到家") {
    return {
      title: "包邮到家预约",
      subtitle: "请填写收件信息，老师确认后寄出。",
      icon: "box",
      helper: "资料寄到家，适合不方便到校。",
      submit: "提交领取预约"
    };
  }
  return {
    title: "到校自提预约",
    subtitle: "请填写领取信息，老师确认领取时间。",
    icon: "pin",
    helper: "滨湖方圆荟领取，老师确认时间。",
    submit: "提交领取预约"
  };
}

function renderDeliveryMethodPicker() {
  return `
    <section class="inline-method-picker" aria-label="领取方式">
      <div class="inline-sheet-head">
        <strong>领取方式</strong>
        <span>请选择孩子资料领取方式</span>
      </div>
      <div class="method-card-list">
        <button type="button" class="method-card" data-select-delivery="到校自提">
          <span class="method-icon method-icon-pin" aria-hidden="true"></span>
          <span>
            <b>到校自提</b>
            <small>滨湖方圆荟领取，老师确认时间</small>
          </span>
          <em aria-hidden="true">›</em>
        </button>
        <button type="button" class="method-card" data-select-delivery="包邮到家">
          <span class="method-icon method-icon-box" aria-hidden="true"></span>
          <span>
            <b>包邮到家</b>
            <small>资料寄到家，适合不方便到校</small>
          </span>
          <em aria-hidden="true">›</em>
        </button>
      </div>
      <p class="inline-safe-note">选择后填写领取信息，资料会先为孩子预留。</p>
    </section>
  `;
}

function renderSchoolInput() {
  return `
    <label class="smart-field">
      所在学校
      <span class="input-shell">
        <span class="field-icon field-icon-school" aria-hidden="true"></span>
        <input name="school" data-school-input placeholder="输入学校名称" autocomplete="off" required />
      </span>
      <div class="school-suggestions" data-school-suggestions hidden></div>
    </label>
  `;
}

function renderDeliveryInfoForm(method = "到校自提") {
  const copy = deliveryMethodCopy(method);
  const needsAddress = method === "包邮到家";
  const priorityBlock = needsAddress
    ? `<label class="smart-field priority-delivery-field">
        收件地址
        <span class="input-shell textarea-shell">
          <span class="field-icon field-icon-location" aria-hidden="true"></span>
          <textarea name="address" rows="3" maxlength="200" placeholder="请输入详细收件地址" required></textarea>
          <em class="char-count" data-address-count>0/200</em>
        </span>
      </label>`
    : `<div class="pickup-location-card priority-delivery-field">
        <span class="method-icon method-icon-pin" aria-hidden="true"></span>
        <div>
          <b>自提地点</b>
          <strong>滨湖方圆荟</strong>
          <small>具体时间老师确认后通知。</small>
        </div>
      </div>`;
  return `
    <form class="form-stack inline-reservation-form" id="inlineLeadForm">
      <input type="hidden" name="deliveryMethod" value="${method}" />
      <div class="inline-form-head">
        <button type="button" class="inline-back-button" data-back-delivery aria-label="返回领取方式">‹</button>
        <div>
          <strong>${copy.title}</strong>
          <span>${copy.subtitle}</span>
        </div>
        <button type="button" class="inline-close-button" data-close-inline-reservation aria-label="收起">×</button>
      </div>
      ${priorityBlock}
      <label class="smart-field">
        学生姓名
        <span class="input-shell">
          <span class="field-icon field-icon-user" aria-hidden="true"></span>
          <input name="studentName" placeholder="请输入学生姓名" autocomplete="name" required />
        </span>
      </label>
      ${renderSchoolInput()}
      <label class="smart-field">
        联系电话
        <span class="input-shell">
          <span class="field-icon field-icon-phone" aria-hidden="true"></span>
          <input name="phone" placeholder="请输入手机号" inputmode="numeric" maxlength="11" autocomplete="tel" required />
        </span>
        <small>数字键盘，便于填写</small>
      </label>
      <button type="submit" class="inline-submit-button">${copy.submit}</button>
      <p class="inline-safe-note">提交后先为孩子预留资料，老师会尽快联系确认。</p>
    </form>
  `;
}

function readConfiguredAnswers(form) {
  const answers = {};
  state.fields.forEach((field, index) => {
    const fieldName = `field_${index}`;
    const choiceGroup = form.querySelector(`[data-choice-group="${fieldName}"]`);
    if (choiceGroup) {
      const picked = [...choiceGroup.querySelectorAll(".is-picked")].map((button) => button.textContent.trim());
      answers[field.key] = picked.join("、");
      answers[field.name] = answers[field.key];
      return;
    }

    const input = form.querySelector(`[name="${fieldName}"]`);
    answers[field.key] = input?.value?.trim() || "";
    answers[field.name] = answers[field.key];
  });
  return answers;
}

function readDeliveryAnswers(form) {
  const deliveryMethod = form.querySelector('[name="deliveryMethod"]:checked')?.value || form.querySelector('[name="deliveryMethod"]')?.value || "到校自提";
  const name = form.querySelector('[name="studentName"]')?.value?.trim() || "";
  const school = form.querySelector('[name="school"]')?.value?.trim() || "";
  const phone = form.querySelector('[name="phone"]')?.value?.trim() || "";
  const address = form.querySelector('[name="address"]')?.value?.trim() || "";
  return {
    deliveryMethod,
    name,
    "学生姓名": name,
    school,
    "所在学校": school,
    phone,
    "联系电话": phone,
    address,
    "收件地址": address
  };
}

function createLeadSubmission(type, answers) {
  const fallbackId = getActualJoinCount() ? Math.max(...state.joins.map((item) => Number(item.id) || 0)) + 1 : 1;
  const name = String(answers.name || answers.studentName || answers["学生姓名"] || answers["学生姓名或昵称"] || "新同学").trim();
  const grade = "高三";
  const subject = "数学";
  const phone = String(answers.phone || answers["联系电话"] || answers["联系方式"] || "").trim();
  const deliveryMethod = String(answers.deliveryMethod || "").trim();
  const school = String(answers.school || answers["所在学校"] || "").trim();
  const address = String(answers.address || answers["收件地址"] || "").trim();
  const scoreRange = String(answers.scoreRange || answers["最近数学分数区间"] || "未填写");
  const issue =
    type === "join"
      ? `${deliveryMethod || "领取预约"}${school ? ` · ${school}` : ""}`
      : String(answers.issue || answers["当前问题"] || answers["导数最卡在哪里"] || "未填写");
  const source = resolveSourceLabel(state.currentSource);
  const shareRef = makeUniqueShareRef(fallbackId);
  const shareUrl = getSharePayload(shareRef).url;
  const behavior = getVisitorSnapshot();
  const baseScore = type === "trial" ? 88 : type === "diagnosis" ? 76 : 82;
  const intentScore = Math.min(99, baseScore + scoreBehaviorIntent(behavior));
  const eventKeys = ["join_click"];
  if (type === "trial") eventKeys.push("trial_click");
  if (type === "diagnosis") eventKeys.push("diagnosis_click");

  return {
    submissionId: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    activitySlug: activeActivitySlug,
    type,
    source: state.currentSource,
    visitorId: visitSession.id,
    wechatIdentity,
    behavior,
    shareRef,
    shareUrl,
    eventKeys,
    join: {
      id: fallbackId,
      name,
      grade,
      subject,
      school,
      source,
      time: "刚刚",
      avatar: name[0] || "新",
      avatarColor: stringToColor(name),
      avatarUrl: wechatIdentity?.avatarUrl || getSystemAvatarUrl(`${name}-${phone || fallbackId}`)
    },
    lead: {
      name,
      phone,
      grade,
      subject,
      school,
      source,
      score: intentScore,
      status: type === "trial" ? "有训练营意向" : type === "diagnosis" ? "已互动" : "新领取",
      issue,
      note: type === "join" ? "领取预约已提交，等待确认包邮或自提安排。" : "新提交，等待添加老师微信。",
      behavior,
      wechatIdentity,
      answers,
      actions: [
        type === "join" ? `领取方式：${deliveryMethod || "未选择"}` : "刚刚提交资料领取",
        school ? `所在学校：${school}` : `分数区间：${scoreRange}`,
        address ? `收件地址：${address}` : "自提地点待电话或微信确认",
        `进入 ${behavior.visits} 次，停留 ${formatDuration(behavior.currentSeconds)}`,
        `专属分享链接：${shareUrl}`,
        type === "trial" ? "预约试听" : type === "diagnosis" ? "完成诊断" : "资料已为孩子预留"
      ]
    }
  };
}

function applyLeadSubmission(submission) {
  const id = submission.submissionId;
  if (id && state.leads.some((lead) => lead.submissionId === id)) return getActualJoinCount();

  const join = structuredClone(submission.join);
  const lead = structuredClone(submission.lead);
  join.submissionId = id;
  lead.submissionId = id;
  lead.shareRef = submission.shareRef;
  join.phone = lead.phone;
  join.wechatIdentity = lead.wechatIdentity;

  const existingIndex = findExistingLeadIndex(lead);
  if (existingIndex >= 0) {
    const existingLead = state.leads[existingIndex];
    existingLead.actions = mergeActions(existingLead.actions, ["重复提交：已拦截，未重复计入领取动态"]);
    existingLead.repeatSubmits = (Number(existingLead.repeatSubmits) || 0) + 1;
    existingLead.updatedAt = formatDateTime(new Date());
    if (lead.wechatIdentity?.openid) existingLead.wechatIdentity = lead.wechatIdentity;

    state.events.repeat_submit = (state.events.repeat_submit || 0) + 1;
    state.selectedLead = existingIndex;
    saveState();
    return getActualJoinCount();
  }

  state.joins.unshift(join);
  state.leads.unshift(lead);

  const channel = ensureChannelForSource(submission.source);
  if (channel) {
    channel.joins += 1;
    if (!channel.leads.includes(lead.name)) channel.leads.unshift(lead.name);
  }
  ensureShareChannelForLead(lead.name, submission.shareRef);

  (submission.eventKeys || ["join_click"]).forEach((key) => {
    state.events[key] = (state.events[key] || 0) + 1;
  });
  state.selectedLead = 0;
  saveState();
  return getActualJoinCount();
}

function getLeadOpenId(lead = {}) {
  return lead.wechatIdentity?.openid || lead.behavior?.wechatIdentity?.openid || "";
}

function findExistingLeadIndex(lead) {
  const openid = getLeadOpenId(lead);
  const phone = String(lead.phone || "").trim();
  if (!openid && !phone) return -1;
  return state.leads.findIndex((item) => {
    if (openid && getLeadOpenId(item) === openid) return true;
    return Boolean(phone && String(item.phone || "").trim() === phone);
  });
}

function findExistingJoinIndex(lead) {
  const openid = getLeadOpenId(lead);
  const phone = String(lead.phone || "").trim();
  return state.joins.findIndex((item) => {
    if (lead.submissionId && item.submissionId === lead.submissionId) return true;
    if (openid && item.wechatIdentity?.openid === openid) return true;
    if (phone && String(item.phone || "").trim() === phone) return true;
    return item.name === lead.name;
  });
}

function mergeActions(existing = [], incoming = []) {
  return [...incoming, ...existing].filter((item, index, array) => item && array.indexOf(item) === index).slice(0, 12);
}

function bindSuccessPanelButtons() {
  document.querySelector("#drawerBody").querySelectorAll("[data-close-drawer]").forEach((button) => {
    button.addEventListener("click", closeDrawer);
  });
  document.querySelector("#drawerBody").querySelectorAll("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => openDrawer(button.dataset.openPanel));
  });
  document.querySelector("#drawerBody").querySelector("[data-copy-wechat]")?.addEventListener("click", async (event) => {
    const value = document.querySelector("#teacherWechat").textContent;
    try {
      await navigator.clipboard.writeText(value);
      event.currentTarget.textContent = "已复制";
    } catch {
      event.currentTarget.textContent = value;
    }
  });
  document.querySelector("#drawerBody").querySelector("[data-share-success]")?.addEventListener("click", async (event) => {
    const value = document.querySelector("#shareText").value;
    await shareActivity(event.currentTarget.dataset.shareSuccess, value);
    event.currentTarget.textContent = "已生成分享";
  });
}

function renderInlineReservationForm() {
  return renderDeliveryMethodPicker();
}

function renderInlineSuccessPanel({ shareRef, shareText }) {
  return `
    <section class="inline-success-card" aria-label="领取预约已提交">
      <button type="button" class="inline-close-button success-close" data-close-inline-reservation aria-label="收起">×</button>
      <div class="success-check-large" aria-hidden="true">✓</div>
      <div class="success-title-copy">
        <strong>${state.activity.successTitle || "领取预约已提交"}</strong>
        <span>${state.activity.successSubtitle || "资料已为孩子预留"}</span>
      </div>
      <div class="success-contact-card">
        <span class="success-bell-icon" aria-hidden="true"></span>
        <p>${state.activity.successContactText || "老师会尽快联系您确认领取安排。"}</p>
      </div>
      <div class="success-divider"><span>或</span></div>
      <div class="qr-section">
        <strong>${state.activity.qrTitle || "长按二维码添加老师"}</strong>
        <span>发送“${state.activity.passphrase || "导数资料"}”，${state.activity.qrSubtitle || "领取题册和讲解视频"}</span>
        <img src="${getTeacherQrImage()}" alt="老师二维码" />
      </div>
      <textarea id="shareText" class="inline-share-text" readonly rows="3">${shareText}</textarea>
    </section>
  `;
}

function syncDeliveryFields(scope = document) {
  const deliveryOptions = scope.querySelector("[data-delivery-options]");
  if (!deliveryOptions) return;
  const addressField = scope.querySelector("[data-address-field]");
  const method = scope.querySelector('[name="deliveryMethod"]:checked')?.value || "到校自提";
  scope.querySelectorAll(".delivery-option").forEach((option) => {
    option.classList.toggle("is-selected", option.querySelector("input")?.checked);
  });
  if (addressField) {
    const needsAddress = method === "包邮到家";
    addressField.hidden = !needsAddress;
    addressField.querySelector("textarea").required = needsAddress;
  }
}

function bindDeliveryOptions(scope = document) {
  const deliveryOptions = scope.querySelector("[data-delivery-options]");
  if (!deliveryOptions) return;
  deliveryOptions.querySelectorAll('[name="deliveryMethod"]').forEach((input) => {
    input.addEventListener("change", () => syncDeliveryFields(scope));
  });
  syncDeliveryFields(scope);
}

function bindInlineReservationButtons() {
  const container = document.querySelector("#inlineReservation");
  if (!container) return;
  container.querySelectorAll("[data-close-inline-reservation]").forEach((button) => {
    button.addEventListener("click", closeInlineReservation);
  });
  container.querySelector("[data-copy-wechat]")?.addEventListener("click", async (event) => {
    try {
      await navigator.clipboard.writeText(`${state.activity.teacherWechat}\n口令：${state.activity.passphrase}`);
      event.currentTarget.textContent = "已复制老师微信";
    } catch {
      event.currentTarget.textContent = state.activity.teacherWechat;
    }
  });
  container.querySelector("[data-share-success]")?.addEventListener("click", async (event) => {
    const value = container.querySelector("#shareText")?.value || "";
    await shareActivity(event.currentTarget.dataset.shareSuccess, value);
    event.currentTarget.textContent = "已生成分享";
  });
  container.querySelectorAll("[data-select-delivery]").forEach((button) => {
    button.addEventListener("click", () => showInlineDeliveryForm(button.dataset.selectDelivery));
  });
  container.querySelector("[data-back-delivery]")?.addEventListener("click", showInlineDeliveryPicker);
}

function renderSchoolSuggestions(value = "") {
  const keyword = value.trim();
  const matched = SCHOOL_SUGGESTIONS.filter((school) => !keyword || school.includes(keyword)).slice(0, 3);
  return matched
    .map(
      (school) => `
        <button type="button" data-school-option="${school}">
          <span class="field-icon field-icon-school" aria-hidden="true"></span>
          ${school}
        </button>
      `
    )
    .join("");
}

function bindSchoolAutocomplete(scope = document) {
  const input = scope.querySelector("[data-school-input]");
  const list = scope.querySelector("[data-school-suggestions]");
  if (!input || !list) return;

  const update = () => {
    list.innerHTML = renderSchoolSuggestions(input.value);
    list.hidden = !list.innerHTML;
  };

  input.addEventListener("focus", update);
  input.addEventListener("input", update);
  list.addEventListener("click", (event) => {
    const option = event.target.closest("[data-school-option]");
    if (!option) return;
    input.value = option.dataset.schoolOption;
    list.hidden = true;
  });
}

function bindAddressCounter(scope = document) {
  const textarea = scope.querySelector("textarea[name='address']");
  const counter = scope.querySelector("[data-address-count]");
  if (!textarea || !counter) return;
  const update = () => {
    counter.textContent = `${textarea.value.length}/200`;
  };
  textarea.addEventListener("input", update);
  update();
}

function bindInlineReservationForm() {
  const container = document.querySelector("#inlineReservation");
  const form = container?.querySelector("#inlineLeadForm");
  if (!container || !form) return;
  bindSchoolAutocomplete(container);
  bindAddressCounter(container);
  bindLeadFormSubmit(form, "join", (finalSubmission, actualJoinCount, answers) => {
    container.innerHTML = renderInlineSuccessPanel({
      actualJoinCount: finalSubmission.actualJoinCount || actualJoinCount,
      shareRef: finalSubmission.shareRef,
      shareText: sharePrompt(finalSubmission.shareRef),
      deliveryMethod: answers.deliveryMethod
    });
    bindInlineReservationButtons();
  });
}

function showInlineDeliveryPicker() {
  const container = document.querySelector("#inlineReservation");
  if (!container) return;
  container.dataset.mode = "picker";
  container.innerHTML = renderDeliveryMethodPicker();
  bindInlineReservationButtons();
}

function showInlineDeliveryForm(method) {
  const container = document.querySelector("#inlineReservation");
  if (!container) return;
  container.dataset.mode = "form";
  container.innerHTML = renderDeliveryInfoForm(method);
  bindInlineReservationButtons();
  bindInlineReservationForm();
}

function openInlineReservation() {
  const container = document.querySelector("#inlineReservation");
  const backdrop = document.querySelector("#inlineReservationBackdrop");
  const page = document.querySelector(".h5-page");
  if (!container) return;
  if (!container.hidden && container.dataset.mode === "picker") {
    closeInlineReservation();
    return;
  }
  container.hidden = false;
  if (backdrop) backdrop.hidden = false;
  page?.classList.add("reservation-open");
  showInlineDeliveryPicker();
}

function closeInlineReservation() {
  const container = document.querySelector("#inlineReservation");
  const backdrop = document.querySelector("#inlineReservationBackdrop");
  const page = document.querySelector(".h5-page");
  if (!container) return;
  container.hidden = true;
  if (backdrop) backdrop.hidden = true;
  page?.classList.remove("reservation-open");
  container.dataset.mode = "";
  container.innerHTML = "";
}

function openDrawer(panelKey) {
  const panel = panels[panelKey];
  if (!panel) return;
  document.querySelector("#drawerTitle").textContent = panel.title;
  document.querySelector("#drawerBody").innerHTML = drawerContent(panel.type);
  document.querySelector("#drawer").classList.add("is-open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindDrawerButtons(panel.type);
}

function closeDrawer() {
  document.querySelector("#drawer").classList.remove("is-open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "true");
}

function drawerContent(type) {
  if (type === "newChannel") {
    return `
      <form class="form-stack" id="channelForm">
        <label>
          来源名称
          <input name="name" placeholder="如：王老师朋友圈 / 高三家长群1" required />
        </label>
        <label>
          来源类型
          <select name="type">
            <option>老师渠道</option>
            <option>社群渠道</option>
            <option>短视频渠道</option>
            <option>图文渠道</option>
            <option>家长分享</option>
          </select>
        </label>
        <label>
          来源标识
          <input name="source" placeholder="可不填，系统自动生成" />
        </label>
        <div class="submit-row">
          <button type="submit">生成链接</button>
          <button type="button" data-close-drawer>取消</button>
        </div>
      </form>
    `;
  }

  if (type === "allJoins") {
    const joins = getOrderedPublicJoins();
    return `
      <p class="drawer-subtitle">已有 ${joins.length} 位家长领取，前台信息已做脱敏展示。</p>
      <div class="all-list">
        ${joins.length ? joins
          .map(
            (item) => `
              <article class="join-item">
                ${renderJoinAvatar(item)}
                <div>
                  <strong>${publicJoinTitle(item)}</strong>
                  <small>${publicJoinMeta(item) || "刚刚领取"}</small>
                </div>
                <span class="join-rank">#${item.id}</span>
              </article>
            `
          )
          .join("") : `<p class="empty-hint">暂无领取动态。</p>`}
      </div>
    `;
  }

  if (type === "detail") {
    return `
      <div class="resource-preview">
        <strong>${state.activity.contentTitle}</strong>
        ${state.activity.audience.map((item) => `<span>${item}</span>`).join("")}
      </div>
      <div class="success-box">
        <h3>领取后能拿到什么</h3>
        <p>导数专题小册子、精选题目预览、配套讲解视频，以及群内刷题安排。</p>
      </div>
      <div class="submit-row">
        <button type="button" data-open-panel="join">${state.activity.ctaText}</button>
        <button type="button" data-close-drawer>先看看</button>
      </div>
    `;
  }

  const submitLabel = type === "diagnosis" ? "生成初步建议" : type === "trial" ? "提交预约" : "提交领取预约";
  return `
    <form class="form-stack" id="leadForm">
      ${
        type === "join"
          ? renderDeliveryFormFields()
          : `
            <div class="resource-preview">
              <strong>你将领取</strong>
              <span>导数专题小册子</span>
              <span>恒成立与零点问题讲解视频</span>
              <span>群内刷题安排</span>
            </div>
            ${renderLeadFormFields()}
          `
      }
      <div class="submit-row">
        <button type="submit">${submitLabel}</button>
        <button type="button" data-close-drawer>稍后再说</button>
      </div>
    </form>
  `;
}

function bindLeadFormSubmit(form, type, onSuccess) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "提交中";
    }
    const answers = type === "join" ? readDeliveryAnswers(form) : readConfiguredAnswers(form);
    const localSubmission = createLeadSubmission(type, answers);
    const serverSubmission = await syncLeadSubmissionToServer(localSubmission);
    const finalSubmission = serverSubmission || localSubmission;
    const actualJoinCount = finalSubmission.duplicate
      ? finalSubmission.actualJoinCount || getActualJoinCount()
      : applyLeadSubmission(finalSubmission);

    renderAll();
    if (finalSubmission.duplicate) showToast("已提交过领取预约，不重复计入名额");
    onSuccess(finalSubmission, actualJoinCount, answers);
    if (!serverSubmission && isPublicPage) showToast("已本机保存，服务器同步失败时请稍后刷新重试");
  });
}

function bindDrawerButtons(type) {
  const channelForm = document.querySelector("#channelForm");
  if (channelForm) {
    channelForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(channelForm);
      const name = String(data.get("name") || "").trim();
      const type = String(data.get("type") || "老师渠道");
      const rawSource = String(data.get("source") || "").trim();
      const source = rawSource || makeSourceKey(name, state.channels.length + 1);
      state.channels.unshift({ type, name, source, views: 0, joins: 0, shares: 0, leads: [] });
      saveState();
      renderChannels();
      document.querySelector("#drawerBody").innerHTML = `
        <div class="success-box">
          <h3>渠道链接已生成</h3>
          <p>${name} 已加入传播统计。</p>
          <div class="group-guide">
            <strong>渠道链接</strong>
            <span class="link-text">${getPublicActivityUrl()}?source=${encodeURIComponent(source)}</span>
            <small>把这个链接发给对应老师、群或平台，后台会按来源统计。</small>
          </div>
        </div>
        <div class="submit-row">
          <button type="button" data-copy-channel="${getPublicActivityUrl()}?source=${encodeURIComponent(source)}">复制链接</button>
          <button type="button" data-close-drawer>完成</button>
        </div>
      `;
      bindGeneratedChannelButtons();
    });
    return;
  }

  document.querySelectorAll("[data-choice-group] button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.parentElement;
      if (group.dataset.multiple === "true") {
        button.classList.toggle("is-picked");
        return;
      }
      group.querySelectorAll("button").forEach((item) => item.classList.remove("is-picked"));
      button.classList.add("is-picked");
    });
  });

  bindDeliveryOptions(document);

  const form = document.querySelector("#leadForm");
  if (!form) return;

  bindLeadFormSubmit(form, type, (finalSubmission, actualJoinCount, answers) => {
    document.querySelector("#drawerBody").innerHTML = renderSuccessPanel({
      name: finalSubmission.lead.name,
      actualJoinCount: finalSubmission.actualJoinCount || actualJoinCount,
      shareRef: finalSubmission.shareRef,
      shareText: sharePrompt(finalSubmission.shareRef),
      deliveryMethod: answers.deliveryMethod
    });
    bindSuccessPanelButtons();
  });
}

function makeSourceKey(name, fallback) {
  const known = [
    ["朋友圈", "moments"],
    ["微信群", "wechat_group"],
    ["家长群", "parent_group"],
    ["抖音", "douyin"],
    ["小红书", "xiaohongshu"],
    ["老师", "teacher"],
    ["视频", "video"]
  ];
  const match = known.find(([keyword]) => name.includes(keyword));
  return `${match ? match[1] : "source"}_${String(fallback).padStart(2, "0")}`;
}

function bindGeneratedChannelButtons() {
  document.querySelector("#drawerBody").querySelectorAll("[data-close-drawer]").forEach((button) => {
    button.addEventListener("click", closeDrawer);
  });
  document.querySelector("#drawerBody").querySelector("[data-copy-channel]")?.addEventListener("click", async (event) => {
    const value = event.currentTarget.dataset.copyChannel;
    try {
      await navigator.clipboard.writeText(value);
      event.currentTarget.textContent = "已复制";
    } catch {
      event.currentTarget.textContent = value;
    }
  });
}

function renderAdminAuthGate() {
  if (!isAdminPreview) return;
  let gate = document.querySelector("#adminAuthGate");
  document.documentElement.classList.toggle("admin-locked", !adminAuthenticated);
  if (adminAuthenticated) {
    gate?.remove();
    return;
  }
  if (!gate) {
    gate = document.createElement("div");
    gate.id = "adminAuthGate";
    gate.className = "admin-auth-gate";
    gate.innerHTML = `
      <form class="admin-auth-card" id="adminAuthForm">
        <span class="admin-auth-badge">管理端</span>
        <h2>请输入后台密码</h2>
        <p>登录后才能查看客户 CRM、微信授权信息和导出数据。</p>
        <label>
          <span>后台密码</span>
          <input id="adminPasswordInput" type="password" autocomplete="current-password" placeholder="请输入后台密码" />
        </label>
        <button type="submit">进入后台</button>
        <small id="adminAuthHint">服务器密码文件：/www/apply-system/data/.admin-password</small>
      </form>
    `;
    document.body.appendChild(gate);
    gate.querySelector("#adminAuthForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = gate.querySelector("#adminPasswordInput");
      const button = gate.querySelector("button");
      const hint = gate.querySelector("#adminAuthHint");
      const password = input.value.trim();
      if (!password) {
        hint.textContent = "请先输入后台密码";
        input.focus();
        return;
      }
      button.disabled = true;
      button.textContent = "验证中";
      const ok = await unlockAdmin(password);
      if (!ok) {
        hint.textContent = "密码不正确，请重新输入";
        input.select();
        button.disabled = false;
        button.textContent = "进入后台";
      }
    });
  }
  setTimeout(() => gate.querySelector("#adminPasswordInput")?.focus(), 50);
}

function bindChrome() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      document.querySelector(".workspace").dataset.currentView = button.dataset.view;
    });
  });

  document.querySelectorAll("[data-local-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.localView;
      document.querySelector(".workspace").dataset.currentView = view;
      document.querySelectorAll("[data-local-view]").forEach((item) => item.classList.toggle("is-active", item.dataset.localView === view));
      document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
    });
  });

  if (isAdminPreview) {
    document.querySelector(".workspace").dataset.currentView = "admin";
    document.querySelectorAll("[data-local-view]").forEach((item) => item.classList.toggle("is-active", item.dataset.localView === "admin"));
    document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("is-active", item.dataset.view === "admin"));
  }

  document.querySelectorAll(".admin-nav").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      document.querySelector(`[data-admin-panel="${button.dataset.adminTab}"]`).classList.add("is-active");
    });
  });

  document.querySelectorAll("[data-lead-filter]").forEach((button) => {
    button.addEventListener("click", () => setLeadFilter(button.dataset.leadFilter));
  });

  document.querySelector("#exportLeadData")?.addEventListener("click", exportLeadData);
  document.querySelector("#exportReferralData")?.addEventListener("click", exportReferralData);
  document.querySelector("#saveVisibility")?.addEventListener("click", () => {
    document.querySelectorAll("[data-visibility-setting]").forEach((input) => {
      state.visibility[input.dataset.visibilitySetting] = input.checked;
    });
      saveState();
      applyVisibilitySettings();
      renderJoins();
      publishState();
      showToast("前台显示设置已保存");
    });

  document.querySelector("#publishActivity")?.addEventListener("click", () => {
    publishState();
  });

  document.body.addEventListener("click", (event) => {
    if (event.target.closest("#createActivityButton")) {
      createNewActivity();
      return;
    }
    if (event.target.closest("#resetActivityConfigButton")) {
      resetActivityConfig();
      return;
    }
    if (event.target.closest("#clearActivityDataButton")) {
      clearCurrentActivityData();
      return;
    }
    const copyActivityLink = event.target.closest("[data-copy-activity-link]");
    if (copyActivityLink) {
      const value = copyActivityLink.dataset.copyActivityLink;
      if (!navigator.clipboard?.writeText) {
        showToast(value);
        return;
      }
      navigator.clipboard
        .writeText(value)
        .then(() => {
          copyActivityLink.textContent = "已复制";
          showToast("家长端链接已复制");
          window.setTimeout(() => {
            copyActivityLink.textContent = "复制链接";
          }, 1800);
        })
        .catch(() => {
          showToast(value);
        });
      return;
    }
    const openActivityLink = event.target.closest("[data-open-activity-link]");
    if (openActivityLink) {
      window.open(openActivityLink.dataset.openActivityLink, "_blank", "noopener");
      return;
    }
    if (event.target.closest("[data-close-activity-dialog]")) {
      closeActivityCreatedDialog();
      return;
    }
    const copyCreatedLink = event.target.closest("[data-copy-created-link]");
    if (copyCreatedLink) {
      const value = copyCreatedLink.dataset.copyCreatedLink;
      if (!navigator.clipboard?.writeText) {
        showToast(value);
        return;
      }
      navigator.clipboard
        .writeText(value)
        .then(() => {
          copyCreatedLink.textContent = "已复制";
          showToast("家长端链接已复制");
        })
        .catch(() => {
          showToast(value);
        });
      return;
    }
    const openCreatedLink = event.target.closest("[data-open-created-link]");
    if (openCreatedLink) {
      window.open(openCreatedLink.dataset.openCreatedLink, "_blank", "noopener");
      return;
    }

    const trackButton = event.target.closest("[data-track]");
    if (trackButton) track(trackButton.dataset.track);

    const shareButton = event.target.closest("[data-share]");
    if (shareButton) shareActivity("page");

    const inlineReservationButton = event.target.closest("[data-inline-reservation]");
    if (inlineReservationButton) {
      openInlineReservation();
      return;
    }

    if (event.target.closest("#inlineReservationBackdrop")) {
      closeInlineReservation();
      return;
    }

    const panelButton = event.target.closest("[data-open-panel]");
    if (panelButton) openDrawer(panelButton.dataset.openPanel);

    if (event.target.closest("[data-close-drawer]")) closeDrawer();

    const leadRow = event.target.closest("[data-crm-entry-key]");
    if (leadRow) {
      selectedCrmEntryKey = leadRow.dataset.crmEntryKey;
      const entry = getCrmEntries().find((item) => item.key === selectedCrmEntryKey);
      if (entry?.kind === "lead") state.selectedLead = entry.index;
      renderLeadRows();
      renderLeadDetail();
    }

    if (event.target.closest("#saveLeadFollow")) {
      const entry = getCrmEntries().find((item) => item.key === selectedCrmEntryKey);
      if (!entry || entry.kind !== "lead") return;
      const lead = entry.item;
      const status = document.querySelector("#leadStatusSelect").value;
      const note = document.querySelector("#leadNoteInput").value.trim();
      lead.status = status;
      lead.note = note;
      if (!lead.actions.includes(`状态更新：${status}`)) lead.actions.unshift(`状态更新：${status}`);
      saveState();
      renderLeadRows();
      renderLeadDetail();
      renderHotLeads();
      renderFollowReminders();
      syncFullStateToServer();
      const hint = document.querySelector("#followSavedHint");
      if (hint) hint.textContent = "已保存";
    }

    if (event.target.closest("[data-toggle-lead-public]")) {
      toggleSelectedLeadPublicVisibility();
      return;
    }

    if (event.target.closest("[data-delete-selected-lead]")) {
      deleteSelectedLead();
      return;
    }

    const focusLead = event.target.closest("[data-focus-lead]");
    if (focusLead) {
      state.selectedLead = Number(focusLead.dataset.focusLead);
      selectedCrmEntryKey = `lead:${state.selectedLead}`;
      activeLeadFilter = "全部访客";
      document.querySelectorAll("[data-lead-filter]").forEach((item) => item.classList.toggle("is-selected", item.dataset.leadFilter === "全部访客"));
      document.querySelectorAll(".admin-nav").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((item) => item.classList.remove("is-active"));
      document.querySelector('[data-admin-tab="leads"]').classList.add("is-active");
      document.querySelector('[data-admin-panel="leads"]').classList.add("is-active");
      renderLeadRows();
      renderLeadDetail();
    }

    const removeField = event.target.closest("[data-remove-field]");
    if (removeField) {
      if (state.fields.length <= 2) {
        showToast("至少保留姓名和联系方式");
        return;
      }
      state.fields.splice(Number(removeField.dataset.removeField), 1);
      saveState();
      renderFields();
      publishState();
    }

    const removeMaterial = event.target.closest("[data-remove-material]");
    if (removeMaterial) {
      state.materials.splice(Number(removeMaterial.dataset.removeMaterial), 1);
      saveState();
      renderMaterials();
      renderMaterialsPreview();
      publishState();
    }

    const clearFile = event.target.closest("[data-clear-material-file]");
    if (clearFile) {
      const material = state.materials[Number(clearFile.dataset.clearMaterialFile)];
      if (!material) return;
      material.fileName = "";
      material.fileData = "";
      material.mimeType = "";
      saveState();
      renderMaterials();
      renderMaterialsPreview();
      publishState();
    }

    const clearActivityImage = event.target.closest("[data-clear-activity-image]");
    if (clearActivityImage) {
      const key = clearActivityImage.dataset.clearActivityImage;
      state.activity[key] = "";
      state.activity[`${key.replace(/Image$/, "")}FileName`] = "";
      saveState();
      renderActivity();
      publishState();
      showToast("老师二维码已清除");
    }

    const clearShareCover = event.target.closest("[data-clear-share-cover]");
    if (clearShareCover) {
      state.activity.shareImage = DEFAULT_SHARE_IMAGE;
      state.activity.shareImageFileName = "";
      saveState();
      renderActivity();
      publishState();
      showToast("已恢复默认分享封面");
      return;
    }

    const finishMaterial = event.target.closest("[data-finish-material]");
    if (finishMaterial) {
      saveState();
      renderMaterialsPreview();
      publishState();
    }
  });

  document.querySelectorAll("[data-edit-activity]").forEach((input) => {
    input.addEventListener("input", () => {
      state.activity[input.dataset.editActivity] = input.value;
      saveState();
      renderActivity();
      renderMetrics();
      publishState();
    });
  });

  document.body.addEventListener("input", (event) => {
    const input = event.target.closest("[data-edit-field]");
    if (input) {
      updateFieldFromControl(input);
      return;
    }
    const materialInput = event.target.closest("[data-edit-material]");
    if (materialInput) updateMaterialFromControl(materialInput);
    const uploadInput = event.target.closest("[data-upload-material]");
    if (uploadInput) uploadMaterialFile(uploadInput);
  });

  document.body.addEventListener("change", (event) => {
    const activitySelect = event.target.closest("#activitySelect");
    if (activitySelect) {
      switchActivity(activitySelect.value);
      return;
    }

    const activityImageInput = event.target.closest("[data-upload-activity-image]");
    if (activityImageInput) {
      uploadActivityImage(activityImageInput);
      return;
    }
    const shareCoverInput = event.target.closest("[data-upload-share-image]");
    if (shareCoverInput) {
      uploadShareCoverImage(shareCoverInput);
      return;
    }
    const input = event.target.closest("[data-edit-field]");
    if (input) {
      updateFieldFromControl(input);
      publishState();
      return;
    }
    const materialInput = event.target.closest("[data-edit-material]");
    if (materialInput) updateMaterialFromControl(materialInput);
  });

  document.querySelector("#addField")?.addEventListener("click", () => {
    state.fields.push({
      key: `custom_${Date.now()}`,
      name: "新问题",
      type: "填空",
      required: false,
      options: []
    });
    saveState();
    renderFields();
    publishState();
  });

  document.querySelector("#addMaterial")?.addEventListener("click", () => {
    state.materials.unshift({
      type: "图片",
      title: "新资料内容",
      description: "填写这条内容的介绍，前台会作为资料包预览展示。",
      url: "",
      visibility: "前台预览"
    });
    saveState();
    renderMaterials();
    renderMaterialsPreview();
    publishState();
  });

  document.querySelector("#resetDemoData")?.addEventListener("click", () => {
    const ok = window.confirm("确定恢复整套演示数据吗？\n\n这会覆盖当前本地演示状态。");
    if (!ok) return;
    resetState();
    renderAll();
    showToast("已恢复演示数据");
  });

  window.addEventListener("beforeunload", () => {
    syncVisitorBehavior();
    syncVisitToServer(false, true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      syncVisitorBehavior();
      syncVisitToServer(false, true);
    }
  });
  window.setInterval(() => {
    syncVisitorBehavior();
    syncVisitToServer(false);
  }, 10000);
  window.setInterval(refreshPublishedState, 4000);
  window.setInterval(renderCountdown, 1000);
}

function renderAll() {
  renderAdminAuthGate();
  if (isAdminPreview && !adminAuthenticated) return;
  state.currentSource = readCurrentSource();
  if (state.sourceVisitRecorded !== state.currentSource.key) {
    const channel = ensureChannelForSource(state.currentSource);
    if (channel) channel.views += 1;
    state.sourceVisitRecorded = state.currentSource.key;
    saveState();
  }
  recordVisitSession();
  if (isPublicPage && visitSession.serverSourceRecorded !== state.currentSource.key) {
    visitSession.serverSourceRecorded = state.currentSource.key;
    syncVisitToServer(true);
  }
  applyVisibilitySettings();
  renderActivity();
  renderActivitySwitcher();
  renderSourceNotice();
  renderJoins();
  renderEvents();
  renderHotLeads();
  renderFollowReminders();
  renderLeadRows();
  renderLeadDetail();
  renderChannels();
  renderReferrals();
  renderMaterials();
  renderMaterialsPreview();
  renderFields();
  renderVisibilityControls();
  renderMetrics();
  configureWechatShareCard();
}

checkAdminSession().then(() => hydratePublishedState()).finally(() => {
  bindChrome();
  renderAll();
  ensureWechatAuthorization();
});
