-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testCase" TEXT NOT NULL,
    "module" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "projectId" TEXT,
    "templateId" TEXT,
    "testSteps" JSONB,
    "testResult" TEXT NOT NULL DEFAULT 'Not Executed',
    "qa" TEXT,
    "remarks" TEXT,
    "tags" JSONB,
    "enhancement" TEXT,
    "ticketId" TEXT,
    "estimatedTime" INTEGER,
    "actualTime" INTEGER,
    "data" JSONB,
    "createdBy" TEXT,
    "lastModifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "generation_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "projectName" TEXT,
    "model" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "documentNames" JSONB,
    "settings" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
