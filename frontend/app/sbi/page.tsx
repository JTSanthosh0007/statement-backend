"use client";
import React, { useState, useRef, useCallback } from "react";
import { SBIAnalysisView } from "../components/SBIAnalysisView";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://demo-bl6p.onrender.com"; // Use deployed backend URL

export default function SBIBankPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisState, setAnalysisState] = useState<string>("upload");
    const [analysisResults, setAnalysisResults] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const analyzeStatement = useCallback(
        async (file: File) => {
            try {
                setAnalysisState("analyzing");
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch(`/api/analyze-sbi`, {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.details || data.error || "Analysis failed");
                }
                setAnalysisResults(data);
                setAnalysisState("results");
            } catch (error: any) {
                alert(
                    error.message?.includes("No transactions found")
                        ? "No transactions could be found in this PDF. Please make sure this is a valid SBI statement and try again."
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
            <SBIAnalysisView
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