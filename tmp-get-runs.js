const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const runs = await prisma.run.findMany({
    include: {
      runCases: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    skip: 0,
  });

  const runsWithStats = runs.map(run => {
    const cases = run.runCases;
    const totalCases = cases.length;
    const passedCases = cases.filter(c => c.status === 'Pass').length;
    const failedCases = cases.filter(c => c.status === 'Fail').length;
    const blockedCases = cases.filter(c => c.status === 'Blocked').length;
    const notRunCases = cases.filter(c => c.status === 'Not Run').length;

    return {
      ...run,
      runCases: undefined,
      stats: {
        totalCases,
        passedCases,
        failedCases,
        blockedCases,
        notRunCases,
        passRate: totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0,
      },
      environments: run.environments ? JSON.parse(run.environments) : [],
      filters: run.filters ? JSON.parse(run.filters) : null,
    };
  });

  console.log(JSON.stringify(runsWithStats, null, 2));
})()
  .catch(err => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
