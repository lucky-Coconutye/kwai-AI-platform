const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  profiles: [],
  meta: {},
  keyword: "",
  role: "all",
  industry: "all",
  facets: {},
  sort: "default",
  selectedId: "",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function flattenText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function cleanSummary(value) {
  return String(value || "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .replace(/\|\|/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortText(value, limit = 18) {
  const text = String(value || "").trim();
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function serviceContext() {
  return {
    biz_code: "demo",
    session_id: "",
    user_id: "0",
    account_id: "0",
    merchant_id: "0",
    username: "",
    request_id: "",
    agent_name: "",
    scene_id: 0,
    scene_type: 0,
    scene_name: "",
    token: "",
    ability_name: "",
    invoker: "",
  };
}

function roleLabel(role) {
  return Number(role) === 1 ? "商家画像" : "用户画像";
}

function currentModeLabel() {
  if (state.role === "2") return "用户画像";
  if (state.role === "1") return "商家画像";
  return "全部画像";
}

const userFacetGroups = [
  {
    title: "基础属性",
    items: [
      ["gender", "性别"],
      ["age", "年龄段"],
      ["city", "常驻地域"],
      ["marriage", "婚姻状态"],
      ["parenting", "育儿状态"],
    ],
  },
  {
    title: "设备消费",
    items: [
      ["device", "使用设备"],
      ["consume", "消费水平"],
      ["price", "价格敏感"],
    ],
  },
  {
    title: "内容兴趣",
    items: [
      ["interest", "核心兴趣"],
      ["secondaryInterest", "次级兴趣"],
      ["adPreference", "广告偏好"],
    ],
  },
];

const merchantFacetGroups = [
  {
    title: "商家属性",
    items: [
      ["merchantIndustry", "一级行业"],
      ["robot", "智能客服"],
      ["service", "主营服务"],
    ],
  },
  {
    title: "经营信息",
    items: [
      ["businessScope", "业务范围"],
      ["targetUser", "目标客群"],
    ],
  },
];

const facetOptionCatalog = {
  gender: ["男", "女", "未知"],
  age: ["18岁以下", "18-23岁", "24-30岁", "31-40岁", "41-50岁", "50岁以上", "未知"],
  city: ["一线城市", "新一线城市", "二线城市", "三线及以下", "县城/乡镇", "海外", "未知"],
  marriage: ["未婚", "已婚", "离异", "未知"],
  parenting: ["未育", "已育", "孕产期", "未知"],
  device: ["iPhone", "华为", "小米/红米", "OPPO", "vivo", "荣耀", "三星", "其他安卓", "未知"],
  consume: ["极低消费", "低消费", "中低消费", "中等消费", "中高消费", "高消费", "未知"],
  price: ["高", "中", "低", "未知"],
  interest: ["美食", "校园生活", "社会百态", "明星娱乐", "旅游", "穿搭", "生活服务", "学习成长", "时政资讯", "军事", "历史", "数码", "汽车", "母婴", "游戏", "运动健身"],
  secondaryInterest: ["旅游风光", "穿搭", "生活服务", "学习成长", "娱乐八卦", "本地资讯", "探店", "科普内容", "情感", "职场"],
  adPreference: ["短剧化", "场景化", "真实体验", "福利明确", "价格促销", "品牌种草", "本地到店", "直播引导", "测评对比"],
  merchantIndustry: ["教育培训", "生活服务", "餐饮美食", "汽车服务", "医疗健康", "美容美体", "电商零售", "家居家装", "旅游出行", "金融服务", "招商加盟", "企业服务", "数码家电", "房产家居", "本地服务", "其他"],
  robot: ["已开通", "未开通"],
  service: ["课程培训", "职业技能", "商品销售", "本地到店", "到家服务", "线索收集", "预约咨询"],
  businessScope: ["课程咨询", "门店信息", "预约咨询", "商品介绍", "售前售后", "活动报名", "线索留资"],
  targetUser: ["学生", "家长", "职场人群", "转行人群", "本地生活用户", "价格敏感用户", "高意向咨询用户"],
};

function roleAvatar(role) {
  return Number(role) === 1 ? "商" : "用";
}

function metricLabel(key) {
  const labels = {
    author_ks_id: "作者ID",
    source_table: "来源表",
    p_date: "数据日期",
    user_id: "用户ID",
    merchant_id: "商家ID",
    first_industry_name: "一级行业",
    is_open_robot_valid: "智能客服",
    merchant_name: "商家名称",
    corporation_name: "营业主体",
    user_name: "账号名称",
    user_text: "账号简介",
    guide_words: "欢迎语",
    result: "用户画像全文",
    merchant_profile: "商家画像",
    "画像字段": "画像字段",
    "板块": "画像板块",
    "设备": "使用设备",
    "价格敏感": "价格敏感",
    "智能客服": "智能客服",
  };
  return labels[key] || key;
}

function normalizeRobotStatus(value) {
  if (value === "1" || value === 1 || value === true) return "已开通";
  if (value === "0" || value === 0 || value === false) return "未开通";
  return value || "-";
}

function sourceLabel(source) {
  if (source === "offline") return "离线数据";
  if (source === "proxy") return "实时接口";
  return source || "本地数据";
}

function userProfileBlock(profile, block) {
  return profile.record?.user_profile?.[block] || {};
}

function merchantProfileBlock(profile) {
  return profile.record?.merchant_profile || {};
}

function facetValue(profile, key) {
  const base = userProfileBlock(profile, "基础画像");
  const interest = userProfileBlock(profile, "视频兴趣与内容偏好");
  const commerce = userProfileBlock(profile, "电商与广告行为特征");
  const merchant = merchantProfileBlock(profile);
  const map = {
    gender: base["推测性别"],
    age: base["年龄段"],
    city: base["居住城市"],
    marriage: base["婚姻状况"],
    parenting: base["育儿状况"],
    device: base["使用设备"],
    consume: base["消费水平标签"],
    price: commerce["价格敏感度"],
    interest: interest["核心兴趣垂类"],
    secondaryInterest: interest["次级兴趣"],
    adPreference: commerce["广告形式偏好"],
    merchantIndustry: profile.record?.first_industry_name,
    robot: normalizeRobotStatus(profile.record?.is_open_robot_valid),
    service: merchant["主营商品/服务"],
    businessScope: merchant["经营业务范围"],
    targetUser: merchant["目标用户值"],
  };
  return String(map[key] || "").trim();
}

function facetOptions(key) {
  const sourceRole = key.startsWith("merchant") || ["robot", "service", "businessScope", "targetUser"].includes(key) ? 1 : 2;
  if (["city", "merchantIndustry", "service", "businessScope", "targetUser"].includes(key)) return facetOptionCatalog[key];
  const dataOptions = state.profiles
    .filter((profile) => Number(profile.role) === sourceRole)
    .map((profile) => facetValue(profile, key))
    .filter(Boolean);
  return [...new Set([...(facetOptionCatalog[key] || []), ...dataOptions])]
    .slice(0, 60);
}

function profileMatchesFacets(profile) {
  return Object.entries(state.facets).every(([key, value]) => {
    if (!value || value === "all") return true;
    const current = facetValue(profile, key);
    if (value === "未知") return !current || current.includes("未知");
    if (!current) return false;
    if (current.includes(value)) return true;
    if (value === "一线城市") return /北京|上海|广州|深圳/.test(current);
    if (value === "新一线城市") return /成都|杭州|重庆|武汉|苏州|西安|南京|长沙|天津|郑州|东莞|青岛|昆明|宁波|合肥/.test(current);
    if (value === "二线城市") return /二线/.test(current);
    if (value === "三线及以下") return /三线|四线|五线|下沉/.test(current);
    if (value === "县城\/乡镇") return /县|乡|镇|农村/.test(current);
    if (value === "海外") return /海外|国外|美国|日本|韩国|新加坡|欧洲/.test(current);
    if (value === "教育培训") return /教育|培训|学校|课程|学习/.test(current);
    if (value === "餐饮美食") return /餐饮|美食|餐厅|小吃|烹饪|中餐|西点|西餐/.test(current);
    if (value === "汽车服务") return /汽车|车|试驾|4S|汽修/.test(current);
    if (value === "美容美体") return /美妆|美容|美体|丽人|个护|美甲|医美/.test(current);
    if (value === "数码家电") return /3C|数码|家电|电器|手机|电脑/.test(current);
    if (value === "企业服务") return /企业|平台|软件|SaaS|网络服务/.test(current);
    if (value === "本地服务") return /本地|到店|门店|生活服务/.test(current);
    if (value === "课程培训") return /课程|培训|学习|专业/.test(current);
    if (value === "职业技能") return /职业|技能|就业|技工|烹饪|护理/.test(current);
    if (value === "本地到店") return /到店|门店|套餐|预约/.test(current);
    if (value === "线索收集") return /留资|联系方式|电话|私信|预约/.test(current);
    if (value === "技能学习人群") return /学习|技能|专业|学生|转行/.test(current);
    if (value === "小米/红米") return current.includes("小米") || current.includes("红米");
    if (value === "其他安卓") return /OPPO|vivo|荣耀|三星|安卓/.test(current);
    if (value === "低消费") return current.includes("低消费") || current.includes("极低消费");
    if (value === "中低消费") return current.includes("中低");
    if (value === "高消费") return current.includes("高消费");
    return false;
  });
}

function getRecordTitle(record) {
  if (Number(record.role) === 1) return record.title || record.record?.merchant_name || `商家 ${record.id}`;
  return record.title || `用户 ${record.id}`;
}

function getSearchText(profile) {
  const record = { ...(profile.record || {}) };
  delete record.chat_knowledge_aggr;
  return [
    profile.id,
    profile.title,
    profile.subtitle,
    profile.summary,
    profile.source_table,
    ...(profile.tags || []),
    flattenText(record),
  ].join(" ").toLowerCase();
}

function filteredProfiles() {
  const keyword = state.keyword.trim().toLowerCase();
  let rows = state.profiles.filter((profile) => {
    const roleMatched = state.role === "all" || String(profile.role) === state.role;
    const industryMatched = state.industry === "all" || profile.subtitle === state.industry || (profile.tags || []).includes(state.industry);
    const keywordMatched = !keyword || getSearchText(profile).includes(keyword);
    const facetsMatched = profileMatchesFacets(profile);
    return roleMatched && industryMatched && keywordMatched && facetsMatched;
  });

  if (state.sort === "merchant") rows = rows.sort((a, b) => Number(a.role) - Number(b.role));
  if (state.sort === "user") rows = rows.sort((a, b) => Number(b.role) - Number(a.role));
  return rows;
}

function renderIndustryChips() {
  const label = $("#tagFilterLabel");
  if (label) label.textContent = state.role === "2" ? "用户标签" : state.role === "1" ? "商家行业" : "行业/标签";
  const hint = $("#filterModeHint");
  if (hint) {
    hint.textContent = state.role === "2"
      ? "当前展示用户画像筛选：基础属性、设备消费、内容兴趣。"
      : state.role === "1"
        ? "当前展示商家画像筛选：商家属性、经营信息。"
        : "可先选择用户画像或商家画像，再展开对应结构化筛选。";
  }

  const values = state.role === "2"
    ? state.profiles
      .filter((item) => Number(item.role) === 2)
      .flatMap((item) => item.tags || [])
    : state.role === "1"
      ? facetOptionCatalog.merchantIndustry
    : state.profiles
      .filter((item) => Number(item.role) === 1)
      .map((item) => item.subtitle);

  const industries = [...new Set(values.filter(Boolean))]
    .slice(0, 10);

  $("#industryChips").innerHTML = industries.map((industry) => `
    <button class="chip" title="${escapeHtml(industry)}" data-industry="${escapeHtml(industry)}">${escapeHtml(shortText(industry, 22))}</button>
  `).join("");
}

function renderAdvancedFilters() {
  const panel = $("#advancedFilters");
  if (!panel) return;
  const groups = state.role === "2"
    ? userFacetGroups
    : state.role === "1"
      ? merchantFacetGroups
      : [];

  if (!groups.length) {
    panel.innerHTML = "";
    panel.classList.remove("visible");
    return;
  }

  panel.classList.add("visible");
  panel.innerHTML = groups.map((group) => `
    <div class="facet-row">
      <span>${escapeHtml(group.title)}</span>
      <div class="facet-controls">
        ${group.items.map(([key, label]) => {
          const options = facetOptions(key);
          const widthClass = ["city", "interest", "secondaryInterest", "adPreference", "service", "businessScope", "targetUser"].includes(key)
            ? "wide"
            : "compact";
          return `
            <label class="facet-select ${widthClass}" title="${escapeHtml(label)}">
              <select data-facet="${escapeHtml(key)}" ${options.length ? "" : "disabled"}>
                <option value="all">${escapeHtml(label)}</option>
                ${options.map((option) => `
                  <option value="${escapeHtml(option)}" ${state.facets[key] === option ? "selected" : ""}>${escapeHtml(option)}</option>
                `).join("")}
              </select>
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");
}

function renderActiveFilters() {
  const panel = $("#activeFilters");
  if (!panel) return;
  const items = [];
  if (state.role !== "all") items.push(["画像类型", currentModeLabel()]);
  if (state.industry !== "all") items.push([state.role === "2" ? "用户标签" : "商家行业", state.industry]);
  Object.entries(state.facets).forEach(([key, value]) => {
    if (!value || value === "all") return;
    const allGroups = [...userFacetGroups, ...merchantFacetGroups];
    const label = allGroups.flatMap((group) => group.items).find(([itemKey]) => itemKey === key)?.[1] || key;
    items.push([label, value]);
  });

  if (!items.length) {
    panel.innerHTML = `<span>当前未设置额外筛选</span>`;
    return;
  }

  panel.innerHTML = `
    <span>已选</span>
    ${items.map(([label, value]) => `
      <em title="${escapeHtml(value)}">${escapeHtml(label)}：${escapeHtml(shortText(value, 18))}</em>
    `).join("")}
  `;
}

function refreshFilters() {
  renderIndustryChips();
  renderAdvancedFilters();
  renderActiveFilters();
}

function resetFilters() {
  state.role = "all";
  state.industry = "all";
  state.facets = {};
  state.keyword = "";
  $("#keywordInput").value = "";
  $$("[data-role]").forEach((item) => item.classList.toggle("active", item.dataset.role === "all"));
  $$("[data-industry]").forEach((item) => item.classList.toggle("active", item.dataset.industry === "all"));
  $$(".side-item").forEach((item) => item.classList.toggle("active", item.dataset.section === "market"));
  refreshFilters();
  selectFirstVisible();
  renderProfiles();
}

function renderProfiles() {
  const rows = filteredProfiles();
  $("#resultCount").textContent = `当前展示 ${rows.length} 条画像资产`;

  if (!rows.length) {
    $("#profileList").innerHTML = `<div class="empty">没有匹配结果，换一个关键词或筛选条件。</div>`;
    return;
  }

  $("#profileList").innerHTML = rows.map((profile) => {
    const isActive = state.selectedId === `${profile.role}:${profile.id}`;
    const title = getRecordTitle(profile);
    const metrics = (profile.metrics || [])
      .filter(([key]) => !String(key).toLowerCase().includes("qa"))
      .map(([key, value]) => `
        <div><span>${escapeHtml(metricLabel(key))}</span><b>${escapeHtml(value)}</b></div>
      `).join("");
    const tags = (profile.tags || []).filter(Boolean).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    const summary = cleanSummary(profile.summary);
    return `
      <article class="profile-card role-${profile.role} ${isActive ? "active" : ""}" data-profile-key="${profile.role}:${profile.id}">
        <div class="avatar role-${profile.role}">${roleAvatar(profile.role)}</div>
        <div class="profile-main">
          <div class="profile-head">
            <div>
              <h3>${escapeHtml(title)}</h3>
              <p>ID: ${escapeHtml(profile.id)} · ${escapeHtml(profile.subtitle || profile.p_date)}</p>
            </div>
            <em>${roleLabel(profile.role)}</em>
          </div>
          <p class="summary">${escapeHtml(summary).slice(0, 180)}</p>
          <div class="tag-row">${tags}</div>
          <div class="metric-row">${metrics}</div>
        </div>
      </article>
    `;
  }).join("");
}

function renderKeyValue(record, keys) {
  return keys
    .filter((key) => record[key] !== undefined && record[key] !== "")
    .map((key) => `<dt>${escapeHtml(metricLabel(key))}</dt><dd>${escapeHtml(record[key])}</dd>`)
    .join("");
}

function renderObjectSections(title, data) {
  if (!data || typeof data !== "object") return "";
  const sections = Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      const body = typeof value === "object"
        ? Object.entries(value).map(([k, v]) => `<li><b>${escapeHtml(k)}</b><span>${escapeHtml(v)}</span></li>`).join("")
        : `<li><span>${escapeHtml(value)}</span></li>`;
      return `<article class="section-card"><h4>${escapeHtml(key)}</h4><ul>${body}</ul></article>`;
    }).join("");
  if (!sections) return "";
  return `<section class="detail-section"><h3>${escapeHtml(title)}</h3><div class="section-grid">${sections}</div></section>`;
}

function syncQueryForm(profile) {
  if (!profile) return;
  const queryRole = $("#queryRole");
  const queryId = $("#queryId");
  queryRole.value = String(profile.role);
  queryId.value = profile.id;
}

function renderDetail(profile) {
  if (!profile) {
    $("#profileDetail").innerHTML = `<div class="empty">选择一条画像后，这里展示底表字段和画像字段。</div>`;
    return;
  }

  const record = profile.record || {};
  const isMerchant = Number(profile.role) === 1;
  const rawKeys = isMerchant
    ? ["p_date", "merchant_id", "first_industry_name", "author_ks_id", "is_open_robot_valid", "merchant_name", "corporation_name", "user_name", "user_text", "guide_words"]
    : ["user_id", "p_date", "source_table"];
  const profileData = isMerchant ? record.merchant_profile : record.user_profile;

  $("#detailSubtitle").textContent = `${roleLabel(profile.role)} · ${profile.source_table}`;
  syncQueryForm(profile);
  $("#profileDetail").innerHTML = `
    <section class="identity-card">
      <div class="avatar large role-${profile.role}">${roleAvatar(profile.role)}</div>
      <div>
        <h2>${escapeHtml(getRecordTitle(profile))}</h2>
        <p>${escapeHtml(profile.subtitle || "")}</p>
        <small>来源表：${escapeHtml(profile.source_table || "")}</small>
        <div class="tag-row">${(profile.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
    </section>

    <section class="detail-section">
      <h3>底表原始字段</h3>
      <dl class="field-dl">${renderKeyValue(record, rawKeys)}</dl>
    </section>

    ${renderObjectSections(isMerchant ? "商家画像" : "用户画像", profileData)}
  `;
}

function selectFirstVisible() {
  const first = filteredProfiles()[0];
  if (first) {
    state.selectedId = `${first.role}:${first.id}`;
    renderDetail(first);
  } else {
    state.selectedId = "";
    renderDetail(null);
  }
}

function profileFromOfflineRecord(userRole, offlineRecord) {
  return Number(userRole) === 1
    ? {
        role: 1,
        id: String(offlineRecord.merchant_id),
        title: offlineRecord.merchant_name || offlineRecord.user_name,
        subtitle: offlineRecord.first_industry_name,
        source_table: offlineRecord.source_table,
        tags: [offlineRecord.first_industry_name, normalizeRobotStatus(offlineRecord.is_open_robot_valid)].filter(Boolean),
        summary: offlineRecord.merchant_profile?.["主营商品/服务"] || offlineRecord.merchant_profile?.["经营业务范围"] || offlineRecord.user_text,
        metrics: [
          ["画像字段", Object.keys(offlineRecord.merchant_profile || {}).filter((key) => offlineRecord.merchant_profile[key]).length],
          ["author_ks_id", offlineRecord.author_ks_id || "-"],
          ["智能客服", normalizeRobotStatus(offlineRecord.is_open_robot_valid)],
        ],
        record: offlineRecord,
      }
    : {
        role: 2,
        id: String(offlineRecord.user_id),
        title: `用户 ${offlineRecord.user_id}`,
        subtitle: offlineRecord.user_profile?.["基础画像"]?.["居住城市"],
        source_table: offlineRecord.source_table,
        tags: Object.values(offlineRecord.user_profile?.["基础画像"] || {}).slice(0, 3),
        summary: offlineRecord.result,
        metrics: [
          ["板块", Object.keys(offlineRecord.user_profile || {}).filter((key) => typeof offlineRecord.user_profile[key] === "object").length],
          ["设备", offlineRecord.user_profile?.["基础画像"]?.["使用设备"] || "-"],
          ["价格敏感", offlineRecord.user_profile?.["电商与广告行为特征"]?.["价格敏感度"] || "-"],
        ],
        record: offlineRecord,
      };
}

function upsertProfile(profile) {
  const key = `${profile.role}:${profile.id}`;
  const index = state.profiles.findIndex((item) => `${item.role}:${item.id}` === key);
  if (index >= 0) {
    state.profiles[index] = { ...state.profiles[index], ...profile };
  } else {
    state.profiles = [profile, ...state.profiles];
  }
  state.selectedId = key;
}

function selectProfile(profile) {
  if (!profile) return;
  state.selectedId = `${profile.role}:${profile.id}`;
  syncQueryForm(profile);
  renderProfiles();
  renderDetail(profile);
}

function selectFirstByRole(role) {
  const profile = filteredProfiles().find((item) => String(item.role) === String(role))
    || state.profiles.find((item) => String(item.role) === String(role));
  if (profile) selectProfile(profile);
}

async function loadProfiles() {
  const response = await fetch("/api/profileList?limit=36");
  const json = await response.json();
  const data = json.data || {};
  state.meta = data.meta || {};
  state.profiles = [...(data.users || []), ...(data.merchants || [])];
  refreshFilters();
  selectFirstVisible();
  renderProfiles();
}

async function queryProfile(event) {
  event.preventDefault();
  const payload = {
    user_role: Number($("#queryRole").value),
    user_id: $("#queryId").value.trim(),
    context: serviceContext(),
  };
  if (!payload.user_id) return;
  $("#queryStatus").textContent = "查询中...";
  try {
    const response = await fetch("/api/queryUserProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    $("#queryStatus").textContent = json.ok ? `查询成功：${sourceLabel(json.source)}` : `查询失败：${json.message || json.error}`;
    const offlineRecord = json.data?.offline_record;
    if (offlineRecord) {
      const profile = profileFromOfflineRecord(payload.user_role, offlineRecord);
      upsertProfile(profile);
      state.role = "all";
      state.industry = "all";
      state.facets = {};
      state.keyword = "";
      $("#keywordInput").value = "";
      $$("[data-role]").forEach((item) => item.classList.toggle("active", item.dataset.role === "all"));
      $$("[data-industry]").forEach((item) => item.classList.toggle("active", item.dataset.industry === "all"));
      $$(".side-item").forEach((item) => item.classList.toggle("active", item.dataset.section === "market"));
      refreshFilters();
      renderProfiles();
      renderDetail(profile);
    }
  } catch (error) {
    $("#queryStatus").textContent = error.message;
  }
}

document.addEventListener("click", (event) => {
  const card = event.target.closest("[data-profile-key]");
  if (card) {
    state.selectedId = card.dataset.profileKey;
    const profile = state.profiles.find((item) => `${item.role}:${item.id}` === state.selectedId);
    selectProfile(profile);
    return;
  }

  const roleButton = event.target.closest("[data-role]");
  if (roleButton) {
    state.role = roleButton.dataset.role;
    state.facets = {};
    $$(".side-item").forEach((item) => item.classList.toggle("active", item.dataset.section === "market"));
    $$("[data-role]").forEach((item) => item.classList.toggle("active", item === roleButton));
    refreshFilters();
    selectFirstVisible();
    renderProfiles();
    return;
  }

  const industryButton = event.target.closest("[data-industry]");
  if (industryButton) {
    state.industry = industryButton.dataset.industry;
    $$(".side-item").forEach((item) => item.classList.toggle("active", item.dataset.section === "market"));
    $$("[data-industry]").forEach((item) => item.classList.toggle("active", item === industryButton));
    renderActiveFilters();
    selectFirstVisible();
    renderProfiles();
    return;
  }

  const sideButton = event.target.closest("[data-section]");
  if (sideButton) {
    const section = sideButton.dataset.section;
    $$(".side-item").forEach((item) => item.classList.toggle("active", item === sideButton));
    state.role = section === "user" ? "2" : section === "market" ? "all" : "1";
    state.keyword = "";
    state.industry = "all";
    state.facets = {};
    $("#keywordInput").value = state.keyword;
    $$("[data-role]").forEach((item) => item.classList.toggle("active", item.dataset.role === state.role));
    $$("[data-industry]").forEach((item) => item.classList.toggle("active", item.dataset.industry === "all"));
    refreshFilters();
    selectFirstVisible();
    renderProfiles();
  }
});

document.addEventListener("change", (event) => {
  const select = event.target.closest("[data-facet]");
  if (!select) return;
  const value = select.value;
  if (value === "all") {
    delete state.facets[select.dataset.facet];
  } else {
    state.facets[select.dataset.facet] = value;
  }
  renderActiveFilters();
  selectFirstVisible();
  renderProfiles();
});

$("#resetFilters").addEventListener("click", resetFilters);

$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.keyword = $("#keywordInput").value;
  selectFirstVisible();
  renderProfiles();
});

$("#keywordInput").addEventListener("input", (event) => {
  state.keyword = event.target.value;
  selectFirstVisible();
  renderProfiles();
});

$("#sortSelect").addEventListener("change", (event) => {
  state.sort = event.target.value;
  selectFirstVisible();
  renderProfiles();
});

$("#queryRole").addEventListener("change", (event) => {
  selectFirstByRole(event.target.value);
});

$("#queryForm").addEventListener("submit", queryProfile);

loadProfiles().catch((error) => {
  $("#profileList").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
});
