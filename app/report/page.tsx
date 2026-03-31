import Link from "next/link";

const TRAFFIC_LIGHTS = [
  {
    status: "red",
    area: "颈椎",
    desc: "前倾角度超出正常范围约 15°，存在明显「头前倾」",
    action: "建议立即停止高冲击运动，尽快咨询骨科医生",
  },
  {
    status: "yellow",
    area: "骨盆",
    desc: "骨盆前倾约 10°，腰椎前凸偏大，核心肌群明显薄弱",
    action: "需重点进行核心稳定性训练，避免久坐超过 1 小时",
  },
  {
    status: "yellow",
    area: "肩部",
    desc: "右肩高于左肩约 2 cm，存在高低肩",
    action: "进行斜方肌拉伸与肩胛骨稳定性训练",
  },
  {
    status: "green",
    area: "膝关节",
    desc: "膝关节对位良好，无明显内外翻",
    action: "维持当前状态，运动时注意膝关节保护",
  },
] as const;

const REHAB_ITEMS = [
  {
    no: 1,
    name: "胸椎伸展（猫牛式）",
    freq: "每天 2 次，每次 10 组",
    goal: "改善胸椎后凸，缓解头前倾",
    duration: "持续 4 周",
  },
  {
    no: 2,
    name: "髂腰肌拉伸（弓步拉伸）",
    freq: "每天 3 次，每侧保持 30 秒",
    goal: "放松紧张髂腰肌，纠正骨盆前倾",
    duration: "持续 6 周",
  },
  {
    no: 3,
    name: "肩胛骨回缩训练（弹力带划船）",
    freq: "每天 1 次，3 组 × 15 次",
    goal: "激活中下斜方肌，改善高低肩",
    duration: "持续 8 周",
  },
];

const STATUS_CFG = {
  red:    { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500",    badge: "bg-red-100 text-red-700",       label: "需立即关注" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700", label: "需重点康复" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500",  badge: "bg-green-100 text-green-700",   label: "状态良好"   },
} as const;

export default function ReportPage() {
  return (
    <div className="space-y-4 pb-10">

      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <Link href="/"
              className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
        <button className="flex items-center gap-2 bg-gray-800 text-white text-sm
                           px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                     01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          导出 PDF
        </button>
      </div>

      {/* 报告头部 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">体态分析报告</h1>
            <p className="text-sm text-gray-400 mt-0.5">分析时间：2025-01-15 14:30</p>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
            报告 #001
          </span>
        </div>
        {/* 摘要数字 */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-2">
            <div className="text-lg font-bold text-gray-800">3</div>
            <div className="text-xs text-gray-400">发现问题</div>
          </div>
          <div className="bg-red-50 rounded-xl p-2">
            <div className="text-lg font-bold text-red-600">1</div>
            <div className="text-xs text-gray-400">高风险</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-2">
            <div className="text-lg font-bold text-yellow-600">2</div>
            <div className="text-xs text-gray-400">中风险</div>
          </div>
        </div>
      </div>

      {/* 红绿灯预警 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">风险预警</h2>
        <div className="space-y-3">
          {TRAFFIC_LIGHTS.map(item => {
            const c = STATUS_CFG[item.status];
            return (
              <div key={item.area}
                   className={`rounded-xl border p-3.5 ${c.bg} ${c.border}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                  <span className="font-semibold text-gray-800 text-sm">{item.area}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                    {c.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 pl-4 leading-relaxed">{item.desc}</p>
                <p className="text-xs text-gray-400 pl-4 mt-1">建议：{item.action}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 康复动作 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">康复动作建议</h2>
        <div className="space-y-3">
          {REHAB_ITEMS.map(item => (
            <div key={item.no} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center
                              shrink-0 text-white font-bold text-sm">
                {item.no}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                <p className="text-xs text-blue-600 mt-0.5">{item.freq}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.goal}</p>
                <p className="text-xs text-gray-300 mt-0.5">疗程：{item.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-300 text-center px-4 leading-relaxed">
        本报告由 AI 辅助生成，仅供参考，不构成医疗诊断。如有不适请咨询专业医生。
      </p>
    </div>
  );
}
