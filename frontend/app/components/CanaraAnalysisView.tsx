import React, { useState, useRef, useCallback } from 'react';
import { View } from '../components/StatementAnalysis';

export const CanaraAnalysisView: React.FC<{
  setCurrentView: (view: View) => void;
  selectedFile: File | null;
  analysisState: string;
  analysisResults: any;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}> = ({
  setCurrentView,
  selectedFile,
  analysisState,
  analysisResults,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  fileInputRef
}) => {
  return (
    <div className="w-full max-w-xl bg-zinc-900/80 rounded-3xl p-8 border border-zinc-800/50 mt-12">
      <h2 className="text-2xl font-bold text-[#0A9396] mb-6 text-center">Canara Bank Statement Analyzer</h2>
      {analysisState === 'upload' && (
        <div>
          <label
            htmlFor="canara-upload"
            className="block w-full border-2 border-dashed border-[#0A9396] rounded-xl p-8 text-center cursor-pointer bg-zinc-800/40 hover:bg-zinc-800/60 transition-all"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id="canara-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              ref={fileInputRef as any}
              className="hidden"
            />
            {selectedFile ? (
              <span className="text-[#0A9396] font-medium">{selectedFile.name}</span>
            ) : (
              <span className="text-zinc-400">Drag & drop your PDF here, or <span className="underline">browse</span></span>
            )}
          </label>
        </div>
      )}
      {analysisState === 'analyzing' && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-[#0A9396] border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-medium">Analyzing your statement...</p>
          <p className="text-zinc-400 text-sm mt-2">This may take a few moments</p>
        </div>
      )}
      {analysisState === 'results' && analysisResults && (
        <div className="p-4 space-y-6">
          {/* You can add summary, charts, and transaction details here, similar to PhonePeAnalysisView */}
          <pre className="bg-zinc-800/50 rounded-xl p-4 text-white text-sm overflow-x-auto">
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
