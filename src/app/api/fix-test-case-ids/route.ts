import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // TODO: Convert to MongoDB

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting test case ID fix process...');

    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });

    // Get all test cases from database, ordered by creation date
    // const testCases = await prisma.testCase.findMany({
    //   orderBy: { createdAt: 'asc' }
    // });

    console.log(`📊 Found ${testCases.length} test cases in database`);

    if (testCases.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test cases found in database to update',
        updated: 0
      });
    }

    // Group test cases by their current IDs to identify duplicates
    const idGroups = new Map<string, any[]>();
    testCases.forEach(tc => {
      if (!idGroups.has(tc.id)) {
        idGroups.set(tc.id, []);
      }
      idGroups.get(tc.id)!.push(tc);
    });

    // Find duplicates
    const duplicateIds = Array.from(idGroups.entries())
      .filter(([_, cases]) => cases.length > 1)
      .map(([id, cases]) => ({ id, count: cases.length }));

    console.log(`🔍 Found ${duplicateIds.length} duplicate IDs:`, duplicateIds);

    let updateCount = 0;
    let newIdCounter = 1;

    // Process all test cases in creation order
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const newId = `TC-${String(newIdCounter).padStart(3, '0')}`;

      // Only update if the ID is different
      if (testCase.id !== newId) {
        console.log(`📝 Updating test case: ${testCase.id} → ${newId}`);

        try {
          await prisma.testCase.update({
            where: {
              id: testCase.id,
              createdAt: testCase.createdAt // Use composite identifier to avoid conflicts
            },
            data: { id: newId }
          });
          updateCount++;
        } catch (error) {
          console.error(`❌ Failed to update test case ${testCase.id}:`, error);
          // If update fails due to constraint, try with a different approach
          try {
            // Delete and recreate with new ID
            await prisma.testCase.delete({
              where: {
                id: testCase.id,
                createdAt: testCase.createdAt
              }
            });

            const { id: _, ...testCaseData } = testCase;
            await prisma.testCase.create({
              data: {
                ...testCaseData,
                id: newId
              }
            });
            updateCount++;
            console.log(`✅ Recreated test case with new ID: ${newId}`);
          } catch (recreateError) {
            console.error(`❌ Failed to recreate test case:`, recreateError);
          }
        }
      }

      newIdCounter++;
    }

    // Verify the results
    const updatedTestCases = await prisma.testCase.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const finalIdGroups = new Map<string, any[]>();
    updatedTestCases.forEach(tc => {
      if (!finalIdGroups.has(tc.id)) {
        finalIdGroups.set(tc.id, []);
      }
      finalIdGroups.get(tc.id)!.push(tc);
    });

    const remainingDuplicates = Array.from(finalIdGroups.entries())
      .filter(([_, cases]) => cases.length > 1)
      .map(([id, cases]) => ({ id, count: cases.length }));

    console.log(`✅ Test case ID fix completed. Updated: ${updateCount}, Remaining duplicates: ${remainingDuplicates.length}`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updateCount} test case IDs`,
      details: {
        totalTestCases: testCases.length,
        updatedCount: updateCount,
        duplicatesFound: duplicateIds.length,
        duplicatesRemaining: remainingDuplicates.length,
        duplicateIds: duplicateIds,
        remainingDuplicates: remainingDuplicates
      }
    });

  } catch (error) {
    console.error('❌ Failed to fix test case IDs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix test case IDs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });

    // Analyze current test case IDs without making changes
    // const testCases = await prisma.testCase.findMany({
    //   select: { id: true, createdAt: true },
    //   orderBy: { createdAt: 'asc' }
    // });

    // Group by ID to find duplicates
    const idGroups = new Map<string, any[]>();
    testCases.forEach(tc => {
      if (!idGroups.has(tc.id)) {
        idGroups.set(tc.id, []);
      }
      idGroups.get(tc.id)!.push(tc);
    });

    const duplicateIds = Array.from(idGroups.entries())
      .filter(([_, cases]) => cases.length > 1)
      .map(([id, cases]) => ({ id, count: cases.length }));

    const allIds = Array.from(idGroups.keys()).sort();

    return NextResponse.json({
      totalTestCases: testCases.length,
      uniqueIds: idGroups.size,
      duplicateIds: duplicateIds,
      allIds: allIds,
      needsUpdate: duplicateIds.length > 0
    });

  } catch (error) {
    console.error('Failed to analyze test case IDs:', error);
    return NextResponse.json(
      { error: 'Failed to analyze test case IDs' },
      { status: 500 }
    );
  }
}