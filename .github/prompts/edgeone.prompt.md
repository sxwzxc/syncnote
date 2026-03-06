---
name: edgeone
description: 引导 AI 在处理与 EdgeOne Pages、Edge 函数或仓库内 Edge 运行时相关任务时，先全面理解仓库与 EdgeOne Pages 环境，然后再开始实现和修改。
---

<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->

先完整理解仓库与 EdgeOne Pages：在开始修改或实现任何功能之前，务必彻底阅读并理解项目结构、关键文件与 EdgeOne Pages 运行时约束（例如 env 参数传递、KV 绑定命名、部署限制等）。

目的
- 在需要对 EdgeOne Pages 或 Edge 函数进行修改、调试或审查时使用此提示，确保 AI 在动手前具备足够上下文以减少误改和回滚次数。

何时使用
- 修复或实现 `edge-functions`、`node-functions` 中的 API 或绑定相关逻辑。
- 需要确认 env/kv 绑定、运行时限制或部署配置的变更请求。

开始前的强制步骤（AI 必须遵循）
1. 完整理解仓库：读取并分析项目结构与关键文件（例如 `edge-functions/`, `node-functions/`, `app/`, `routes.ts`, `README.md`, `README_zh-CN.md`, `vite.config.ts` 等）。
2. 理解 EdgeOne Pages 运行环境：确认 env 参数传递方式、KV 绑定命名约定（例如 `env.notesKV`）、请求/响应限制与部署约束。
3. 列出已确认的假设与需要用户确认的项（例如缺失的 env 变量名、KV 名称、访问权限）。

推荐工作流程
- 第一步（信息收集）：列出将要读取的文件并说明理由。
- 第二步（澄清）：在信息不足时提出明确问题并等待用户回复。
- 第三步（实现）：在获得必要确认后，按照小步提交的原则实施更改，并在每步提供变更摘要与如何验证的说明。
- 第四步（验证）：运行项目中的静态检查、测试或手动验证步骤，并记录验证结果。

输入说明（可选）
- target: 要操作的目标（文件路径、功能名或 issue 描述）。
- goal: 高层目标描述（例如“修复 KV 访问错误”）。
- constraints: 约束条件（例如必须在 Edge 运行、不得改变 API 路径等）。

输出要求
- 操作步骤清单（分步骤描述）。
- 受影响文件列表（路径与变更概述）。
- 代码补丁或可直接应用的 diff（可选）。
- 验证步骤与预期结果。
 - README 更新：中文为主，保留英文版本。优先更新 `README_zh-CN.md`（若不存在则创建），并在 `README.md` 中提供对应英文说明或翻译摘要；在 README 中记录变更摘要、受影响的文件与验证步骤。

示例调用
- "修复 `edge-functions/api/notes.js` 中对 KV 的访问，确保使用 `env.notesKV`，并添加运行验证步骤。"
- "在 EdgeOne Pages 上优化 `edge-functions` 的错误处理并提供回滚指引。"

澄清问题（当信息不充分时 AI 应自动提出）
- 仓库中 EdgeOne KV 的绑定名是什么？
- 是否可以访问部署日志或 CI 来运行测试？
- 是否允许添加或修改 `.env.example` 文件以示意所需环境变量？

注意事项
- 修改 Edge 绑定或环境相关代码前请先备份原始文件并在提交信息中注明 EdgeOne 相关变更。
- 若需要新增环境变量，建议在仓库根目录添加 `.env.example` 作为占位。

- 所有对代码或运行时绑定的修改完成后，必须更新 README（中文为主，同时保留英文版本）。在 `README_zh-CN.md` 中以中文说明变更原因、使用/部署指引与回滚步骤，并在 `README.md` 中保留或新增对应的英文版（可以是翻译或要点摘要）。如需人工校对翻译，请在 PR 描述中注明。

仓库专用初始清单示例
- 首次执行时，请列出你准备阅读的文件并等待用户确认，例如：
- ["edge-functions/api/notes.js", "edge-functions/api/notes/[id].js", "README_zh-CN.md", "app/routes.ts"]

--
<!-- Tip: Use /create-prompt in chat to generate content with agent assistance -->