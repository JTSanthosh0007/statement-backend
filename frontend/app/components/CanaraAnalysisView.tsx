import React, { useState, useEffect } from 'react';
import { View, AnalysisResult } from '../components/StatementAnalysis';
import AccountAnalysis from './AccountAnalysis';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

// Fix: Add index signature to CATEGORY_COLORS for string keys
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#22C55E', 'Groceries': '#FBBF24', 'Shopping': '#F59E42', 'Subscriptions': '#FFB300',
  'Kids': '#FF69B4', 'Home Improvement': '#8D6E63', 'Festivals & Gifts': '#FFD700', 'Travel Insurance': '#00B8D4',
  'Charity & Social': '#6D4C41', 'Dining Out': '#FF7043', 'Fitness & Sports': '#43A047', 'Electronics & Gadgets': '#7E57C2',
  'Beauty & Wellness': '#EC407A', 'Automobile': '#455A64', 'Stationery & Books': '#8D6E63', 'Transportation': '#06B6D4',
  'Bills & Utilities': '#3B82F6', 'Health & Medical': '#10B981', 'Education': '#FACC15', 'Travel': '#F472B6',
  'Personal Care': '#E879F9', 'Pets': '#A3E635', 'Investments': '#F87171', 'Insurance': '#6366F1', 'Rent': '#A855F7',
  'EMI & Loans': '#FB7185', 'Gifts & Donations': '#F472B6', 'Taxes & Fees': '#64748B', 'Transfer': '#8B5CF6', 'Others': '#94A3B8',
  'Bills': '#3B82F6', 'Entertainment': '#EF4444', 'Food': '#22C55E', 'Salary': '#A855F7', 'Health': '#10B981', 'Utilities': '#64748B', 'Default': '#64748B',
};

// Add a shared TransactionSummaryCard component (copied from StatementAnalysis.tsx)
const TransactionSummaryCard: React.FC<{ summary: any; pageCount: number }> = ({ summary, pageCount }) => (
  <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
    <h3 className="text-lg font-medium text-white mb-4">Transaction Summary</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-zinc-800/50 p-4 rounded-xl">
        <p className="text-sm text-zinc-400">Total Received (CR)</p>
        <p className="text-xl font-medium text-green-400">₹{(summary?.totalReceived ?? 0).toLocaleString()}</p>
      </div>
      <div className="bg-zinc-800/50 p-4 rounded-xl">
        <p className="text-sm text-zinc-400">Total Spent (DR)</p>
        <p className="text-xl font-medium text-red-400">₹{Math.abs(summary?.totalSpent ?? 0).toLocaleString()}</p>
      </div>
      <div className="bg-zinc-800/50 p-4 rounded-xl">
        <p className="text-sm text-zinc-400">Total Amount</p>
        <p className="text-xl font-medium text-white">₹{((summary?.totalReceived ?? 0) + Math.abs(summary?.totalSpent ?? 0)).toLocaleString()}</p>
      </div>
    </div>
    <div className="flex justify-between items-center mt-1">
      <p className="text-xs text-zinc-500">Total {summary?.totalTransactions} transactions</p>
      <p className="text-xs text-zinc-500">{pageCount} pages</p>
    </div>
    <div className="grid grid-cols-2 gap-2 mt-4">
      <div className="bg-zinc-800/50 p-3 rounded-xl flex flex-col items-center">
        <span className="text-xs text-zinc-400">Total Credit Transactions</span>
        <span className="text-lg font-bold text-green-400">{summary?.creditCount ?? 0}</span>
      </div>
      <div className="bg-zinc-800/50 p-3 rounded-xl flex flex-col items-center">
        <span className="text-xs text-zinc-400">Total Debit Transactions</span>
        <span className="text-lg font-bold text-red-400">{summary?.debitCount ?? 0}</span>
      </div>
    </div>
  </div>
);

export const CanaraAnalysisView: React.FC<{
  setCurrentView: (view: View) => void;
  selectedFile: File | null;
  analysisState: string;
  analysisResults: AnalysisResult | null;
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
    const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'doughnut'>('pie');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Chart data
    const sortedCategories = analysisResults?.categoryBreakdown ? Object.entries(analysisResults.categoryBreakdown).sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount)) : [];
    const chartLabels = sortedCategories.map(([cat]) => cat);
    const chartAmounts = sortedCategories.map(([, v]) => Math.abs(v.amount));
    const chartColors = chartLabels.map((cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.Default);
    const chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'Amount Spent',
          data: chartAmounts,
          backgroundColor: chartColors,
          borderColor: chartColors,
          borderWidth: 1,
        },
      ],
    };

    console.log("analysisResults", analysisResults);
    console.log("categoryBreakdown", analysisResults?.categoryBreakdown);
    console.log("transactions", analysisResults?.transactions);

    return (
      <div className="min-h-screen bg-black flex flex-col items-center">
        {/* Header */}
        <div className="w-full max-w-xl flex items-center gap-3 p-4">
          <button
            onClick={() => setCurrentView && setCurrentView('home')}
            className="text-white hover:text-zinc-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Canara Bank Statement Analysis</h1>
        </div>
        {/* Upload Card */}
        <div className="w-full max-w-xl">
          {analysisState === 'upload' && (
            <div className="bg-zinc-900/80 rounded-3xl p-8 border-2 border-[#FFD600]/60 shadow-lg max-w-md mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#009DDC]/80 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Upload Statement</h3>
                <p className="text-[#009DDC] text-base mb-6">Upload your Canara bank statement to analyze your spending patterns</p>
                <div
                  className="border-2 border-dashed border-[#FFD600]/60 rounded-2xl p-8 text-center cursor-pointer hover:border-[#FFD600] bg-zinc-800/60 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('canara-upload')?.click()}
                >
                  <input
                    id="canara-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    ref={fileInputRef as any}
                    className="hidden"
                  />
                  <svg className="w-8 h-8 text-[#009DDC] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 0l-4 4m4-4l4 4" />
                  </svg>
                  <button
                    type="button"
                    className="mt-2 px-6 py-3 bg-[#FFD600] text-black rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                    onClick={() => document.getElementById('canara-upload')?.click()}
                  >
                    Select the PDF file
                  </button>
                  <p className="text-[#009DDC] text-sm mt-2">or click to browse</p>
                </div>
              </div>
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
              {/* Summary Card */}
              <TransactionSummaryCard summary={analysisResults.summary} pageCount={analysisResults.pageCount} />

              {/* Highest/Lowest Transaction */}
              {analysisResults.summary?.highestTransaction && (
                <div className="bg-zinc-800/50 rounded-2xl p-4 mb-4">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Highest Transaction</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{analysisResults.summary.highestTransaction.description || 'N/A'}</p>
                      <p className="text-sm text-zinc-400">{new Date(analysisResults.summary.highestTransaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-lg font-bold text-green-400">₹{analysisResults.summary.highestAmount?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              )}
              {analysisResults.summary?.lowestTransaction && (
                <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Lowest Transaction</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{analysisResults.summary.lowestTransaction.description || 'N/A'}</p>
                      <p className="text-sm text-zinc-400">{new Date(analysisResults.summary.lowestTransaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-lg font-bold text-red-400">₹{Math.abs(analysisResults.summary.lowestAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Charts */}
              {mounted && analysisResults.categoryBreakdown && Object.keys(analysisResults.categoryBreakdown).length > 0 && (
                <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                  <h3 className="text-lg font-medium text-white mb-4">Spending Analysis</h3>
                  <div className="flex space-x-2 mb-4">
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                      onClick={() => setSelectedChartType('pie')}
                    >
                      Pie Chart
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                      onClick={() => setSelectedChartType('bar')}
                    >
                      Bar Chart
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'doughnut' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                      onClick={() => setSelectedChartType('doughnut')}
                    >
                      Doughnut
                    </button>
                  </div>
                  {/* Chart Display */}
                  {selectedChartType === 'pie' && (
                    <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                      <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                      <div className="h-64">
                        {chartData && chartData.labels && chartData.labels.length > 0 && (
                          <Chart data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white', font: { size: 16, weight: 'bold' }, padding: 30, boxWidth: 30, boxHeight: 20 } }, tooltip: { callbacks: { label: function (context: any) { const label = context.label || ''; const value = context.parsed; return `${label}: ₹${Number(value).toLocaleString()}`; } } } } }} />
                        )}
                      </div>
                    </div>
                  )}
                  {selectedChartType === 'doughnut' && (
                    <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                      <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                      <div className="h-64">
                        {chartData && chartData.labels && chartData.labels.length > 0 && (
                          <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white', font: { size: 16 }, padding: 30 } }, tooltip: { callbacks: { label: function (context: any) { return `${context.label}: ${context.parsed.toFixed(1)}%`; } } } } }} />
                        )}
                      </div>
                    </div>
                  )}
                  {selectedChartType === 'bar' && (
                    <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                      <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                      <div className="h-64">
                        {chartData && chartData.labels && chartData.labels.length > 0 && (
                          <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (context: any) { const label = context.label || ''; const value = context.parsed.y; return `${label}: ₹${Number(value).toLocaleString()}`; } } } } }} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };