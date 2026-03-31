"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("邮箱或密码错误，请重试");
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("Supabase signUp error:", error);
        setError(error.message.includes("already") ? "该邮箱已注册，请直接登录" : "注册失败，请重试");
      } else {
        setSuccess("注册成功！请检查邮箱完成验证，然后回来登录。");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">PostureAI</h1>
          <p className="text-sm text-gray-400 mt-1">智能体态分析平台</p>
        </div>

        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* 切换标签 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {m === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                邮箱
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                密码
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-300"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm
                              px-3.5 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            {/* 成功提示 */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm
                              px-3.5 py-2.5 rounded-xl">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm
                         hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              {loading ? "请稍候..." : mode === "login" ? "登录" : "创建账号"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          登录即代表您同意我们的服务条款与隐私政策
        </p>
      </div>
    </div>
  );
}
