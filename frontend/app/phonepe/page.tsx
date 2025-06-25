'use client'

import { useRouter } from 'next/navigation'
import { PhonePeAnalysisView } from '../components/StatementAnalysis'
import { useState, useRef, useCallback, useEffect } from 'react'
import { AnalysisState, AnalysisResult, View } from '../components/StatementAnalysis'

export default function PhonePePage() {
  const router = useRouter()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeStatement = useCallback(async (file: File) => {
    try {
      setAnalysisState('analyzing');
      console.log('Starting analysis for file:', file?.name);
      
      const formData = new FormData();
      formData.append('file', file);

      console.log('Making POST request to /api/analyze-phonepe.');
      const response = await fetch('/api/analyze-phonepe', {
        method: 'POST',
        body: formData,
      });

      console.log('Received response from API:', response.status);
      const data = await response.json();
      console.log('API Response Data:', data);

      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Analysis failed';
        console.error('API returned an error:', errorMessage);
        throw new Error(errorMessage);
      }

      const results: AnalysisResult = {
        ...data,
        pageCount: data.pageCount || 0
      };
      console.log('Setting analysis results:', results);
      setAnalysisResults(results);
      setAnalysisState('results');
      console.log('Analysis Results Transactions:', results.transactions);

    } catch (error: any) {
      console.error('Error analyzing statement:', error);
      const errorMessage = error.message.includes('No transactions found')
        ? 'No transactions could be found in this PDF. Please make sure this is a valid PhonePe statement and try again.'
        : 'Failed to analyze statement. Please make sure this is a valid PDF statement and try again.';
      alert(errorMessage);
      setAnalysisState('upload');
      setAnalysisResults(null);
    }
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name);
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      await analyzeStatement(file);
    } else {
      alert('Please select a valid PDF file');
      setSelectedFile(null);
      setAnalysisState('upload');
      setAnalysisResults(null);
    }
    if (event.target) {
      event.target.value = '';
    }
  }, [analyzeStatement]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files?.[0];
    console.log('File dropped:', file?.name);
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      await analyzeStatement(file);
    } else {
      alert('Please drop a valid PDF file');
      setSelectedFile(null);
      setAnalysisState('upload');
      setAnalysisResults(null);
    }
  }, [analyzeStatement]);

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center">
      <PhonePeAnalysisView 
        setCurrentView={() => router.push('/')}
        selectedFile={selectedFile}
        analysisState={analysisState}
        analysisResults={analysisResults}
        handleFileSelect={handleFileSelect}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
      />
      <div className="mt-6 p-3 rounded-lg bg-yellow-900/40 text-yellow-300 text-center font-medium w-fit mx-auto">
        PDF page limit is <span className="font-bold">50</span>. If your statement has more than 50 pages, please upgrade to the <span className="font-bold">Pro version</span>.
      </div>
    </div>
  )
} 