-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "build" TEXT,
    "environments" JSONB,
    "filters" JSONB,
    "dueAt" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "closedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft'
);

-- CreateTable
CREATE TABLE "run_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "stepsSnapshot" JSONB NOT NULL,
    "assignee" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Not Run',
    "durationSec" INTEGER,
    "notes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "component" TEXT,
    "tags" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "run_cases_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "run_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runCaseId" TEXT NOT NULL,
    "idx" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Not Run',
    "actual" TEXT,
    "durationSec" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "run_steps_runCaseId_fkey" FOREIGN KEY ("runCaseId") REFERENCES "run_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runCaseId" TEXT,
    "runStepId" TEXT,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "mimeType" TEXT,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evidence_runCaseId_fkey" FOREIGN KEY ("runCaseId") REFERENCES "run_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evidence_runStepId_fkey" FOREIGN KEY ("runStepId") REFERENCES "run_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "defects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runCaseId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "defects_runCaseId_fkey" FOREIGN KEY ("runCaseId") REFERENCES "run_cases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "filter_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "flaky_cases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "flakiness" REAL NOT NULL,
    "totalRuns" INTEGER NOT NULL,
    "flipCount" INTEGER NOT NULL,
    "lastFlip" DATETIME,
    "isFlaky" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "flaky_cases_caseId_key" ON "flaky_cases"("caseId");
