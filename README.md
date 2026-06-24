<div align="center">

<img src="public/favicon.svg" alt="Agnes AI Logo" width="80" height="80" />

# Agnes Online

**Agnes AI 多模态在线演示平台**

一站式体验 Agnes AI 的文本对话、图像生成与视频创作能力

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAlleyf%2FAgnesOnline)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://alleyf.github.io/AgnesOnline/)

[English](#english) · [简体中文](#简体中文)

</div>

---

## 简体中文

### ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🤖 **智能对话** | 基于 `agnes-2.0-flash` 的多轮对话，支持流式输出、会话管理、消息编辑与重新生成 |
| 🎨 **图像生成** | 基于 `agnes-image-2.1-flash` 的文字生图，支持多种尺寸、画质、批量生成与精细化参数调节 |
| 🎬 **视频创作** | 基于 `agnes-video-v2.0` 的文字生视频，支持多种分辨率、时长、帧率配置，异步轮询实时进度展示 |
| 📦 **资产管理** | 集中管理所有生成的图像与视频，支持搜索、筛选、批量操作、下载与一键重新生成 |
| 🌗 **主题切换** | 深色/浅色主题一键切换，所有数据本地存储，跨标签页自动同步 |
| 🔐 **隐私安全** | API Token 仅存储于浏览器本地，所有请求直达 Agnes API，不经过任何中间服务 |

### 🖼️ 平台预览

<table>
  <tr>
    <td><img src="public/landing1.png" alt="首页" width="400" /></td>
    <td><img src="public/langding2.png" alt="智能对话" width="400" /></td>
  </tr>
  <tr>
    <td><img src="public/langding3.png" alt="图像生成" width="400" /></td>
    <td><img src="public/lanlangding4.png" alt="视频创作" width="400" /></td>
  </tr>
  <tr>
    <td><img src="public/lanlangding5.png" alt="资产管理" width="400" /></td>
    <td></td>
  </tr>
</table>

### 🚀 快速开始

#### 前置条件

- Node.js ≥ 18
- npm ≥ 9
- Agnes AI API Key（[点击申请](https://apihub.agnes-ai.com)）

#### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Alleyf/AgnesOnline.git
cd AgnesOnline

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后在浏览器打开 `http://localhost:5173`，在侧边栏底部 🔑 设置面板填入你的 API Key 即可开始使用。

#### 构建部署

```bash
npm run build
```

构建产物输出至 `dist/` 目录，可直接部署至任何静态托管服务。

### ☁️ 一键部署

| 平台 | 操作 |
|------|------|
| **Vercel** | 点击顶部 [Deploy with Vercel] 按钮，按提示完成配置 |
| **GitHub Pages** | 已内置 GitHub Actions 工作流，推送至 `main` 分支即自动部署 |

> GitHub Pages 部署需在仓库 Settings → Pages 中将 Source 设为 **GitHub Actions**。

### 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19 |
| 构建工具 | Vite | 8 |
| 类型系统 | TypeScript | 5.9 |
| 样式方案 | Tailwind CSS | 4 |
| UI 组件 | shadcn/ui (Radix UI) | — |
| 图标库 | lucide-react | 0.577 |
| 动画引擎 | framer-motion | 12 |
| 路由管理 | react-router-dom | 7 |
| 图表渲染 | recharts | 3 |
| Markdown | react-markdown + remark-gfm | — |
| 通知提示 | sonner | 2 |

### 📂 项目结构

```
AgnesOnline/
├── public/                   # 静态资源
│   ├── favicon.svg           # Agnes AI 闪电 Logo
│   ├── icons.svg             # 社交图标精灵图（GitHub/Discord/Bluesky/X）
│   ├── landing1.png          # 首页预览图
│   ├── langding2.png         # 对话页预览图
│   ├── langding3.png         # 图像生成预览图
│   ├── lanlangding4.png      # 视频创作预览图
│   ├── lanlangding5.png      # 资产管理预览图
│   └── agnesdemo.mp4         # 平台演示视频
├── src/
│   ├── index.tsx             # 入口（Provider 层级 + 样式引入）
│   ├── app.tsx               # 路由配置
│   ├── api/                  # Agnes API 封装层
│   │   └── agnes.ts          # OpenAI-compatible API 客户端
│   ├── components/           # 全局组件
│   │   ├── Layout.tsx        # 侧边栏 + Outlet 布局壳
│   │   ├── AppSidebar.tsx    # 导航侧边栏（含主题/Token/链接）
│   │   ├── AgnesLogo.tsx     # Agnes AI SVG Logo
│   │   ├── TokenSettingsPanel.tsx  # API Key 配置面板
│   │   └── ui/               # shadcn/ui 内置组件（勿修改）
│   ├── pages/                # 页面模块
│   │   ├── HomePage/         # 🏠 首页（模型展示）
│   │   ├── ChatPage/         # 🤖 智能对话
│   │   ├── ImageGenPage/     # 🎨 图像生成
│   │   ├── VideoGenPage/     # 🎬 视频创作
│   │   ├── AssetsPage/       # 📦 资产管理
│   │   └── NotFoundPage/     # 404 页面
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useAgnesToken.ts  # Token 状态管理 + 跨标签页同步
│   │   ├── useAssets.ts      # 资产 CRUD + 持久化 + 分页
│   │   └── useTheme.tsx      # 深色/浅色切换
│   ├── lib/                  # 工具函数（cn() 等）
│   └── index.css             # 全局样式 + 主题变量
├── shared/
│   └── static/               # 共享静态资源
│       ├── data/             # 数据文件（JSON）
│       └── images/           # 图片资源
├── scripts/                  # 构建 & 开发脚本
├── .github/workflows/        # CI/CD（GitHub Pages 自动部署）
└── index.html                # HTML 入口
```

### 🌈 主题定制

主题色定义在 `src/index.css` / `src/tailwind-theme.css`，通过 CSS 变量 + `@theme inline` 注册到 Tailwind：

| 用途 | Tailwind 类 | CSS 变量 |
|------|------------|----------|
| 页面背景 | `bg-background` | `--background` |
| 主文本 | `text-foreground` | `--foreground` |
| 主色（紫色） | `bg-primary` | `--primary` |
| 强调色（青色） | `bg-accent` | `--accent` |
| 边框 | `border-border` | `--border` |
| 图表色 | `bg-chart-1` ~ `bg-chart-5` | `--chart-1` ~ `--chart-5` |

HSL 格式使用空格分隔：`--primary: hsl(250 75% 55%);`

### 🔌 API 接入

AgnesOnline 使用 OpenAI-compatible API 格式，基础地址为 `https://apihub.agnes-ai.com/v1`：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/v1/chat/completions` | POST | 文本对话（SSE 流式） |
| `/v1/images/generations` | POST | 图像生成 |
| `/agnesapi?video_id=<ID>` | GET | 视频任务轮询 |

所有认证通过 Bearer Token 实现，Token 仅存储在浏览器 `scopedStorage` 中。

### 📐 导入路径别名

```typescript
// @/ → src/
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// @shared/ → shared/
import heroImage from "@shared/static/images/hero.png";
```

### ⚠️ 禁止修改的文件

| 文件 | 原因 |
|------|------|
| `src/index.tsx` | Provider 层级 + 样式引入，由模板管理 |
| `src/components/ui/*` | shadcn/ui 内置组件，版本锁定 |

### 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交变更：`git commit -m 'feat: add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

### 📄 许可证

本项目暂未添加开源许可证。如需使用，请联系作者。

---

<a id="english"></a>

## English

### ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat** | Multi-turn conversation powered by `agnes-2.0-flash` with streaming output, session management, message editing & regeneration |
| 🎨 **Image Generation** | Text-to-image via `agnes-image-2.1-flash` with multiple sizes, quality levels, batch generation & fine-grained parameter control |
| 🎬 **Video Creation** | Text-to-video via `agnes-video-v2.0` with configurable resolution, duration, frame rate, and real-time progress tracking |
| 📦 **Asset Management** | Centralized gallery for all generated images & videos with search, filtering, batch operations, download & one-click regeneration |
| 🌗 **Theme Toggle** | Dark/light theme switch, all data stored locally with cross-tab sync |
| 🔐 **Privacy & Security** | API Token stored only in the browser; all requests go directly to Agnes API — no middleman |

### 🚀 Quick Start

```bash
git clone https://github.com/Alleyf/AgnesOnline.git
cd AgnesOnline
npm install
npm run dev
```

Open `http://localhost:5173`, enter your API Key in the sidebar 🔑 settings panel, and start exploring.

**Get your API Key:** [https://apihub.agnes-ai.com](https://apihub.agnes-ai.com)

### ☁️ One-Click Deploy

- **Vercel:** Click the [Deploy with Vercel] badge at the top
- **GitHub Pages:** Push to `main` — the built-in GitHub Actions workflow handles deployment automatically

### 🛠️ Tech Stack

React 19 · Vite 8 · TypeScript 5.9 · Tailwind CSS 4 · shadcn/ui · framer-motion · react-router-dom v7 · recharts · react-markdown · sonner

### 🤝 Contributing

Issues and Pull Requests are welcome! Please fork, create a feature branch, and submit a PR.

### 📄 License

No open-source license has been added yet. Contact the author if you wish to use this project.

---

<div align="center">

**Made with ❤️ by [Alleyf](https://github.com/Alleyf)**

</div>
