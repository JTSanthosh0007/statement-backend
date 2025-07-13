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

  // Function to get simulated demo data
  const getSimulatedData = () => {
    console.log("Generating simulated data");
    return {
      transactions: [
        { date: new Date().toISOString().split('T')[0], particulars: 'Salary Credit', deposits: 45000, withdrawals: 0, balance: 45000, category: 'Income' },
        { date: new Date().toISOString().split('T')[0], particulars: 'Amazon Shopping', deposits: 0, withdrawals: 3500, balance: 41500, category: 'Shopping' },
        { date: new Date().toISOString().split('T')[0], particulars: 'Grocery Store Purchase', deposits: 0, withdrawals: 2800, balance: 38700, category: 'Groceries' },
        { date: new Date().toISOString().split('T')[0], particulars: 'Mobile Bill Payment', deposits: 0, withdrawals: 999, balance: 37701, category: 'Bills & Utilities' },
        { date: new Date().toISOString().split('T')[0], particulars: 'Restaurant Dining', deposits: 0, withdrawals: 1200, balance: 36501, category: 'Food & Dining' },
        { date: new Date().toISOString().split('T')[0], particulars: 'Movie Tickets', deposits: 0, withdrawals: 800, balance: 35701, category: 'Entertainment' }
      ],
      summary: {
        totalReceived: 45000,
        totalSpent: -9299,
        balance: 35701,
        creditCount: 1,
        debitCount: 5,
        totalTransactions: 6,
        highestAmount: 45000,
        lowestAmount: -3500,
        highestTransaction: { date: new Date().toISOString().split('T')[0], particulars: 'Salary Credit', deposits: 45000, withdrawals: 0, balance: 45000, category: 'Income' },
        lowestTransaction: { date: new Date().toISOString().split('T')[0], particulars: 'Amazon Shopping', deposits: 0, withdrawals: 3500, balance: 41500, category: 'Shopping' }
      },
      categoryBreakdown: {
        'Income': { amount: 45000, count: 1, percentage: 82.9 },
        'Shopping': { amount: 3500, count: 1, percentage: 6.4 },
        'Groceries': { amount: 2800, count: 1, percentage: 5.2 },
        'Bills & Utilities': { amount: 999, count: 1, percentage: 1.8 },
        'Food & Dining': { amount: 1200, count: 1, percentage: 2.2 },
        'Entertainment': { amount: 800, count: 1, percentage: 1.5 }
      },
      pageCount: 1,
      accounts: [],
      note: 'This is simulated demo data'
    };
  };

  const analyzeStatement = useCallback(
    async (file: File) => {
      try {
        // Always proceed with analysis regardless of the backend status test
        setAnalysisState("analyzing");
        console.log("Starting Canara statement analysis");

        // Maximum of 2 retries for API calls
        const MAX_RETRIES = 1;
        let retries = 0;
        let success = false;

        while (retries <= MAX_RETRIES && !success) {
          try {
            const formData = new FormData();
            formData.append("file", file);

            console.log(`Sending file to analyze-canara API: ${file.name}, size: ${file.size}`);

            // Try different API endpoints in case one is working
            const apiEndpoints = [
              '/api/analyze-canara',  // Try local API route first (from API routes folder)
              config.apiPaths.analyzeCanara,  // Then try configured path
              'https://demo-bl6p.onrender.com/analyze-canara'  // Finally try direct backend URL
            ];

            // Set a timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            // Try each endpoint until one works
            let response = null;
            for (const endpoint of apiEndpoints) {
              try {
                console.log(`Attempting request to ${endpoint}...`);
                response = await fetch(endpoint, {
                  method: "POST",
                  body: formData,
                  signal: controller.signal
                });

                if (response.ok) {
                  console.log(`Successful response from ${endpoint}`);
                  break; // Exit the loop if we got a successful response
                } else {
                  console.log(`Failed response from ${endpoint}: ${response.status}`);
                }
              } catch (endpointError) {
                console.log(`Error with endpoint ${endpoint}:`, endpointError);
                // Continue to next endpoint
              }
            }

            clearTimeout(timeoutId);

            if (!response || !response.ok) {
              throw new Error("All API endpoints failed");
            }

            const data = await response.json();
            console.log("Analysis results:", data);

            if (!data || !data.transactions || data.transactions.length === 0) {
              throw new Error("No transactions found in the statement");
            }

            setAnalysisResults(data);
            setAnalysisState("results");
            success = true;
          } catch (fetchError: any) {
            if (fetchError.name === 'AbortError') {
              console.log("Request timed out, retrying...");
            } else {
              console.log("API error, retrying...", fetchError);
            }
            retries++;

            // If this was our last retry, we'll fall through to the catch block
            if (retries > MAX_RETRIES) {
              throw fetchError;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error: any) {
        console.error("Analysis error:", error);

        // Use simulated data instead of showing an error
        console.log("Using simulated demo data after API failure");
        const demoData = getSimulatedData();
        setAnalysisResults(demoData);
        setAnalysisState("results");

        // Just show a warning toast instead of an error alert
        const warningMessage = document.createElement('div');
        warningMessage.style.position = 'fixed';
        warningMessage.style.top = '10px';
        warningMessage.style.left = '50%';
        warningMessage.style.transform = 'translateX(-50%)';
        warningMessage.style.backgroundColor = 'rgba(234, 179, 8, 0.9)';
        warningMessage.style.color = 'black';
        warningMessage.style.padding = '10px 20px';
        warningMessage.style.borderRadius = '5px';
        warningMessage.style.zIndex = '1000';
        warningMessage.textContent = 'Using demo data - Backend service unavailable';
        document.body.appendChild(warningMessage);

        setTimeout(() => {
          warningMessage.style.opacity = '0';
          warningMessage.style.transition = 'opacity 0.5s';
          setTimeout(() => document.body.removeChild(warningMessage), 500);
        }, 5000);
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
