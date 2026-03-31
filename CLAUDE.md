@AGENTS.md

---

# PostureAI — 项目上下文记忆

> 每次新对话启动时，请先完整阅读本文件，以恢复完整的项目上下文。

---

## 项目简介

**PostureAI** 是一个面向患者和专业康复师的 AI 体态分析 Web 应用，由一人公司模式开发。

**核心业务流：**
1. 用户上传 4 张体态照片（正/背/左/右）
2. 前端本地用 Canvas + face-api.js 对人脸自动打码（隐私保护）
3. 可选填写主诉与病史
4. ��用 Kimi 视觉 API（OpenAI 兼容接口）进行图像综合分析
5. 优先检索管理员上传的私有知识库（RAG），再结合 AI 自身医学知识
6. 输出带"红绿灯预警"和"康复动作建议"的结构化报告（JSON）
7. 登录用户的报告永久保存，支持历史记录查看与干预前后对比
8. 一键导出 PDF

---

## 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|----------|
| 前端框架 | Next.js (App Router) | 16.2.1 — **有 breaking changes，必须先读 `node_modules/next/dist/docs/`** |
| UI 样式 | Tailwind CSS | v4（PostCSS 插件方式，非 v3） |
| 运行时 | React | 19.2.4 |
| 后端/数据库/Auth | Supabase | `@supabase/ssr` v0.9，`@supabase/supabase-js` v2 |
| AI 视觉引擎 | Kimi（Moonshot AI）| OpenAI 兼容 SDK，`openai` v6，baseURL: `https://api.moonshot.cn/v1` |
| 人脸打码 | face-api.js | v0.22.2，TinyFaceDetector 模型存放于 `public/models/` |
| 语音识别 | 未接入 | 原计划 Whisper，Phase 3 实现为文本输入替代 |
| PDF 导出 | html2pdf.js | v0.14.0，已集成在 ReportView 组件中 |

**环境变量（`.env.local`，不提交 git）：**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
KIMI_API_KEY=
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.5
ADMIN_EMAIL=          # 管理员邮箱，用于 /admin 后台权限验证
```

---

## 数据库结构（Supabase）

### `knowledge_docs` 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| title | text | 文档标题 |
| content | text | 文档全文内容 |
| created_at | timestamptz | 上传时间 |

### `analyses` 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 关联 auth.users |
| status | text | `completed` |
| report_data | jsonb | AI 返回的完整 JSON 报告 |
| created_at | timestamptz | 分析时间 |

---

## 文件结构（关键文件）

```
posture-ai/
├── app/
│   ├── page.tsx              # 主页：4张照片上传 + 病史填写 + 提交分析
│   ├── layout.tsx            # 全局布局（顶部导航：新建分析/历史记录/后台/登录）
│   ├── globals.css           # 全局样式
│   ├── login/
│   │   └── page.tsx          # 登录/注册页（Supabase Auth，邮箱密码）
│   ├── admin/
│   │   ├── page.tsx          # 管理后台（统计卡片 + 知识库管理 + 近期报告）
│   │   └── KnowledgeManager.tsx  # 知识库上传/删除客户端组件（最大 200MB）
│   ├── report/
│   │   ├── page.tsx          # 静态报告页（硬编码示例数据，Phase 1 遗留）
│   │   ├── [id]/
│   │   │   └── page.tsx      # 动态报告页（从 Supabase 读取，校验 user_id）
│   │   └── preview/
│   │       └── page.tsx      # 临时报告页（从 sessionStorage 读取，未登录用户）
│   ├── history/
│   │   ├── page.tsx          # 历史记录列表（按时间倒序，支持勾选对比）
│   │   └── HistoryList.tsx   # 历史列表客户端组件（勾选 2 条 → 跳转对比页）
│   ├── compare/
│   │   └── page.tsx          # 干预前后对比页（双栏 MiniReport，从 URL 参数取两个 id）
│   └── api/
│       ├── analyze/
│       │   └── route.ts      # POST /api/analyze：核心 AI 分析接口（RAG + Kimi）
│       └── admin/
│           └── route.ts      # POST/DELETE /api/admin：知识库文档上传/删除
├── components/
│   ├── PostureUpload.tsx     # 图片上传组件（SVG 辅助线 + Canvas 人脸打码）
│   └── ReportView.tsx        # 报告渲染组件（红绿灯 + 康复建议 + PDF 导出）
├── lib/
│   └── supabase/
│       ├── client.ts         # 浏览器端 Supabase 客户端
│       └── server.ts         # 服务端 Supabase 客户端（RSC/Route Handler 用）
├── next.config.ts            # Next.js 配置（请求体限制 200MB）
├── public/
│   └── models/               # face-api.js TinyFaceDetector 模型文件
└── CLAUDE.md                 # 本文件
```

---

## 各阶段完成状态

### Phase 1 — UI 框架 ✅ 已完成
- 移动端优先的响应式布局
- `PostureUpload` 组件：4 个上传框 + SVG 人体轮廓辅助线（正面/背面/左侧/右侧 4 套）
- 静态报告页（`app/report/page.tsx`）：红绿灯预警卡片 + 康复动作列表

### Phase 2 — Supabase Auth + Admin ✅ 已完成
- 登录/注册页（`app/login/page.tsx`）：邮箱密码，模式切换
- Supabase SSR 客户端封装（`lib/supabase/`）
- Admin 管理后台框架（`app/admin/page.tsx`）：登录验证、统计卡片、知识库文档列表占位

### Phase 3 — 前端硬核功能 ✅ 已完成
- Canvas 人脸打码：`face-api.js` TinyFaceDetector，本地运算，马赛克效果，扩大 30% 打码区域
- 上传状态机：`idle → detecting → done/no_face`
- 病史文本框（语音转写未接入，改为直接文字输入）

### Phase 4 — AI 分析核心 ✅ 已完成
- `POST /api/analyze` 路由：接收 base64 ���片 + 病史文本
- RAG 知识库检索：从 `knowledge_docs` 拉取最新 10 篇文档注入 system prompt
- Kimi 视觉 API 调用：返回严格 JSON（summary / findings / rehab）
- 结果存 Supabase `analyses` 表（仅登录用户）
- 动态报告预览页（`app/report/preview/page.tsx`）：从 sessionStorage 读取渲染

### Phase 5 — 报告完善 + 历史对比 + PDF 导出 ✅ 已完成（2026-03-26）

- **5-A**：`app/report/[id]/page.tsx` — 从 Supabase 读取报告，校验 user_id，复用 ReportView
- **5-B**：`app/history/page.tsx` + `HistoryList.tsx` — 历史列表，勾选 2 条跳转 `/compare`
- **5-B**：`app/compare/page.tsx` — 干预前后双栏对比，并行拉取两份报告
- **5-C**：`components/ReportView.tsx` — 动态 import `html2pdf.js`，点击导出 PDF

### Phase 6 — 知识库大文件支持 ✅ 已完成（2026-03-27）

- `app/api/admin/route.ts`：文件大小限制从 5MB 提升到 **200MB**
- `app/api/analyze/route.ts`：RAG 注入时每篇文档截取前 **8000 字**，防止 prompt 超出 Kimi 上下文（全文仍完整存库）
- `next.config.ts`：`experimental.serverActions.bodySizeLimit` 设为 `"200mb"`

### Bug 修复 ✅ 已完成（2026-03-27）

- `app/report/[id]/page.tsx`：补充缺失文件，登录用户分析后可正确跳转至报告详情页
- `app/api/analyze/route.ts`：修复 `MAX_DOC_CHARS` 先用后声明的运行时错误
- `app/layout.tsx`：导航栏根据登录状态动态显示——已登录显示邮箱 + 退出按钮，未登录显示登录按钮

---

## 开发规范与注意事项

1. **Next.js 版本特殊性**：v16 有 breaking changes，写任何新代码前先查 `node_modules/next/dist/docs/`
2. **每次只做一个模块**：用户是编程初学者，代码前要用大白话解释原理
3. **移动优先**：所有 UI 优先适配手机，PC 端通过 `max-w-lg mx-auto` 居中
4. **Tailwind v4**：使用 PostCSS 插件方式，`@apply` 等用法与 v3 略有差异
5. **Supabase 服务端**：Route Handler 和 RSC 中必须使用 `lib/supabase/server.ts`，客户端组件用 `lib/supabase/client.ts`
6. **AI 模型**：当前使用 Kimi（`kimi-k2.5`），通过 `openai` SDK + 自定义 baseURL 调用
7. **人脸模型文件**：`public/models/` 中的 face-api.js 模型文件已就位，无需重新下载

---

*最后更新：2026-03-27*
