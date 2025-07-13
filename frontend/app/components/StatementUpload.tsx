'use client'

import React, { useState, useCallback, memo } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import config from '../config'

type Platform = 'paytm' | 'phonepe' | 'supermoney' | 'gpay'

type Transaction = {
  date: string
  amount: number
  description: string
  category: string
}

type AnalysisData = {
  transactions: Transaction[]
  totalSpent: number
  totalReceived: number
  categoryBreakdown: Record<string, number>
}

interface StatementUploadProps {
  onAnalysisComplete: (data: AnalysisData) => void
}

// Memoize the platform selector component
const PlatformSelector = memo(({ 
  selectedPlatform, 
  onSelect 
}: { 
  selectedPlatform: Platform; 
  onSelect: (platform: Platform) => void;
}) => {
  return (
    <div className="flex space-x-4 mb-6">
      {(['paytm', 'phonepe', 'gpay'] as Platform[]).map((platform) => (
        <button
          key={platform}
          onClick={() => onSelect(platform)}
          className={`px-4 py-2 rounded-lg ${
            selectedPlatform === platform
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </button>
      ))}
    </div>
  );
});

export default function StatementUpload({ onAnalysisComplete }: StatementUploadProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('paytm')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize handlers
  const handlePlatformSelect = useCallback((platform: Platform) => {
    setSelectedPlatform(platform)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      // Auto-select platform based on filename
      const fileName = selectedFile.name.toLowerCase();
      if (fileName.includes('phonepe')) {
        setSelectedPlatform('phonepe');
      } else if (fileName.includes('paytm')) {
        setSelectedPlatform('paytm');
      } else if (fileName.includes('gpay')) {
        setSelectedPlatform('gpay');
      }
      // Keep existing or default if no keyword is found
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  })

  const handleSubmit = useCallback(async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    // Determine platform from filename to ensure correctness
    let platform = selectedPlatform;
    const fileName = file.name.toLowerCase();
    if (fileName.includes('phonepe')) {
      platform = 'phonepe';
    } else if (fileName.includes('paytm')) {
      platform = 'paytm';
    } else if (fileName.includes('gpay')) {
        platform = 'gpay';
    }
    
    formData.append('platform', platform);

    try {
      // Select the appropriate API endpoint based on the determined platform
      let apiEndpoint = config.apiPaths.analyzeStatement;

      if (platform === 'phonepe') {
        apiEndpoint = config.apiPaths.analyzePhonepe;
      } else if (platform === 'paytm') {
        apiEndpoint = config.apiPaths.analyzeKotak; // Using Kotak endpoint for Paytm for now
      }

      console.log(`Submitting to platform: '${platform}' at endpoint: ${apiEndpoint}`);

      // Add a cache-busting parameter
      const finalEndpoint = `${apiEndpoint}?t=${new Date().getTime()}`;

      const response = await fetch(finalEndpoint, {
        method: 'POST',
        body: formData,
      })
      
      console.log('Received response from API:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('API Response Data:', errorData)
        throw new Error('Analysis failed')
      }
      
      const data = await response.json()
      onAnalysisComplete(data)
      
    } catch (error) {
      console.error('Error analyzing statement:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [file, selectedPlatform, onAnalysisComplete])

  // Pre-compute button classes
  const buttonClasses = `
    w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm 
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
    ${!file || isLoading
      ? 'bg-gray-300 cursor-not-allowed'
      : 'bg-primary hover:bg-primary/90 focus-visible:outline-primary'
    }
  `;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="space-y-6">
        <PlatformSelector
          selectedPlatform={selectedPlatform}
          onSelect={handlePlatformSelect}
        />

        {/* File Upload Area */}
        <div className="mt-8">
          <div
            {...getRootProps()}
            className={`
              relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none
              ${isDragActive ? 'border-primary' : 'border-gray-300'}
              ${file ? 'bg-gray-50' : 'bg-white'}
            `}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-4">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-primary" />
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    Drop your statement here, or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-gray-500">PDF or CSV files only</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!file || isLoading}
            className={buttonClasses}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Statement'}
          </button>
        </div>
      </div>
    </div>
  )
} 