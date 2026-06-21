import fs from "fs";
import path from "path";

const distClient = path.resolve(process.cwd(), "dist/client");
const indexPath = path.join(distClient, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("dist/client/index.html not found");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf-8");

// Replace lark-apaas template variables with static values for standalone deployment
html = html.replace(/{Agnes AI 在线演示平台}/g, "Agnes AI 在线演示平台");
html = html.replace(/{{{appAvatar}}}/g, "./favicon.svg");
html = html.replace(/{{{appDescription}}}/g, "Agnes AI 三大核心模型（文本/图像/视频）在线演示平台");
html = html.replace(/Agnes AI 在线演示平台/g, "Agnes AI 在线演示平台");
html = html.replace(/{{appAvatar}}/g, "./favicon.svg");
html = html.replace(/{{appDescription}}/g, "Agnes AI 三大核心模型（文本/图像/视频）在线演示平台");
html = html.replace(/"{{appId}}"/g, '""');
html = html.replace(/"{{userId}}"/g, '""');
html = html.replace(/"{{tenantId}}"/g, '""');
html = html.replace(/"{{userName}}"/g, '""');
html = html.replace(/"{{csrfToken}}"/g, '""');
html = html.replace(/"{{environment}}"/g, '""');

fs.writeFileSync(indexPath, html);
console.log("Patched dist/client/index.html for standalone deployment");
