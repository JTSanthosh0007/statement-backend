import React, { useState, useEffect } from 'react';
import { View, AnalysisResult } from '../components/StatementAnalysis';
import AccountAnalysis from './AccountAnalysis';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), { ssr: false });

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

export const SBIAnalysisView: React.FC<{
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

        return (
            <div className="min-h-screen bg-black flex flex-col items-center">
                {/* Header */}
                <div className="w-full max-w-xl flex items-center gap-3 p-4">
                    <button
                        onClick={() => setCurrentView('home')}
                        className="text-white hover:text-zinc-300 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-white">SBI Bank Statement Analysis</h1>
                </div>
                {/* Upload Card */}
                <div className="w-full max-w-xl">
                    {analysisState === 'upload' && (
                        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/80 rounded-3xl border border-zinc-800/50">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m9 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Upload Statement</h3>
                            <p className="text-zinc-400 text-sm mb-6">Upload your SBI bank statement to analyze your spending patterns</p>
                            <label
                                htmlFor="sbi-upload"
                                className="block w-full border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-zinc-600 transition-colors"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <input
                                    id="sbi-upload"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileSelect}
                                    ref={fileInputRef as any}
                                    className="hidden"
                                />
                                {selectedFile ? (
                                    <span className="text-[#1A73E8] font-medium">{selectedFile.name}</span>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 0l-4 4m4-4l4 4" />
                                        </svg>
                                        <p className="text-zinc-300 mb-1">Drag and drop your statement here</p>
                                        <p className="text-zinc-500 text-sm">or click to browse</p>
                                    </>
                                )}
                            </label>
                        </div>
                    )}
                    {/* The rest of the component (analyzing/results) remains unchanged, copy from CanaraAnalysisView */}
                    {analysisState === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center p-8">
                            <div className="w-16 h-16 border-4 border-[#1A73E8] border-t-white rounded-full animate-spin mb-4"></div>
                            <p className="text-white text-lg font-medium">Analyzing your statement...</p>
                            <p className="text-zinc-400 text-sm mt-2">This may take a few moments</p>
                        </div>
                    )}
                    {analysisState === 'results' && analysisResults && (
                        <div className="p-4 space-y-6">
                            {/* Account Analysis Section */}
                            {analysisResults.accounts && analysisResults.accounts.length > 0 && (
                                <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                                    <h3 className="text-lg font-medium text-white mb-4">Account Analysis</h3>
                                    <AccountAnalysis accounts={analysisResults.accounts} />
                                </div>
                            )}
                            {/* Summary Cards */}
                            <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                                <h3 className="text-lg font-medium text-white mb-4">Transaction Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="bg-zinc-800/50 p-4 rounded-xl">
                                        <p className="text-sm text-zinc-400">Total Received (CR)</p>
                                        <p className="text-xl font-medium text-green-400">₹{(analysisResults.summary?.totalReceived ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 p-4 rounded-xl">
                                        <p className="text-sm text-zinc-400">Total Spent (DR)</p>
                                        <p className="text-xl font-medium text-red-400">₹{Math.abs(analysisResults.summary?.totalSpent ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-zinc-800/50 p-4 rounded-xl">
                                        <p className="text-sm text-zinc-400">Total Amount</p>
                                        <p className="text-xl font-medium text-white">₹{((analysisResults.summary?.totalReceived ?? 0) + Math.abs(analysisResults.summary?.totalSpent ?? 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-zinc-500">Total {analysisResults.summary?.totalTransactions} transactions</p>
                                    <p className="text-xs text-zinc-500">{analysisResults.pageCount} pages</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="bg-zinc-800/50 p-3 rounded-xl flex flex-col items-center">
                                        <span className="text-xs text-zinc-400">Total Credit Transactions</span>
                                        <span className="text-lg font-bold text-green-400">{analysisResults.summary?.creditCount ?? 0}</span>
                                    </div>
                                    <div className="bg-zinc-800/50 p-3 rounded-xl flex flex-col items-center">
                                        <span className="text-xs text-zinc-400">Total Debit Transactions</span>
                                        <span className="text-lg font-bold text-red-400">{analysisResults.summary?.debitCount ?? 0}</span>
                                    </div>
                                </div>
                            </div>
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
                                        >Pie Chart</button>
                                        <button
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                                            onClick={() => setSelectedChartType('bar')}
                                        >Bar Chart</button>
                                        <button
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'doughnut' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                                            onClick={() => setSelectedChartType('doughnut')}
                                        >Doughnut</button>
                                    </div>
                                    {selectedChartType === 'pie' && (
                                        <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                                            <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                                            <div className="h-64">
                                                {chartData && chartData.labels && chartData.labels.length > 0 && (
                                                    <Chart data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white', font: { size: 12 }, padding: 20 } }, tooltip: { callbacks: { label: function (context) { const label = context.label || ''; const value = context.parsed; return `${label}: ₹${Number(value).toLocaleString()}`; } } } } }} />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedChartType === 'bar' && (
                                        <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                                            <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                                            <div className="h-64">
                                                {chartData && chartData.labels && chartData.labels.length > 0 && (
                                                    <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false, labels: { color: 'white' } } }, scales: { y: { beginAtZero: true, ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, x: { ticks: { color: 'white' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } } } }} />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedChartType === 'doughnut' && (
                                        <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                                            <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                                            <div className="h-64">
                                                {chartData && chartData.labels && chartData.labels.length > 0 && (
                                                    <Doughnut
                                                        data={chartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: { position: 'right', labels: { color: 'white', font: { size: 12 }, padding: 20 } },
                                                                tooltip: { callbacks: { label: (context: any) => `${context.label}: ${typeof context.parsed === 'number' ? context.parsed.toFixed(1) : context.parsed}%` } }
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Category Breakdown Section */}
                            {analysisResults.categoryBreakdown && Object.keys(analysisResults.categoryBreakdown).length > 0 ? (
                                <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50 mt-6">
                                    <h3 className="text-lg font-semibold text-white mb-6">Detailed Category Breakdown</h3>
                                    <div className="space-y-4">
                                        {Object.entries(analysisResults.categoryBreakdown)
                                            .sort(([, a], [, b]) => Math.abs(b.amount) - Math.abs(a.amount))
                                            .map(([category, cat], idx) => {
                                                const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
                                                return (
                                                    <div key={category} className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2 min-w-[120px]">
                                                            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                                                            <span className="text-zinc-300 font-medium">{category}</span>
                                                        </div>
                                                        <div className="flex-1 mx-2">
                                                            <div className="w-full h-2 rounded bg-zinc-800/50">
                                                                <div
                                                                    className="h-2 rounded"
                                                                    style={{ width: `${cat.percentage.toFixed(1)}%`, backgroundColor: color }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <span className="text-zinc-400 min-w-[80px] text-right">₹{Math.abs(cat.amount).toLocaleString()}</span>
                                                        <span className="text-zinc-400 min-w-[60px] text-right">{cat.percentage.toFixed(1)}%</span>
                                                        <span className="text-zinc-400 min-w-[60px] text-right">{cat.count} txns</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50 mt-6 text-zinc-400 text-center">
                                    No categories found
                                </div>
                            )}
                            {/* Recent Transactions */}
                            <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                                <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
                                <div className="space-y-4">
                                    {analysisResults.transactions?.slice(0, 5).map((transaction, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <p className="text-zinc-300">{transaction.description || ''}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-zinc-400">
                                                        {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        {(transaction.category || 'uncategorized').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>₹{Math.abs(transaction.amount ?? 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }; 