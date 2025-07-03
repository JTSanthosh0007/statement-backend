"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { CanaraAnalysisView } from "../components/CanaraAnalysisView";
import config from "../config";

export default function CanaraBankPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<string>("upload");
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test frontend API route on page load
  useEffect(() => {
    const testApiRoute = async () => {
      try {
        console.log("Testing API route...");
        const response = await fetch('/api/analyze-canara-test');
        if (response.ok) {
          console.log("API route is working");
          setBackendStatus('online');
        } else {
          console.error("API route test failed:", await response.json());
          setBackendStatus('offline');
        }
      } catch (error) {
        console.error("API route test error:", error);
        setBackendStatus('offline');
      }
    };

    testApiRoute();
  }, []);

  const analyzeStatement = useCallback(
    async (file: File) => {
      try {
        // Always proceed with analysis regardless of the backend status test
        setAnalysisState("analyzing");
        console.log("Starting Canara statement analysis");

        const formData = new FormData();
        formData.append("file", file);

        console.log(`Sending file to analyze-canara API: ${file.name}, size: ${file.size}`);

        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        try {
          const response = await fetch(`/api/analyze-canara`, {
            method: "POST",
            body: formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            throw new Error(errorData.details || errorData.error || "Analysis failed");
          }

          const data = await response.json();
          console.log("Analysis results:", data);

          if (!data || !data.transactions || data.transactions.length === 0) {
            throw new Error("No transactions found in the statement");
          }

          setAnalysisResults(data);
          setAnalysisState("results");
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            throw new Error("Request timed out. Please try again later.");
          }
          throw fetchError;
        }
      } catch (error: any) {
        console.error("Analysis error:", error);
        alert(
          error.message?.includes("No transactions found")
            ? "No transactions could be found in this PDF. Please make sure this is a valid Canara Bank statement and try again."
            : error.message?.includes("timed out")
              ? "The request timed out. The server might be busy or temporarily unavailable. Please try again later."
              : "Failed to analyze statement. Please make sure this is a valid PDF statement and try again."
        );
        setAnalysisState("upload");
        setAnalysisResults(null);
      }
    },
    [setAnalysisState, setAnalysisResults]
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "application/pdf") {
        setSelectedFile(file);
        await analyzeStatement(file);
      } else {
        alert("Please select a valid PDF file");
        setSelectedFile(null);
        setAnalysisState("upload");
        setAnalysisResults(null);
      }
      if (event.target) {
        event.target.value = "";
      }
    },
    [analyzeStatement]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type === "application/pdf") {
        setSelectedFile(file);
        await analyzeStatement(file);
      } else {
        alert("Please drop a valid PDF file");
        setSelectedFile(null);
        setAnalysisState("upload");
        setAnalysisResults(null);
      }
    },
    [analyzeStatement]
  );

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center">
      {backendStatus === 'offline' && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-900/40 text-yellow-300 text-center font-medium w-fit mx-auto">
          ⚠️ The backend service may be unavailable, but you can still try to upload your statement.
        </div>
      )}

      <CanaraAnalysisView
        setCurrentView={() => { }}
        selectedFile={selectedFile}
        analysisState={analysisState}
        analysisResults={analysisResults}
        handleFileSelect={handleFileSelect}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
      />

      <div className="mt-6 p-3 rounded-lg bg-yellow-900/40 text-yellow-300 text-center font-medium w-fit mx-auto">
        PDF page limit is{" "}
        <span className="font-bold">50</span>. If your statement has more than 50
        pages, please upgrade to the{" "}
        <span className="font-bold">Pro version</span>.
      </div>
    </div>
  );
}
