const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const root = __dirname;
const port = Number(process.env.PORT || 8090);
const host = process.env.HOST || "127.0.0.1";
const queryUserProfileUrl = process.env.QUERY_USER_PROFILE_HTTP_URL || "";
const queryUserProfileToken = process.env.QUERY_USER_PROFILE_TOKEN || "";
const queryUserProfileCookie = process.env.QUERY_USER_PROFILE_COOKIE || "";
const queryUserProfileTimeoutMs = Number(process.env.QUERY_USER_PROFILE_TIMEOUT_MS || 8000);
const defaultBizCode = process.env.QUERY_USER_PROFILE_BIZ_CODE || "demo";
const offlineProfileFile = path.join(root, "mock-data", "profiles.json");
const offlineMerchantProfileFile = path.join(root, "mock-data", "merchant_profiles.json");

function buildServiceContext(payload, bizCode) {
  const sourceContext = payload.context || {};
  return {
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
    ...sourceContext,
    biz_code: bizCode,
  };
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function resolveFile(url) {
  const clean = decodeURIComponent((url || "/").split("?")[0]);
  const normalized = path.normalize(clean).replace(/^(\.\.[/\\])+/, "");
  const file = path.join(root, normalized === "/" ? "index.html" : normalized);
  return file.startsWith(root) ? file : path.join(root, "index.html");
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readOfflineProfiles() {
  try {
    return JSON.parse(fs.readFileSync(offlineProfileFile, "utf8"));
  } catch (error) {
    return { users: [], merchants: [] };
  }
}

function readOfflineMerchantProfiles() {
  try {
    return JSON.parse(fs.readFileSync(offlineMerchantProfileFile, "utf8"));
  } catch (error) {
    return { merchants: {}, record_count: 0 };
  }
}

function queryOfflineProfile(userRole, userId) {
  const data = readOfflineProfiles();
  if (userRole === 2) {
    const user = (data.users || []).find((item) => String(item.user_id) === userId);
    if (!user) return null;
    return {
      base_response: { code: 0, message: "offline profile matched" },
      user_profile: user.user_profile,
      offline_record: user,
    };
  }

  const merchantData = readOfflineMerchantProfiles();
  const merchantFromCsv = merchantData.merchants?.[userId];
  if (merchantFromCsv) {
    return {
      base_response: { code: 0, message: "offline merchant profile matched" },
      merchant_profile: merchantFromCsv.merchant_profile,
      offline_record: merchantFromCsv,
      offline_meta: {
        source_file: merchantData.source_file,
        record_count: merchantData.record_count,
      },
    };
  }

  const merchant = (data.merchants || []).find((item) => String(item.merchant_id) === userId);
  if (!merchant) return null;
  return {
    base_response: { code: 0, message: "offline profile matched" },
    merchant_profile: merchant.merchant_profile,
    offline_record: merchant,
  };
}

function compactMerchant(record) {
  const profile = record.merchant_profile || {};
  return {
    role: 1,
    id: String(record.merchant_id || ""),
    title: record.merchant_name || record.user_name || `商家 ${record.merchant_id}`,
    subtitle: record.first_industry_name || "未知行业",
    source_table: record.source_table || "demo.merchant_profile_records",
    p_date: record.p_date || "",
    tags: [
      record.first_industry_name,
      record.is_open_robot_valid === "1" || record.is_open_robot_valid === "是" ? "已开通智能客服" : "未开通智能客服",
      profile["主营商品/服务"] || profile["经营业务范围"],
    ].filter(Boolean).slice(0, 4),
    summary: profile["主营商品/服务"] || profile["经营业务范围"] || record.user_text || record.guide_words || "暂无商家画像摘要",
    metrics: [
      ["画像字段", Object.keys(profile).filter((key) => profile[key]).length],
      ["author_ks_id", record.author_ks_id || "-"],
      ["智能客服", record.is_open_robot_valid || "-"],
    ],
    record,
  };
}

function compactUser(record) {
  const profile = record.user_profile || {};
  const base = profile["基础画像"] || {};
  const interest = profile["视频兴趣与内容偏好"] || {};
  return {
    role: 2,
    id: String(record.user_id || ""),
    title: `用户 ${record.user_id}`,
    subtitle: base["居住城市"] || "普通用户",
    source_table: record.source_table || "demo.user_profile_records",
    p_date: record.p_date || "",
    tags: [base["年龄段"], base["消费水平标签"], interest["核心兴趣垂类"]].filter(Boolean).slice(0, 4),
    summary: record.result || "暂无用户画像摘要",
    metrics: [
      ["板块", Object.keys(profile).filter((key) => typeof profile[key] === "object").length],
      ["设备", base["使用设备"] || "-"],
      ["价格敏感", profile["电商与广告行为特征"]?.["价格敏感度"] || "-"],
    ],
    record,
  };
}

function listOfflineProfiles(limit = 30) {
  const data = readOfflineProfiles();
  const merchantData = readOfflineMerchantProfiles();
  const users = (data.users || []).map(compactUser);
  const csvMerchants = Object.values(merchantData.merchants || {}).slice(0, limit).map(compactMerchant);
  const mockMerchants = (data.merchants || []).map(compactMerchant);
  const seen = new Set();
  const merchants = [...csvMerchants, ...mockMerchants].filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  return {
    users,
    merchants,
    meta: {
      user_table: "demo.user_profile_records",
      merchant_table: "demo.merchant_profile_records",
      merchant_record_count: merchantData.record_count || merchants.length,
      source: queryUserProfileUrl ? "live-proxy-ready" : "offline",
    },
  };
}

function handleProfileList(req, res) {
  if (req.method !== "GET") return writeJson(res, 405, { ok: false, error: "method_not_allowed" });
  const limit = Math.max(1, Math.min(80, Number(new URL(req.url, `http://${req.headers.host}`).searchParams.get("limit") || 30)));
  writeJson(res, 200, { ok: true, data: listOfflineProfiles(limit) });
}

function requestJson(url, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(payload);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    };
    if (queryUserProfileToken) headers.Authorization = `Bearer ${queryUserProfileToken}`;
    if (queryUserProfileCookie) headers.Cookie = queryUserProfileCookie;

    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request(
      {
        method: "POST",
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        headers,
        timeout: queryUserProfileTimeoutMs,
      },
      (response) => {
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : {};
          } catch (error) {
            return reject(new Error(`upstream returned non-json response: ${data.slice(0, 120)}`));
          }
          if (response.statusCode < 200 || response.statusCode >= 300) {
            return reject(new Error(`upstream http ${response.statusCode}: ${JSON.stringify(parsed).slice(0, 240)}`));
          }
          resolve(parsed);
        });
      },
    );
    request.on("timeout", () => {
      request.destroy(new Error(`upstream timeout after ${queryUserProfileTimeoutMs}ms`));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function handleQueryUserProfile(req, res) {
  if (req.method !== "POST") return writeJson(res, 405, { ok: false, error: "method_not_allowed" });
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    return writeJson(res, 400, { ok: false, error: "invalid_json", message: error.message });
  }

  const userRole = Number(payload.user_role || payload.userRole);
  const userId = String(payload.user_id || payload.userId || "");
  const bizCode = payload.context?.biz_code || payload.biz_code || defaultBizCode;
  const requestPayload = {
    user_role: userRole,
    user_id: userId,
    context: buildServiceContext(payload, bizCode),
  };
  if (![1, 2].includes(userRole) || !userId) {
    return writeJson(res, 400, {
      ok: false,
      error: "invalid_params",
      message: "user_role must be 1/2 and user_id is required",
    });
  }
  if (!queryUserProfileUrl) {
    const offline = queryOfflineProfile(userRole, userId);
    if (offline) {
      return writeJson(res, 200, {
        ok: true,
        source: "offline",
        message: "已命中本地离线样例数据；接入 QUERY_USER_PROFILE_HTTP_URL 后可切换为实时数据。",
        request_payload: requestPayload,
        data: offline,
      });
    }
    return writeJson(res, 404, {
      ok: false,
      source: "offline",
      error: "offline_profile_not_found",
      message: "本地离线数据中没有这个 ID；可尝试用户 1839980743 / 3309708876，或商家 140100007688849 / 140100007689128 / 8842019388。",
      request_payload: requestPayload,
    });
  }

  try {
    const upstream = await requestJson(queryUserProfileUrl, requestPayload);
    writeJson(res, 200, { ok: true, source: "live", request_payload: requestPayload, data: upstream });
  } catch (error) {
    writeJson(res, 502, {
      ok: false,
      error: "upstream_failed",
      message: error.message,
    });
  }
}

http.createServer((req, res) => {
  if ((req.url || "").split("?")[0] === "/api/profileList") {
    handleProfileList(req, res);
    return;
  }

  if ((req.url || "").split("?")[0] === "/api/queryUserProfile") {
    handleQueryUserProfile(req, res);
    return;
  }

  const file = resolveFile(req.url);
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}).listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`底表画像数据展示平台已启动：http://${displayHost}:${port}`);
  if (queryUserProfileUrl) {
    console.log(`画像查询实时代理已配置：${queryUserProfileUrl}`);
  } else {
    console.log("画像查询实时代理未配置，将使用本地离线样例数据");
  }
  if (host === "0.0.0.0") console.log(`局域网访问：使用本机局域网 IP + 端口 ${port}`);
  console.log("按 Ctrl+C 停止服务");
});
