import { NextRequest, NextResponse } from 'next/server';
import config from '../../config';

/**
 * Handles the analysis of Canara Bank statements
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("API route handler triggered for analyze-canara");

  try {
    // Extract form data from the request
    const formData = await request.formData();

    // Validate file exists in form data
    const file = formData.get('file');
    if (!file) {
      console.error('No file found in request');
      return NextResponse.json(
        { error: 'No file provided. Please select a PDF file.' },
        { status: 400 }
      );
    }

    console.log(`File received: ${(file as any).name}, size: ${(file as any).size} bytes`);

    // Generate demo data immediately without attempting backend connection
    console.log('Generating simulated data for demo purposes');

    // Generate simple transaction data for demo purposes
    const simulatedData = {
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

    // Success! Return the data
    console.log('Analysis successful (simulated)');
    return NextResponse.json(simulatedData, { status: 200 });

  } catch (error: any) {
    console.error("Error processing request:", error);

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 