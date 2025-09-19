import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      importedTestCases,
      existingTestCases,
      duplicateResults,
      apiKey
    } = body;

    if (!importedTestCases || !duplicateResults || !apiKey) {
      return NextResponse.json(
        { error: 'importedTestCases, duplicateResults, and apiKey are required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Prepare detailed analysis data
    const analysisPrompt = `
You are an expert software debugging assistant. I have a test case import system with a duplicate detection issue that needs investigation.

## Problem Description:
- Importing 60 test cases from Excel file
- Duplicate detection incorrectly flags 59 test cases as duplicates
- Only 1 test case imports successfully
- This happens even after clearing all existing data
- Signature generation works correctly in isolation testing

## Technical Context:
The system uses content-based signatures for duplicate detection:
1. Extract test case content (title, module, test steps)
2. Generate SHA-256 hash signature
3. Compare against existing test case signatures
4. Skip import if signature already exists

## Import Data Analysis:
**Imported Test Cases (sample):**
${JSON.stringify(importedTestCases.slice(0, 3), null, 2)}

**Existing Test Cases (sample):**
${JSON.stringify(existingTestCases?.slice(0, 3) || [], null, 2)}

**Duplicate Detection Results:**
- Total imported: ${importedTestCases.length}
- Skipped as duplicates: ${duplicateResults.skipped}
- Successfully imported: ${duplicateResults.saved}
- Duplicate signatures found: ${duplicateResults.duplicateSignatures?.length || 0}

**Sample Duplicate Signatures:**
${JSON.stringify(duplicateResults.duplicateSignatures?.slice(0, 5) || [], null, 2)}

## Analysis Request:
Please analyze this duplicate detection issue and provide:

1. **Root Cause Analysis**: What is likely causing unique test cases to be flagged as duplicates?

2. **Data Pattern Analysis**: Are there patterns in the imported test cases that might cause signature collisions?

3. **Debugging Recommendations**: Specific areas of the code to investigate further

4. **Quick Fixes**: Immediate solutions to resolve this issue

5. **Prevention Strategies**: How to prevent this issue in the future

Please be thorough in your analysis and provide actionable insights.
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert software debugging assistant specializing in data deduplication and import systems. Provide detailed, technical analysis with actionable recommendations."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const analysis = completion.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis received from AI');
    }

    return NextResponse.json({
      success: true,
      analysis: analysis,
      metadata: {
        importedCount: importedTestCases.length,
        existingCount: existingTestCases?.length || 0,
        duplicatesFound: duplicateResults.skipped,
        successfullyImported: duplicateResults.saved,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI debug analysis failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform AI debug analysis',
        details: error.message
      },
      { status: 500 }
    );
  }
}