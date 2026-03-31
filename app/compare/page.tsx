import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReportData } from "@/components/ReportView";

const STATUS_CFG = {
  red:    { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500",    badge: "bg-red-100 text-red-700",       label: "需立即关注" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700", label: "需重点康复" },
  green:  { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500",  badge: "bg-green-100 text-green-700",   label: "状态良好"   },
} as const;

function MiniReport({
  report,
  createdAt,
  label,
}: {
  report: ReportData;
  createdAt: string;
  label: string;
}) {
  const redCount    = report.findings.filter(f => f.status === "red").length;
  const yellowCount = report.findings.filter(f => f.status === "yellow").length;

  return (
    <div className="space-y-3">
      {/* 标签 + 日期 */}
      <div className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-center">
        <p className="text-xs font-bold opacity-80">{label}</p>
        <p className="text-sm font-semibold mt-0.5">
          {new Date(createdAt).toLocaleDateString("zh-CN", {
            year: "numeric", month: "2-digit", day: "2-digit",
          })}
        </p>
      </div>

      {/* 数字摘要 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl p-2">
          <div className="text-base font-bold text-gray-800">{report.findings.length}</div>
          <div className="text-xs text-gray-400">发现</div>
        </div>
        <div className="bg-red-50 rounded-xl p-2">
          <div className="text-base font-bold text-red-600">{redCount}</div>
          <div className="text-xs text-gray-400">高风险</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-2">
          <div className="text-base font-bold text-yellow-600">{yellowCount}</div>
          <div className="text-xs text-gray-400">中风险</div>
        </div>
      </div>

      {/* 摘要 */}
      {report.summary && (
        <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl p-3">
          {report.summary}
        </p>
      )}

      {/* 风险项 */}
      <div className="space-y-2">
        {report.findings.map((item, i) => {
          const c = STATUS_CFG[item.status] ?? STATUS_CFG.green;
          return (
            <div key={i} className={`rounded-xl border p-3 ${c.bg} ${c.border}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                <span className="font-semibold text-gray-800 text-xs">{item.area}</span>
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>
                  {c.label}
                </span>
              </div>
              <p className="text-xs text-gray-600 pl-3.5 leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  if (!a || !b) redirect("/history");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 并行拉取两份报告
  const [{ data: recA }, { data: recB }] = await Promise.all([
    supabase.from("analyses").select("id, created_at, report_data").eq("id", a).eq("user_id", user.id).single(),
    supabase.from("analyses").select("id, created_at, report_data").eq("id", b).eq("user_id", user.id).single(),
  ]);

  if (!recA || !recB) redirect("/history");

  return (
    <div className="space-y-4 pb-10">

      {/* 顶部 */}
      <div className="flex items-center justify-between">
        <Link href="/history"
              className="text-sm text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回历史
        </Link>
        <h1 className="text-base font-bold text-gray-800">干预前后对比</h1>
        <div className="w-16" />
      </div>

      {/* 双栏对比 */}
      <div className="grid grid-cols-2 gap-3">
        <MiniReport report={recA.report_data} createdAt={recA.created_at} label="干预前" />
        <MiniReport report={recB.report_data} createdAt={recB.created_at} label="干预后" />
      </div>

      <p className="text-xs text-gray-300 text-center px-4 leading-relaxed">
        本报告由 AI 辅助生成，仅供参考，不构成医疗诊断。
      </p>
    </div>
  );
}
