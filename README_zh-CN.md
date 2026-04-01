# SyncNote

轻量级密码保护笔记应用，支持跨设备实时同步，基于 [EdgeOne Pages](https://pages.edgeone.ai/)（React Router v7 + EdgeOne KV）构建。

[English](./README.md)

---

## ✨ 功能特性

- **密码保护** — 使用统一共享密码访问所有笔记，登录状态保持 30 天
- **实时同步** — 通过 WebSocket 推送 + HTTP 轮询兜底，笔记变更即时同步到所有设备
- **自动保存** — 停止输入 800 ms 后自动保存，无需手动操作
- **图片附件** — 支持点击、拖拽或**粘贴**（含截图）方式添加图片
  - 双击图片可全屏预览（Lightbox）
  - 右键图片显示菜单：查看大图 / 下载 / 删除
- **天气设置** — 在设置面板可配置天气地点模式
  - 支持 **自动定位**（优先浏览器地理位置，失败时回退到 IP 位置）
  - 支持 **手动城市** 输入并保存
  - IP、位置、天气按单列展示（天气位于位置下方）
- **可拖拽调宽侧边栏** — 拖动侧边栏右边缘自由调整宽度
- **深色 / 浅色主题** — 偏好持久保存到 `localStorage`
- **中英双语 UI** — 随时切换语言，无需刷新
- **移动端友好** — 小屏设备上编辑区全屏展示，支持返回按钮

## 🛠️ 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | React Router v7（SSR） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 图标 | Lucide React |
| 构建 | Vite |
| 存储 | EdgeOne KV |
| 运行时 | EdgeOne Pages Functions（Edge + Node.js） |
| 实时通信 | WebSocket（node-functions/sync.js）+ 轮询 |

## 📦 快速开始

```bash
# 克隆仓库
git clone https://github.com/sxwzxc/syncnote.git
cd syncnote

# 安装依赖
npm install

# 启动本地开发服务器（需要 EdgeOne CLI）
edgeone pages dev
```

在 EdgeOne Pages 项目中配置以下环境变量：

| 变量 | 说明 |
|---|---|
| `PASSWORD` | 应用登录密码 |
| `notesKV` | 绑定的 KV 命名空间，用于存储笔记 |

部署：

```bash
edgeone pages deploy
```

> 更多信息：[EdgeOne CLI 文档](https://pages.edgeone.ai/document/edgeone-cli)

## 📁 项目结构

```
app/
├── routes/
│   └── home.tsx          # 笔记主界面（登录 + 编辑器 + 侧边栏）
├── components/
│   └── ui/button.tsx     # 通用按钮组件
├── lib/utils.ts           # cn() 工具函数
├── root.tsx               # 根布局
└── routes.ts              # 路由定义
edge-functions/
├── api/
│   ├── auth.js            # POST /api/auth — 密码验证
│   ├── settings.js        # GET / PUT /api/settings — 天气设置与 IP 信息
│   ├── notes.js           # GET / POST /api/notes
│   └── notes/[id].js      # GET / PUT / DELETE /api/notes/:id
node-functions/
└── sync.js                # WebSocket 服务，用于实时同步
public/                    # 静态资源
```

## 🔧 架构说明

- **KV 存储** — 每篇笔记以 UUID 为键存储为 JSON，`__index` 键维护笔记列表及元数据。
- **设置持久化** — 天气模式与手动地点通过 EdgeOne KV 保存（`/api/settings`）。
- **自动保存冲突处理** — 远端有更新时，若本地仍有待保存的修改，以本地版本为准（下次自动保存会覆盖远端）。
- **笔记大小限制** — 单篇笔记上限 25 MB（含 base64 编码图片），编辑器底部实时显示已用大小。

## 📄 许可证

MIT License

