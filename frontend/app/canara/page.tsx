"use client";
import React, { useState, useRef } from "react";

const BACKEND_URL = "https://your-backend-url.onrender.com"; // or your deployed backend

export default function CanaraBankPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setResult(null);
    setError("");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
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
      const res = await fetch(`${BACKEND_URL}/api/analyze-canara`, {
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
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #0002" }}>
      <h1 style={{ color: "#0A9396", fontWeight: 700, fontSize: 26, marginBottom: 24 }}>Canara Bank Statement Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: "2px dashed #0A9396",
            borderRadius: 10,
            padding: 32,
            textAlign: "center",
            background: file ? "#e0f7fa" : "#f8f8f8",
            cursor: "pointer",
            marginBottom: 16,
            transition: "background 0.2s"
          }}
          onClick={handleBrowseClick}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          {file ? (
            <span style={{ color: "#0A9396", fontWeight: 500 }}>{file.name}</span>
          ) : (
            <span style={{ color: "#888" }}>Drag & drop your PDF here, or <span style={{ color: "#0A9396", textDecoration: "underline" }}>browse</span></span>
          )}
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          style={{
            background: loading ? "#b2dfdb" : "#0A9396",
            color: loading ? "#555" : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 28px",
            fontWeight: 600,
            fontSize: 16,
            cursor: !file || loading ? "not-allowed" : "pointer",
            width: "100%"
          }}
        >
          {loading ? "Analyzing..." : "Upload & Analyze"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ color: "#0A9396", fontWeight: 600 }}>Summary</h2>
          <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, fontSize: 15 }}>
            {JSON.stringify(result.summary, null, 2)}
          </pre>
          <h3 style={{ color: "#0A9396", fontWeight: 500 }}>Transactions</h3>
          <div style={{ maxHeight: 200, overflow: "auto", fontSize: 13, background: "#f6f6f6", borderRadius: 8, padding: 8 }}>
            <pre>{JSON.stringify(result.transactions, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
