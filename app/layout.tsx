import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PostureAI - 智能体态分析",
  description: "AI 驱动的体态分析与康复建议平台",
};

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="zh">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">PostureAI</span>
            </a>
            <nav className="flex items-center gap-4 text-sm text-gray-500">
              <a href="/analyze" className="hover:text-blue-600 transition-colors">新建分析</a>
              <a href="/history" className="hover:text-blue-600 transition-colors">历史记录</a>
              <a href="/admin" className="hover:text-blue-600 transition-colors">后台</a>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 max-w-[120px] truncate hidden sm:block">
                    {user.email}
                  </span>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200
                                 transition-colors text-xs font-medium"
                    >
                      退出
                    </button>
                  </form>
                </div>
              ) : (
                <a href="/login"
                   className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700
                              transition-colors text-xs font-medium">
                  登录
                </a>
              )}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
