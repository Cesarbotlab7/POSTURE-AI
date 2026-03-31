import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ReportView, { type ReportData } from "@/components/ReportView";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("analyses")
    .select("id, created_at, report_data, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  return (
    <ReportView
      report={data.report_data as ReportData}
      reportId={data.id}
      createdAt={data.created_at}
      backHref="/history"
      backLabel="历史记录"
    />
  );
}
