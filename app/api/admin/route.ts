import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/dist/pdf-parse/cjs/index.cjs");

// 只有 ADMIN_EMAIL 才能操作
function isAdmin(email: string | undefined) {
  return email && email === process.env.ADMIN_EMAIL;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdmin(user?.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "未收到文件" }, { status: 400 });
  }

  // 文件大小限制：200MB
  if (file.size > 200 * 1024 * 1024) {
    return NextResponse.json({ error: "文件不能超过 200MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  let content = "";

  if (ext === "pdf") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);
    content = parsed.text.trim();
  } else if (ext === "txt" || ext === "md") {
    content = await file.text();
  } else {
    return NextResponse.json({ error: "仅支持 TXT、Markdown、PDF" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "文件内容为空，无法解析" }, { status: 400 });
  }

  // 标题取文件名（去掉扩展名）
  const title = file.name.replace(/\.[^.]+$/, "");

  const { data, error } = await supabase
    .from("knowledge_docs")
    .insert({ title, content })
    .select("id, title, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "保存失败：" + error.message }, { status: 500 });
  }

  return NextResponse.json({ doc: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdmin(user?.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = await request.json() as { id: string };

  const { error } = await supabase
    .from("knowledge_docs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "删除失败：" + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
