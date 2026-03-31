import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KnowledgeManager from "./KnowledgeManager";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 管理员权限验证
  if (user.email !== process.env.ADMIN_EMAIL) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">无访问权限</p>
      </div>
    );
  }

  // 并行拉取统计数据
  const [
    { count: docCount },
    { count: analysisCount },
    { data: docs },
    { data: recentAnalyses },
  ] = await Promise.all([
    supabase.from("knowledge_docs").select("*", { count: "exact", head: true }),
    supabase.from("analyses").select("*", { count: "exact", head: true }),
    supabase.from("knowledge_docs").select("id, title, created_at").order("created_at", { ascending: false }),
    supabase.from("analyses").select("id, created_at, report_data").order("created_at", { ascending: false }).limit(5),
  ]);

  // 本月用量
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: monthCount } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart.toISOString());

  const stats = [
    { label: "知识库文档", value: String(docCount ?? 0),   color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "分析报告",   value: String(analysisCount ?? 0), color: "text-orange-600", bg: "bg-orange-50" },
    { label: "本月用量",   value: String(monthCount ?? 0),  color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
        <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
          Admin
        </span>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(item => (
          <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 知识库管理（客户端组件，支持上传/删除） */}
      <KnowledgeManager initialDocs={docs ?? []} />

      {/* 近期报告 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">近期分析报告</h2>
        {!recentAnalyses || recentAnalyses.length === 0 ? (
          <div className="border-2 border-dashed border-gray-100 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400">暂无报告记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAnalyses.map((item) => {
              const findings = item.report_data?.findings ?? [];
              const redCount = findings.filter((f: { status: string }) => f.status === "red").length;
              return (
                <a key={item.id} href={`/report/${item.id}`}
                   className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl
                              hover:bg-blue-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      {new Date(item.created_at).toLocaleString("zh-CN", {
                        month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {item.report_data?.summary ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {findings.length} 项
                    </span>
                    {redCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {redCount} 红
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
