import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import fs from 'fs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `kotak-statement-${Date.now()}.pdf`);
    
    // Write the uploaded file to the temporary location
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);

    // Get the absolute path to the Python script
    const scriptPath = path.join(process.cwd(), 'backend', 'parsers', 'kotak_parser.py');
    // const scriptPath = path.join(process.cwd(), 'backend', 'parsers', 'test_script.py'); // Temporarily changed for testing

    // Fixed logging statement to avoid linter errors
    console.log(`[DEBUG] Spawning python process: python ${scriptPath} ${tempFilePath}`);
    // Run the Python script with detailed error handling
    const pythonProcess = spawn('python', [scriptPath, tempFilePath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return new Promise<NextResponse>((resolve) => {
      let outputData = ''; // This will now only capture stdout
      let errorData = ''; // This will capture stderr

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error('Python script error (stderr):', data.toString());
      });

      pythonProcess.on('error', (error: Error) => {
        console.error("[DEBUG] Python process 'error' event triggered:", error);
        console.error("Failed to start Python process:", error);
        resolve(
          NextResponse.json(
            {
              error: 'Failed to start analysis process',
              details: error.message,
              stdout: outputData, // Include stdout in error details
              stderr: errorData // Include stderr in error details
            },
            { status: 500 }
          )
        );
      });

      pythonProcess.on('close', (code) => {
        fs.unlinkSync(tempFilePath);

        // Try to parse the output or error as JSON
        let errorMsg = 'Failed to analyze statement';
        try {
          const parsed = JSON.parse(outputData || errorData);
          if (parsed.error) errorMsg = parsed.error;
        } catch (e) {
          // Not JSON, keep as is
          if (errorData) errorMsg = errorData;
        }

        if (code === 0) {
          try {
            // Attempt to parse only the stdoutData as JSON
            const results = JSON.parse(outputData);
            console.log('Python script raw stdout:', outputData); // Log raw stdout
            console.log('Python script parsed results:', results); // Log parsed results

            if (results.error) {
              resolve(
                NextResponse.json(
                  {
                    error: results.error,
                    details: results.error,
                    stdout: outputData, // Include stdout in error details
                    stderr: errorData // Include stderr in error details
                  },
                  { status: 500 }
                )
              );
              return;
            }

            // Transform the data to match the frontend's expected format
            const transformedData: any = {
              transactions: results.transactions.map((txn: any) => ({
                date: txn.date,
                description: txn.description,
                amount: txn.amount,
                category: txn.category || 'Others',
                type: txn.type
              })),
              summary: {
                totalReceived: results.summary.total_credit,
                totalSpent: results.summary.total_debit,
                balance: results.summary.net_balance,
                creditCount: results.summary.credit_count,
                debitCount: results.summary.debit_count,
                totalTransactions: results.summary.total_transactions
              },
              categoryBreakdown: results.transactions.reduce((acc: any, txn: any) => {
                const category = txn.category || 'Others';
                if (!acc[category]) {
                  acc[category] = { amount: 0, count: 0 };
                }
                acc[category].amount += Math.abs(txn.amount);
                acc[category].count += 1;
                return acc;
              }, {}),
              accountInfo: results.account_info,
              statementPeriod: results.statement_period,
              pageCount: results.pageCount
            };

            // Add chart data
            transformedData.chartData = {
              data: {
                labels: Object.keys(transformedData.categoryBreakdown),
                datasets: [{
                  data: Object.values(transformedData.categoryBreakdown).map((cat: any) => cat.amount),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40',
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0'
                  ]
                }]
              }
            };

            resolve(NextResponse.json(transformedData));
          } catch (e: any) {
            console.error('Failed to parse Python script stdout as JSON:', e);
            console.error('Raw stdout:', outputData);
            console.error('Raw stderr:', errorData);
            resolve(
              NextResponse.json(
                {
                  error: 'Failed to parse analysis results',
                  details: `Error: ${e.message}`,
                  stdout: outputData, // Include stdout in error details
                  stderr: errorData // Include stderr in error details
                },
                { status: 500 }
              )
            );
          }
        } else {
          console.error('Python script exited with code:', code);
          console.error('Error output:', errorData);
          resolve(NextResponse.json({ error: errorMsg }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    console.error('Error processing statement:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process statement',
        details: error.message
      },
      { status: 500 }
    );
  }
} 