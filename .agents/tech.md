# Vite React Stack

## 技术栈

- 构建：Vite 8 + TypeScript
- UI：React 19 + shadcn-ui + Radix Primitives + Tailwind CSS v4
- 路由：react-router-dom v7
- 表单：react-hook-form + zod
- 图表：echarts-for-react / recharts
- 动画：framer-motion / gsap

## 目录结构

```
my-app/
├── src/
│   ├── assets/         # 代码 import 的静态资源（图标、组件用图）
│   ├── components/     # 业务组件
│   │   └── ui/         # shadcn-ui 基础组件（不要直接改）
│   ├── pages/          # 路由页面
│   ├── hooks/          # 自定义 hooks
│   └── lib/            # 工具函数
├── public/             # 固定 URL 的公开静态资源（favicon 等）
├── shared/
│   ├── static/         # 鉴权访问的静态资源（私有源托管）
│   └── capabilities/   # capabilities 声明
├── index.html
├── vite.config.ts
└── package.json
```

路径别名：

- `@/*` → `./src/*`
- `@shared/*` → `./shared/*`

## 静态资源放哪——判定规则

按问题树走，**从上往下选第一个 yes**：

1. **代码里要 `import` 它吗？**（组件用的图标、被引用的图片、CSS 里的小图）
   → `src/assets/`，用 `import url from '@/assets/foo.png'`。
   Vite 会 hash + 优化，进 CDN。**绝大多数情况选这条。**

2. **需要鉴权才能访问吗？**（仅登录用户可见的图片、PDF、配置）
   → `shared/static/`。通过平台运行时 SDK 拿带 token 的 URL，**不要**用 `/shared/static/...` 这种相对路径直接引。

3. **必须是固定 URL 文件名吗？**（favicon、被外部系统按 URL 抓取、第三方 SDK 写死路径）
   → `public/`。
   - HTML 里：`<link rel="icon" href="/favicon.svg" />`（Vite 自动重写到 BASE_URL）
   - JSX/CSS 里**不要**写 `<img src="/foo.png" />`——绝对路径在生产会解析到 HTML 域名而不是 CDN，会 404。必须用 `${import.meta.env.BASE_URL}foo.png`。

⚠️ 写代码默认走 `src/assets/`。`public/` 只在 1、2 都不适用时才用，并且必须用 `BASE_URL` 拼路径。

## 动态选择一组资源（国旗、头像类）

不要用 `public/flags/` + 拼字符串。用 `src/assets/` + `import.meta.glob`：

```ts
const flags = import.meta.glob('@/assets/flags/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const url = flags[`/src/assets/flags/${code}.svg`]
```

这样能拿到 hash 后的 CDN URL，且 Vite 会 tree-shake 未引用项。

## 核心约定

1. **shadcn-ui 组件不直接改源码**——需要变化时通过 `className` / `variant` props 控制。
2. **样式优先用 Tailwind utility**，避免写 CSS module。
3. **表单始终用 react-hook-form + zod**——不要直接操作 input value。
4. **图表 ECharts 优先 echarts-for-react**——React 19 严格模式下注意 echarts instance 的初始化时机。
