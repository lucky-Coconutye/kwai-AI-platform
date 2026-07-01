const state = {
  currentStep: 1,
  queryDate: "2026-06-30",
  selectedMerchantId: "",
  selectedMaterialId: "",
  merchantProfile: null,
  userProfiles: {},
  selectedTaskId: null,
  logs: [],
  merchants: [
    {
      id: "m_auto_hz_001",
      name: "杭州某某汽车门店",
      industry: "汽车线索",
      materials: [
        { id: "mat_001", name: "618汽车线索短视频" },
        { id: "mat_002", name: "本地门店直播切片" },
      ],
    },
    {
      id: "m_life_002",
      name: "长沙轻医美体验店",
      industry: "生活服务",
      materials: [
        { id: "mat_003", name: "暑期到店体验素材" },
        { id: "mat_004", name: "直播预约福利素材" },
      ],
    },
  ],
  tasks: [],
  badcases: [],
};

const mockApi = {
  async getMerchantProfile(merchantId) {
    await delay(360);
    const merchant = state.merchants.find((item) => item.id === merchantId);
    if (merchant.industry === "汽车线索") {
      return {
        merchantId,
        name: merchant.name,
        industry: "汽车线索",
        goal: "到店试驾 / 私信留资",
        advantages: ["本地门店", "现车可看", "近期优惠", "支持预约试驾"],
        forbiddenClaims: ["不承诺固定价格", "不承诺贷款最低", "不编造库存"],
        defaultPersona: "经验达人",
        riskLevel: "中低",
        sourceTable: "ks_mmu.pi_merchant_profile_generation_record",
        queryKey: `p_date=${state.queryDate}, merchant_id in (${merchantId})`,
        guideWords: ["欢迎咨询", "可引导私信", "可引导预约到店"],
        chatKnowledge: ["现车和优惠随门店变化", "预约试驾需要确认到店时间"],
      };
    }
    return {
      merchantId,
      name: merchant.name,
      industry: "生活服务",
      goal: "预约到店 / 私信咨询",
      advantages: ["本地门店", "新人优惠", "可预约体验", "服务顾问跟进"],
      forbiddenClaims: ["不承诺绝对效果", "不涉及医疗诊断", "不夸大功效"],
      defaultPersona: "暖心客服",
      riskLevel: "中",
      sourceTable: "ks_mmu.pi_merchant_profile_generation_record",
      queryKey: `p_date=${state.queryDate}, merchant_id in (${merchantId})`,
      guideWords: ["先确认需求", "敏感问题转人工", "引导预约顾问"],
      chatKnowledge: ["体验项目需根据个人情况确认", "不得承诺绝对效果"],
    };
  },

  async getCommentTasks(materialId) {
    await delay(320);
    const auto = [
      ["t_001", "这个多少钱啊？", "价格咨询", "u_001", "低"],
      ["t_002", "可以预约试驾吗", "到店咨询", "u_002", "低"],
      ["t_003", "有现车吗？", "库存咨询", "u_003", "低"],
      ["t_004", "贷款利息能保证最低吗", "金融相关", "u_004", "高"],
    ];
    const life = [
      ["t_101", "这个项目适合敏感肌吗？", "服务适配", "u_101", "中"],
      ["t_102", "新人体验价是多少", "价格咨询", "u_102", "低"],
      ["t_103", "能保证一次见效吗", "功效承诺", "u_103", "高"],
      ["t_104", "周末可以预约吗", "预约咨询", "u_104", "低"],
    ];
    const source = materialId === "mat_003" || materialId === "mat_004" ? life : auto;
    return source.map(([id, comment, intent, userId, risk]) => ({
      id,
      comment,
      intent,
      userId,
      risk,
      userProfile: null,
      strategy: null,
      aiReply: "",
      status: risk === "高" ? "风险拦截" : "待生成策略",
    }));
  },

  async getUserProfiles(userIds) {
    await delay(420);
    const profiles = {};
    userIds.forEach((userId, index) => {
      const base = [
        {
          stage: "比价阶段",
          intentLevel: "高意向",
          priceSensitivity: "高",
          location: "杭州",
          focus: ["价格", "优惠", "预算"],
          tone: "直接、克制、给入口",
        },
        {
          stage: "到店决策",
          intentLevel: "强意向",
          priceSensitivity: "中",
          location: "本地",
          focus: ["预约", "门店", "时间"],
          tone: "明确、服务型、给下一步",
        },
        {
          stage: "购买前确认",
          intentLevel: "高意向",
          priceSensitivity: "中",
          location: "杭州",
          focus: ["库存", "到店", "提车"],
          tone: "不编造事实，提示确认",
        },
        {
          stage: "风险咨询",
          intentLevel: "中意向",
          priceSensitivity: "高",
          location: "未知",
          focus: ["金融", "承诺", "风险"],
          tone: "合规、转人工",
        },
      ][index % 4];
      profiles[userId] = {
        userId,
        sourceTable: "ks_mmu.llm_u2_user_description_white_box_td",
        queryKey: `p_date=${state.queryDate}, user_id in (...)`,
        profileHit: true,
        riskSignal: base.stage === "风险咨询" ? "承诺/金融/效果类敏感问题" : "无明显风险",
        ...base,
      };
    });
    return profiles;
  },

  async generateStrategy({ task, merchantProfile, userProfile }) {
    await delay(360);
    if (task.risk === "高") {
      return {
        mode: "转人工",
        persona: "-",
        guidance: "高风险问题不自动公开回复，进入人工处理",
        reason: `用户画像风险信号：${userProfile.riskSignal}；评论命中 ${task.intent}；商家禁答边界：${merchantProfile.forbiddenClaims.join(" / ")}`,
        publishable: false,
      };
    }
    const guidance = task.intent.includes("预约")
      ? "突出本地门店和预约入口，引导详情页/私信"
      : task.intent.includes("价格")
        ? "不报固定价格，强调优惠边界，引导详情页/私信"
        : "基于商家优势回答，不编造事实，必要时引导私信确认";
    return {
      mode: task.risk === "中" ? "审核" : "自动回",
      persona: merchantProfile.defaultPersona,
      guidance,
      reason: `用户处于${userProfile.stage}，关注${userProfile.focus.join("、")}，意向强度 ${userProfile.intentLevel}；商家可提供 ${merchantProfile.advantages.join("、")}；禁答 ${merchantProfile.forbiddenClaims.join("、")}`,
      publishable: true,
    };
  },

  async generateReply({ task, merchantProfile, userProfile, strategy }) {
    await delay(420);
    if (!strategy.publishable) return "该评论命中高风险规则，建议转人工处理，不生成公开 AI 回复。";
    if (task.intent.includes("价格")) {
      return `这项近期有活动，具体价格会和配置/服务方案有关，可以点详情页先看优惠，也可以私信确认你关注的版本。`;
    }
    if (task.intent.includes("预约") || task.intent.includes("到店")) {
      return `可以预约，我们是本地门店，建议点详情页选择时间，也可以私信确认最近的到店安排。`;
    }
    if (task.intent.includes("库存")) {
      return `现车情况会随门店到车变化，建议点详情页或私信确认你想看的配置，我们可以帮你查最近安排。`;
    }
    return `这个问题建议结合你的情况确认，我们可以根据${userProfile.focus[0]}帮你进一步看下，点击详情页或私信都可以。`;
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const pageMeta = {
  overview: ["AI 回评策略工作台", "底层画像表只提供上下文，平台负责把画像解析成回评策略和发布决策。"],
  profile: ["画像联动", "明确两张底表如何参与回评决策：按 p_date + ID in 查询，解析画像字段，禁止扫全表。"],
  tasks: ["评论任务", "展示评论、user_id、merchant_id、用户画像命中情况、风险等级和处理状态。"],
  strategy: ["回评策略", "用户画像决定对谁说和风险多高，商家画像决定能说什么和不能说什么。"],
  review: ["审核发布", "看 AI 生成内容，人工确认发布、转人工或标记 Badcase。"],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.min(ms, 140)));
}

function setText(selector, text) {
  const el = $(selector);
  if (el) el.textContent = text;
}

function switchView(view) {
  if (!pageMeta[view]) return;
  $$(".side-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  $$(".view").forEach((section) => {
    section.classList.toggle("active", section.id === view);
  });
  $(".main").dataset.view = view;
  setText("#pageTitle", pageMeta[view][0]);
  setText("#pageDesc", pageMeta[view][1]);
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

function log(message) {
  state.logs.unshift(`${new Date().toLocaleTimeString("zh-CN", { hour12: false })} ${message}`);
  renderLogs();
}

function setStep(step) {
  state.currentStep = Math.max(state.currentStep, step);
  $$(".step").forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle("active", n <= state.currentStep);
  });
}

function statusClass(status) {
  if (status === "已发布") return "success";
  if (status === "待审核" || status === "待生成回复" || status === "待生成策略") return "warn";
  if (status === "风险拦截") return "danger";
  return "muted";
}

function initSelectors() {
  $("#merchantSelect").innerHTML = state.merchants.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
  renderMaterialOptions();
}

function renderMaterialOptions() {
  const merchantId = $("#merchantSelect").value || state.merchants[0].id;
  const merchant = state.merchants.find((m) => m.id === merchantId);
  $("#materialSelect").innerHTML = merchant.materials.map((m) => `<option value="${m.id}">${m.name}</option>`).join("");
}

async function confirmMerchant() {
  state.selectedMerchantId = $("#merchantSelect").value;
  state.selectedMaterialId = $("#materialSelect").value;
  state.merchantProfile = null;
  state.userProfiles = {};
  state.selectedTaskId = null;
  state.tasks = await mockApi.getCommentTasks(state.selectedMaterialId);
  $("#merchantStatus").textContent = "已选择";
  $("#merchantStatus").className = "status success";
  renderSideMerchant();
  setStep(2);
  log("已选择商家与素材，并拉取评论任务");
  renderAll();
}

async function syncProfiles() {
  if (!state.selectedMerchantId) return toast("请先选择商家/素材");
  const applyButton = $("#applyContext");
  if (applyButton) {
    applyButton.disabled = true;
    applyButton.textContent = "同步中...";
  }
  const merchantProfile = await mockApi.getMerchantProfile(state.selectedMerchantId);
  const userProfiles = await mockApi.getUserProfiles(state.tasks.map((t) => t.userId));
  state.merchantProfile = merchantProfile;
  state.userProfiles = userProfiles;
  state.tasks = state.tasks.map((task) => ({ ...task, userProfile: userProfiles[task.userId] }));
  if (applyButton) {
    applyButton.textContent = "应用并同步画像";
    applyButton.disabled = false;
  }
  $("#profileStatus").textContent = "已同步";
  $("#profileStatus").className = "status success";
  setStep(3);
  log("已同步商家画像和评论用户画像");
  renderAll();
}

async function applyContext() {
  await confirmMerchant();
  await syncProfiles();
  toast("商家画像与用户画像已同步");
}

function selectTask(taskId) {
  state.selectedTaskId = taskId;
  setStep(4);
  const task = getSelectedTask();
  if (!task) return toast("请先确认商家/素材并同步任务");
  log(`已选择评论：${task.comment}`);
  renderAll();
  switchView("strategy");
}

function getSelectedTask() {
  return state.tasks.find((task) => task.id === state.selectedTaskId);
}

async function generateStrategy() {
  const task = getSelectedTask();
  if (!task) return toast("请先选择评论");
  if (!state.merchantProfile || !task.userProfile) return toast("请先同步画像");
  task.strategy = await mockApi.generateStrategy({
    task,
    merchantProfile: state.merchantProfile,
    userProfile: task.userProfile,
  });
  task.status = task.strategy.publishable ? "待生成回复" : "风险拦截";
  setStep(5);
  log(`已生成策略：${task.strategy.mode}`);
  renderAll();
}

async function generateReply() {
  const task = getSelectedTask();
  if (!task?.strategy) return toast("请先生成策略");
  task.aiReply = await mockApi.generateReply({
    task,
    merchantProfile: state.merchantProfile,
    userProfile: task.userProfile,
    strategy: task.strategy,
  });
  task.status = task.strategy.publishable ? "待审核" : "风险拦截";
  setStep(6);
  log("已生成 AI 回评");
  renderAll();
}

function publishReply() {
  const task = getSelectedTask();
  if (!task?.aiReply || task.status !== "待审核") return toast("当前任务不可发布");
  task.status = "已发布";
  log("已审核通过并发布回复");
  renderAll();
  toast("发布成功");
}

function markBadcase() {
  const task = getSelectedTask();
  if (!task) return;
  state.badcases.unshift({
    id: `bad_${Date.now()}`,
    comment: task.comment,
    reason: task.risk === "高" ? "高风险评论不适合公开 AI 回复" : "人工反馈回复不合适",
  });
  task.status = "风险拦截";
  log("已标记 Badcase");
  renderAll();
}

async function runOneClick() {
  const btn = $("#runOneClick");
  btn.disabled = true;
  btn.textContent = "链路执行中...";
  try {
    await confirmMerchant();
    await syncProfiles();
    const first = state.tasks.find((task) => task.risk !== "高");
    selectTask(first.id);
    await generateStrategy();
    await generateReply();
    switchView("review");
    toast("已跑通到待审核状态");
  } finally {
    btn.disabled = false;
    btn.textContent = "跑通一条回评链路";
  }
}

function renderTasks() {
  const status = $("#statusFilter").value;
  const keyword = $("#searchBox").value.trim();
  const rows = state.tasks.filter((task) => {
    const matchedStatus = status === "all" || task.status === status;
    const haystack = `${task.comment}${task.intent}${task.userProfile?.intentLevel || ""}${task.userProfile?.focus?.join("") || ""}`;
    return matchedStatus && (!keyword || haystack.includes(keyword));
  });
  $("#taskRows").innerHTML = rows.map((task) => `
    <tr class="${task.id === state.selectedTaskId ? "selected" : ""}">
      <td>${task.comment}</td>
      <td><b>${task.userId}</b><br><span class="subtle">${state.selectedMerchantId || "未选择商家"}</span></td>
      <td>${task.userProfile ? `命中 · ${task.userProfile.intentLevel}<br><span class="subtle">${task.userProfile.focus.join("、")}</span>` : "未同步"}</td>
      <td><span class="status ${task.risk === "高" ? "danger" : "success"}">${task.risk}</span></td>
      <td><span class="status ${statusClass(task.status)}">${task.status}</span></td>
      <td><button class="link-btn" data-task="${task.id}">选择</button></td>
    </tr>
  `).join("") || `<tr><td colspan="6">暂无评论任务</td></tr>`;
}

function renderProfiles() {
  const merchantBox = $("#merchantProfileBox");
  if (!state.merchantProfile) {
    merchantBox.className = "profile-box empty-box";
    merchantBox.textContent = "尚未同步商家画像";
  } else {
    merchantBox.className = "profile-box";
    merchantBox.innerHTML = `
      <h3>${state.merchantProfile.name}</h3>
      <dl class="profile-dl">
        <dt>来源表</dt><dd>${state.merchantProfile.sourceTable}</dd>
        <dt>查询约束</dt><dd>${state.merchantProfile.queryKey}</dd>
        <dt>行业</dt><dd>${state.merchantProfile.industry}</dd>
        <dt>目标</dt><dd>${state.merchantProfile.goal}</dd>
        <dt>风险</dt><dd>${state.merchantProfile.riskLevel}</dd>
        <dt>人设</dt><dd>${state.merchantProfile.defaultPersona}</dd>
      </dl>
      <div class="profile-tags">${state.merchantProfile.advantages.map((item) => `<span>${item}</span>`).join("")}</div>
      <p class="profile-note"><b>禁答边界：</b>${state.merchantProfile.forbiddenClaims.join("、")}</p>
      <p class="profile-note"><b>知识补充：</b>${state.merchantProfile.guideWords.join("、")}；${state.merchantProfile.chatKnowledge.join("、")}</p>
    `;
  }

  const task = getSelectedTask();
  const userBox = $("#userProfileBox");
  if (!task?.userProfile) {
    userBox.className = "profile-box empty-box";
    userBox.textContent = task ? "该评论用户画像尚未同步" : "选择评论后展示用户画像";
  } else {
    userBox.className = "profile-box";
    userBox.innerHTML = `
      <h3>${task.userProfile.intentLevel} · ${task.userProfile.stage}</h3>
      <dl class="profile-dl">
        <dt>来源表</dt><dd>${task.userProfile.sourceTable}</dd>
        <dt>查询约束</dt><dd>${task.userProfile.queryKey}</dd>
        <dt>位置</dt><dd>${task.userProfile.location}</dd>
        <dt>价格敏感</dt><dd>${task.userProfile.priceSensitivity}</dd>
        <dt>表达</dt><dd>${task.userProfile.tone}</dd>
      </dl>
      <div class="profile-tags">${task.userProfile.focus.map((item) => `<span>${item}</span>`).join("")}</div>
      <p class="profile-note"><b>风险信号：</b>${task.userProfile.riskSignal}</p>
    `;
  }
}

function renderFlow() {
  const task = getSelectedTask();
  $("#selectedTaskBadge").textContent = task ? task.comment : "未选择评论";
  $("#selectedTaskBadge").className = task ? "status success" : "status muted";

  $("#merchantProfileCard").innerHTML = state.merchantProfile ? `
    <span>商家画像</span>
    <h3>${state.merchantProfile.industry}</h3>
    <p>${state.merchantProfile.goal}</p>
    <ul>${state.merchantProfile.advantages.map((item) => `<li>${item}</li>`).join("")}</ul>
  ` : `<span>商家画像</span><div class="empty">等待同步</div>`;

  $("#userProfileCard").innerHTML = task?.userProfile ? `
    <span>用户画像</span>
    <h3>${task.userProfile.intentLevel} · ${task.userProfile.stage}</h3>
    <p>关注：${task.userProfile.focus.join("、")}</p>
    <p>表达：${task.userProfile.tone}</p>
  ` : `<span>用户画像</span><div class="empty">等待选择评论</div>`;

  $("#strategyCard").innerHTML = task?.strategy ? `
    <span>回评决策</span>
    <h3>${task.strategy.mode}</h3>
    <p>${task.strategy.guidance}</p>
    <p>${task.strategy.reason}</p>
  ` : `<span>策略生成</span><div class="empty">等待生成策略</div>`;

  $("#replyCard").innerHTML = task?.aiReply ? `
    <span>AI 回评</span>
    <h3>${task.strategy?.persona || "AI客服"}</h3>
    <p>${task.aiReply}</p>
  ` : `<span>AI 回评</span><div class="empty">等待生成回复</div>`;

  $("#generateStrategy").disabled = !task || !state.merchantProfile || !task.userProfile;
  $("#generateReply").disabled = !task?.strategy || !task.strategy.publishable;
  $("#publishReply").disabled = !task?.aiReply || task.status !== "待审核";
  $("#markBadcase").disabled = !task;
}

function renderSummary() {
  const profileHit = state.tasks.filter((task) => task.userProfile).length;
  const published = state.tasks.filter((task) => task.status === "已发布").length;
  const todo = state.tasks.filter((task) => !["已发布", "风险拦截"].includes(task.status)).length;
  setText("#metricPublishedTop", published);
  setText("#metricNewComments", (18420 + state.tasks.length).toLocaleString("zh-CN"));
  const riskComments = state.tasks.filter((task) => task.risk === "高" || task.status === "风险拦截").length;
  setText("#metricRiskComments", riskComments);
  setText("#metricHitRate", state.tasks.length ? `${Math.round((profileHit / state.tasks.length) * 100)}%` : "82.3%");

}

function renderSideMerchant() {
  const merchantId = state.selectedMerchantId || $("#merchantSelect")?.value || state.merchants[0].id;
  const merchant = state.merchants.find((item) => item.id === merchantId);
  if (!merchant) return;
  setText("#sideMerchantName", merchant.name);
  setText("#sideMerchantMeta", `${merchant.industry} · 灰度商家`);
}

function renderOverviewPending() {
  const box = $("#overviewPending");
  if (!box) return;
  const rows = state.tasks.length ? state.tasks : [
    { id: "demo_1", comment: "可以预约试驾吗", intent: "到店咨询", risk: "低", status: "待生成策略", userProfile: { intentLevel: "强到店意向", focus: ["预约", "门店"] } },
    { id: "demo_2", comment: "这是骗人的吗", intent: "负向质疑", risk: "高", status: "风险拦截", userProfile: { intentLevel: "负向质疑", focus: ["风险", "承诺"] } },
    { id: "demo_3", comment: "有现车吗", intent: "库存咨询", risk: "低", status: "待生成策略", userProfile: { intentLevel: "高意向", focus: ["库存", "到店"] } },
    { id: "demo_4", comment: "贷款利息能保证最低吗", intent: "金融相关", risk: "高", status: "风险拦截", userProfile: { intentLevel: "金融敏感", focus: ["承诺", "风险"] } },
  ];
  box.innerHTML = rows.slice(0, 4).map((task) => `
    <article class="pending-item">
      <div>
        <b>${task.comment}</b>
        <span>${task.userProfile?.intentLevel || "画像未同步"} / ${task.userProfile?.focus?.join("、") || task.intent} / 风险${task.risk} / ${task.status}</span>
      </div>
    </article>
  `).join("");
}

function renderReviewPreview() {
  const box = $("#reviewPreview");
  if (!box) return;
  const task = getSelectedTask();
  if (!task) {
    box.className = "review-preview empty-box";
    box.textContent = "选择评论并生成回复后，在这里审核发布。";
    return;
  }
  box.className = "review-preview";
  box.innerHTML = `
    <h3>${task.comment}</h3>
    <p><b>意图：</b>${task.intent}　<b>风险：</b>${task.risk}　<b>状态：</b>${task.status}</p>
    <p><b>策略：</b>${task.strategy ? `${task.strategy.mode}，${task.strategy.guidance}` : "尚未生成策略"}</p>
    <p><b>AI 回评：</b>${task.aiReply || "尚未生成回复"}</p>
  `;
}

function renderLogs() {
  $("#logList").innerHTML = state.logs.map((item) => `<li>${item}</li>`).join("") || `<li>暂无操作日志</li>`;
}

function renderAll() {
  renderTasks();
  renderProfiles();
  renderFlow();
  renderReviewPreview();
  renderOverviewPending();
  renderSideMerchant();
  renderSummary();
  renderLogs();
}

$("#merchantSelect").addEventListener("change", renderMaterialOptions);
$("#applyContext").addEventListener("click", applyContext);
$("#runOneClick").addEventListener("click", runOneClick);
$("#generateStrategy").addEventListener("click", generateStrategy);
$("#generateReply").addEventListener("click", generateReply);
$("#publishReply").addEventListener("click", publishReply);
$("#markBadcase").addEventListener("click", markBadcase);
$("#statusFilter").addEventListener("change", renderTasks);
$("#searchBox").addEventListener("input", renderTasks);
document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) switchView(viewButton.dataset.view);

  const button = event.target.closest("[data-task]");
  if (button) selectTask(button.dataset.task);
});

async function bootstrapDemo() {
  initSelectors();
  await confirmMerchant();
  await syncProfiles();
  switchView("overview");
}

bootstrapDemo();
