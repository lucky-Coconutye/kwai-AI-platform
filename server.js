const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "127.0.0.1";

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

http.createServer((req, res) => {
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
  console.log(`画像驱动 AI 回评 Demo 已启动：http://${displayHost}:${port}`);
  if (host === "0.0.0.0") console.log(`局域网访问：使用本机局域网 IP + 端口 ${port}`);
  console.log("按 Ctrl+C 停止服务");
});
