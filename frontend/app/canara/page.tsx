"use client";
import React, { useState } from "react";

export default function CanaraBankPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze-canara", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze statement");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 12 }}>
      <h1 style={{ color: "#0A9396" }}>Canara Bank Statement Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button type="submit" disabled={!file || loading} style={{ marginLeft: 12 }}>
          {loading ? "Analyzing..." : "Upload & Analyze"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>Summary</h2>
          <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(result.summary, null, 2)}
          </pre>
          <h3>Transactions</h3>
          <div style={{ maxHeight: 200, overflow: "auto", fontSize: 13 }}>
            <pre>{JSON.stringify(result.transactions, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
