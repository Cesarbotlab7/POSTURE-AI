import Link from "next/link";

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0
             00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "专业体态报告",
    desc: "红绿灯风险预警 + 结构化康复建议，媲美专业评估",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0
             00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "隐私本地保护",
    desc: "人脸打码在您设备本地完成，原始照片从不上传",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3
             6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168
             5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477
             18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "专业知识库加持",
    desc: "管理员可上传私有康复文献，AI 优先参考专业资料",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0
             002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0
             002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "干预前后对比",
    desc: "登录后保存历史报告，随时查看康复进展",
  },
];

const STEPS = [
  { no: "1", label: "拍摄 4 张体态照片", sub: "正面、背面、左侧、右侧" },
  { no: "2", label: "可选填写主诉病史", sub: "帮助 AI 给出更精准建议" },
  { no: "3", label: "AI 综合分析", sub: "约 15–30 秒生成报告" },
  { no: "4", label: "获取康复方案", sub: "支持导出 PDF 保存" },
];

export default function LandingPage() {
  return (
    <div className="space-y-12 pb-12">

      {/* Hero */}
      <section className="text-center pt-8 pb-4 space-y-5">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600
                        text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          AI 驱动 · 专业体���分析
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          上传照片<br />
          <span className="text-blue-600">30 秒获取康复方案</span>
        </h1>
        <p className="text-gray-400 text-base max-w-sm mx-auto leading-relaxed">
          专业级肌骨评估 + AI 知识库，帮助患者和康复师快速发现体态问题、制定训练计划
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/analyze"
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold
                       text-base hover:bg-blue-700 active:scale-95 transition-all shadow-md"
          >
            立即免费体验
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 px-8 py-3.5 rounded-xl font-semibold
                       text-base border border-gray-200 hover:border-blue-300
                       hover:text-blue-600 transition-all"
          >
            登录 / 注册
          </Link>
        </div>
        <p className="text-xs text-gray-300">无需注册即可体验 · 登录后报告永久保存</p>
      </section>

      {/* 功能特性 */}
      <section>
        <h2 className="text-center text-lg font-bold text-gray-700 mb-5">为什么选择 PostureAI</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                                    flex gap-4 items-start">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center
                              text-blue-600 shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 使用流程 */}
      <section>
        <h2 className="text-center text-lg font-bold text-gray-700 mb-5">4 步完成分析</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                                    text-center space-y-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center
                              text-white font-bold text-base mx-auto">
                {s.no}
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-snug">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">准备好了吗？</h2>
        <p className="text-blue-100 text-sm">上传照片，30 秒后查看你的专属体态报告</p>
        <Link
          href="/analyze"
          className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl
                     font-semibold text-base hover:bg-blue-50 active:scale-95
                     transition-all shadow-md"
        >
          开始体态分析
        </Link>
      </section>

    </div>
  );
}
