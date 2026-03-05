# EdgeOne Pages React Router Starter

A comprehensive React Router v7 starter template for EdgeOne Pages, showcasing various rendering modes and full-stack capabilities.

## 🚀 特性

- **Server-Side Rendering (SSR)** - 服务器端实时渲染
- **Client-Side Rendering (CSR)** - 客户端动态渲染
- **Streaming SSR** - 流式渲染与延迟数据加载
- **Static Site Generation (SSG)** - 构建时静态生成
- **Pages Functions** - Edge 和 Node.js 无服务器函数
- **现代化 UI** - 基于 Tailwind CSS 的精美界面

## 🛠️ 技术栈

- **React Router v7** - 全栈 React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **Vite** - 构建工具

## 📦 安装

```bash
# 克隆项目
git clone <repository-url>
cd react-router-v7-demo

# 安装依赖
npm install

# 启动开发服务器
edgeone pages dev

# 部署项目
edgeone pages deploy
```

进一步了解 [EdgeOne CLI](https://pages.edgeone.ai/document/edgeone-cli)。

## 🎯 页面说明

### 首页 (/)

展示项目概览和各个功能模块的入口。

### SSR (/ssr)

演示服务器端渲染：

- 每次请求都在服务器端重新渲染
- 实时数据获取
- SEO 友好
- 适合动态内容

### CSR (/csr)

演示客户端渲染：

- 所有渲染在浏览器中进行
- JavaScript 加载后获取数据
- 丰富的交互体验
- 降低服务器负载
- 适合交互式应用

### Streaming (/streaming)

演示流式 SSR：

- 渐进式渲染与延迟数据加载
- 快速数据随 HTML 外壳立即发送
- 慢速数据在可用时流式传输
- 使用 Suspense 边界优化用户体验
- 同时支持 SSR 和客户端导航

### Pre-render (/prerender)

演示静态站点生成：

- 构建时预生成页面
- 最快的加载速度
- CDN 友好
- 适合静态内容

### Pages Functions (/pages-functions)

演示 EdgeOne Pages Functions：

- **Edge Functions** - 3200+ 全球边缘节点超低延迟
- **Node Functions** - 完整的 Node.js 运行时与 npm 生态
- 无服务器架构，自动扩缩容
- 完美适配 API 和后端逻辑

## 📁 项目结构

```
app/
├── components/          # 组件
│   ├── ui/             # UI 组件
│   ├── layout/         # 布局组件
│   ├── Header.tsx      # 头部导航
│   ├── Hero.tsx        # 首页 Hero 区域
│   ├── Features.tsx    # 功能展示
│   └── FeatureCard.tsx # 功能卡片
├── lib/                # 工具函数
│   └── utils.ts        # 通用工具
├── routes/             # 路由页面
│   ├── home.tsx        # 首页
│   ├── ssr.tsx         # SSR 演示
│   ├── csr.tsx         # CSR 演示
│   ├── streaming.tsx   # 流式 SSR 演示
│   ├── prerender.tsx   # Pre-render 演示
│   └── pages-functions.tsx    # Pages Functions 演示
├── app.css             # 全局样式
├── root.tsx            # 根组件
└── routes.ts           # 路由配置
edge-functions/         # Edge 运行时函数
node-functions/         # Node.js 运行时函数
public/                 # 静态资源
```

## 📚 学习资源

- [EdgeOne Pages 官方文档](https://pages.edgeone.ai/document/framework-freact-router)
- [React Router v7 官方文档](https://reactrouter.com/home)
- [React Router v7 GitHub](https://github.com/remix-run/react-router)
- [Vite 文档](https://vite.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
