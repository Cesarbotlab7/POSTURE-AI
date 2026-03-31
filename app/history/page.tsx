import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HistoryList from "./HistoryList";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("analyses")
    .select("id, created_at, report_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">历史记录</h1>
        <a
          href="/"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg
                     hover:bg-blue-700 transition-colors"
        >
          新建分析
        </a>
      </div>

      <HistoryList records={data ?? []} />
    </div>
  );
}
