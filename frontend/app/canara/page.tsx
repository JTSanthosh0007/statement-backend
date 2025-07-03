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

  // Test backend connectivity on page load
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        console.log("Testing backend connectivity...");
        const response = await fetch('/api/analyze-canara-test');
        if (response.ok) {
          console.log("Backend is online");
          setBackendStatus('online');
        } else {
          console.error("Backend test failed:", await response.json());
          setBackendStatus('offline');
        }
      } catch (error) {
        console.error("Backend connectivity test error:", error);
        setBackendStatus('offline');
      }
    };

    testBackendConnection();
  }, []);

  const analyzeStatement = useCallback(
    async (file: File) => {
      try {
        setAnalysisState("analyzing");
        console.log("Starting Canara statement analysis");

        const formData = new FormData();
        formData.append("file", file);

        // Use the API path from config
        console.log(`Sending file to analyze-canara API: ${file.name}, size: ${file.size}`);
        const response = await fetch(`/api/analyze-canara`, {
          method: "POST",
          body: formData,
        });

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
      } catch (error: any) {
        console.error("Analysis error:", error);
        alert(
          error.message?.includes("No transactions found")
            ? "No transactions could be found in this PDF. Please make sure this is a valid Canara Bank statement and try again."
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
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 text-red-300 text-center font-medium w-fit mx-auto">
          ⚠️ The analysis service is currently unavailable. Please try again later.
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
