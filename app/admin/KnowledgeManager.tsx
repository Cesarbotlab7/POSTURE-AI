"use client";

import { useState, useRef } from "react";

interface Doc {
  id: string;
  title: string;
  created_at: string;
}

interface Props {
  initialDocs: Doc[];
}

export default function KnowledgeManager({ initialDocs }: Props) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "上传失败");

      setDocs(prev => [json.doc, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      // 清空 input，允许重复上传同名文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确认删除「${title}」？此操作不可恢复。`)) return;

    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "删除失败");
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">知识库文档</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm
                     px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent
                               rounded-full animate-spin" />
              解析中…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              上传文档
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm
                        px-3.5 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="border-2 border-dashed border-gray-100 rounded-xl p-10
                        flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                       01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">暂无知识库文档</p>
          <p className="text-xs text-gray-300 mt-1">
            支持 TXT、Markdown、PDF，单文件最大 5MB
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id}
                 className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0
                           01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString("zh-CN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.title)}
                className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded shrink-0"
                title="删除"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5
                           7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
