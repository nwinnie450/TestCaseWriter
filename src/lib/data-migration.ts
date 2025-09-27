// Server-side only imports
let mongodb: any = null
let migrateLocalStorageToMongoDB: any = null
let AuthService: any = null

if (typeof window === 'undefined') {
  try {
    const mongoModule = require('./mongodb-service')
    mongodb = mongoModule.mongodb

    const storageModule = require('./test-case-storage')
    migrateLocalStorageToMongoDB = storageModule.migrateLocalStorageToMongoDB

    const authModule = require('./auth-service')
    AuthService = authModule.AuthService
  } catch (error) {
    console.warn('Server-side modules not available:', error)
  }
} else {
  throw new Error('Data migration can only be used on the server side')
}

export interface MigrationResult {
  step: string
  success: boolean
  details: {
    migrated: number
    errors: number
    message?: string
  }
}

export interface MigrationSummary {
  totalSteps: number
  successfulSteps: number
  results: MigrationResult[]
  overallSuccess: boolean
  summary: string
}

export class DataMigration {
  private results: MigrationResult[] = []

  async migrateAllDataToMongoDB(): Promise<MigrationSummary> {
    console.log('🚀 Starting comprehensive data migration to MongoDB...')
    this.results = []

    // Step 1: Initialize MongoDB indexes
    await this.migrateWithResult('Initialize MongoDB indexes', async () => {
      await mongodb.createIndexes()
      return { migrated: 1, errors: 0, message: 'MongoDB indexes created successfully' }
    })

    // Step 2: Migrate users
    await this.migrateWithResult('Migrate users', async () => {
      return await this.migrateUsers()
    })

    // Step 3: Migrate test cases
    await this.migrateWithResult('Migrate test cases', async () => {
      const result = await migrateLocalStorageToMongoDB()
      return {
        migrated: result.migrated,
        errors: result.errors,
        message: `Migrated ${result.migrated} test cases`
      }
    })

    // Step 4: Migrate runs
    await this.migrateWithResult('Migrate test runs', async () => {
      return await this.migrateTestRuns()
    })

    // Step 5: Migrate teams
    await this.migrateWithResult('Migrate teams', async () => {
      return await this.migrateTeams()
    })

    // Step 6: Migrate projects
    await this.migrateWithResult('Migrate projects', async () => {
      return await this.migrateProjects()
    })

    // Step 7: Verify migration
    await this.migrateWithResult('Verify migration', async () => {
      return await this.verifyMigration()
    })

    const successfulSteps = this.results.filter(r => r.success).length
    const overallSuccess = successfulSteps === this.results.length

    return {
      totalSteps: this.results.length,
      successfulSteps,
      results: this.results,
      overallSuccess,
      summary: this.generateSummary()
    }
  }

  private async migrateWithResult(stepName: string, migrationFn: () => Promise<{ migrated: number, errors: number, message?: string }>) {
    try {
      console.log(`🔄 ${stepName}...`)
      const details = await migrationFn()

      this.results.push({
        step: stepName,
        success: details.errors === 0,
        details
      })

      if (details.errors === 0) {
        console.log(`✅ ${stepName} completed successfully: ${details.message || 'Done'}`)
      } else {
        console.warn(`⚠️ ${stepName} completed with errors: ${details.errors} errors`)
      }
    } catch (error) {
      console.error(`❌ ${stepName} failed:`, error)
      this.results.push({
        step: stepName,
        success: false,
        details: {
          migrated: 0,
          errors: 1,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  private async migrateUsers(): Promise<{ migrated: number, errors: number, message?: string }> {
    try {
      // Get users from localStorage
      const localStorageUsers = AuthService.getAllUsers()

      if (localStorageUsers.length === 0) {
        return { migrated: 0, errors: 0, message: 'No users to migrate' }
      }

      // Check if users already exist in MongoDB
      const existingUsers = await mongodb.findMany('users', {})
      const existingUserEmails = new Set(existingUsers.map((u: any) => u.email.toLowerCase()))

      let migrated = 0
      let errors = 0

      // Migrate users that don't already exist
      for (const user of localStorageUsers) {
        if (!existingUserEmails.has(user.email.toLowerCase())) {
          try {
            const userData = {
              id: user.id,
              email: user.email.toLowerCase().trim(),
              name: user.name.trim(),
              username: user.username?.trim() || user.email.split('@')[0],
              password: 'Password888!', // Default password for migrated users
              role: user.role,
              avatar: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            await mongodb.insertOne('users', userData)
            migrated++
          } catch (userError) {
            console.error('Failed to migrate user:', user.email, userError)
            errors++
          }
        }
      }

      return {
        migrated,
        errors,
        message: `Migrated ${migrated} users, skipped ${localStorageUsers.length - migrated - errors} existing users`
      }
    } catch (error) {
      console.error('Failed to migrate users:', error)
      return { migrated: 0, errors: 1, message: 'Failed to migrate users' }
    }
  }

  private async migrateTestRuns(): Promise<{ migrated: number, errors: number, message?: string }> {
    try {
      // Check for localStorage runs data
      const runsKey = 'testCaseWriter_runs'
      const storedRuns = typeof window !== 'undefined' ? localStorage.getItem(runsKey) : null

      if (!storedRuns) {
        return { migrated: 0, errors: 0, message: 'No test runs to migrate' }
      }

      const runs = JSON.parse(storedRuns)
      if (!Array.isArray(runs) || runs.length === 0) {
        return { migrated: 0, errors: 0, message: 'No test runs to migrate' }
      }

      let migrated = 0
      let errors = 0

      // Migrate each run
      for (const run of runs) {
        try {
          // Check if run already exists
          const existingRun = await mongodb.findOne('test_runs', { id: run.id })
          if (!existingRun) {
            const runData = {
              id: run.id,
              name: run.name || 'Migrated Run',
              description: run.description || '',
              status: run.status || 'draft',
              projectId: run.projectId || 'default',
              testCases: run.testCases || [],
              createdBy: run.createdBy || 'system',
              assignedTo: run.assignedTo || [],
              dueDate: run.dueDate ? new Date(run.dueDate) : null,
              createdAt: run.createdAt ? new Date(run.createdAt) : new Date(),
              updatedAt: run.updatedAt ? new Date(run.updatedAt) : new Date()
            }

            await mongodb.insertOne('test_runs', runData)
            migrated++
          }
        } catch (runError) {
          console.error('Failed to migrate run:', run.id, runError)
          errors++
        }
      }

      return {
        migrated,
        errors,
        message: `Migrated ${migrated} test runs`
      }
    } catch (error) {
      console.error('Failed to migrate test runs:', error)
      return { migrated: 0, errors: 1, message: 'Failed to migrate test runs' }
    }
  }

  private async migrateTeams(): Promise<{ migrated: number, errors: number, message?: string }> {
    try {
      // Check for localStorage teams data
      const teamsKey = 'testCaseWriter_teams'
      const storedTeams = typeof window !== 'undefined' ? localStorage.getItem(teamsKey) : null

      if (!storedTeams) {
        return { migrated: 0, errors: 0, message: 'No teams to migrate' }
      }

      const teams = JSON.parse(storedTeams)
      if (!Array.isArray(teams) || teams.length === 0) {
        return { migrated: 0, errors: 0, message: 'No teams to migrate' }
      }

      let migrated = 0
      let errors = 0

      // Migrate each team
      for (const team of teams) {
        try {
          // Check if team already exists
          const existingTeam = await mongodb.findOne('teams', { id: team.id })
          if (!existingTeam) {
            const teamData = {
              id: team.id,
              name: team.name || 'Migrated Team',
              description: team.description || '',
              members: team.members || [],
              projectIds: team.projectIds || [],
              createdBy: team.createdBy || 'system',
              createdAt: team.createdAt ? new Date(team.createdAt) : new Date(),
              updatedAt: team.updatedAt ? new Date(team.updatedAt) : new Date()
            }

            await mongodb.insertOne('teams', teamData)
            migrated++
          }
        } catch (teamError) {
          console.error('Failed to migrate team:', team.id, teamError)
          errors++
        }
      }

      return {
        migrated,
        errors,
        message: `Migrated ${migrated} teams`
      }
    } catch (error) {
      console.error('Failed to migrate teams:', error)
      return { migrated: 0, errors: 1, message: 'Failed to migrate teams' }
    }
  }

  private async migrateProjects(): Promise<{ migrated: number, errors: number, message?: string }> {
    try {
      // Check for localStorage projects data
      const projectsKey = 'testCaseWriter_projects'
      const storedProjects = typeof window !== 'undefined' ? localStorage.getItem(projectsKey) : null

      if (!storedProjects) {
        return { migrated: 0, errors: 0, message: 'No projects to migrate' }
      }

      const projects = JSON.parse(storedProjects)
      if (!Array.isArray(projects) || projects.length === 0) {
        return { migrated: 0, errors: 0, message: 'No projects to migrate' }
      }

      let migrated = 0
      let errors = 0

      // Migrate each project
      for (const project of projects) {
        try {
          // Check if project already exists
          const existingProject = await mongodb.findOne('projects', { id: project.id })
          if (!existingProject) {
            const projectData = {
              id: project.id,
              name: project.name || 'Migrated Project',
              description: project.description || '',
              status: project.status || 'active',
              teamIds: project.teamIds || [],
              createdBy: project.createdBy || 'system',
              createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
              updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date()
            }

            await mongodb.insertOne('projects', projectData)
            migrated++
          }
        } catch (projectError) {
          console.error('Failed to migrate project:', project.id, projectError)
          errors++
        }
      }

      return {
        migrated,
        errors,
        message: `Migrated ${migrated} projects`
      }
    } catch (error) {
      console.error('Failed to migrate projects:', error)
      return { migrated: 0, errors: 1, message: 'Failed to migrate projects' }
    }
  }

  private async verifyMigration(): Promise<{ migrated: number, errors: number, message?: string }> {
    try {
      const counts = {
        users: await mongodb.count('users'),
        testCases: await mongodb.count('test_cases'),
        testRuns: await mongodb.count('test_runs'),
        teams: await mongodb.count('teams'),
        projects: await mongodb.count('projects')
      }

      const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0)

      return {
        migrated: totalRecords,
        errors: 0,
        message: `Verification complete: ${JSON.stringify(counts)}`
      }
    } catch (error) {
      console.error('Failed to verify migration:', error)
      return { migrated: 0, errors: 1, message: 'Failed to verify migration' }
    }
  }

  private generateSummary(): string {
    const successful = this.results.filter(r => r.success)
    const failed = this.results.filter(r => !r.success)

    const totalMigrated = this.results.reduce((sum, r) => sum + r.details.migrated, 0)
    const totalErrors = this.results.reduce((sum, r) => sum + r.details.errors, 0)

    let summary = `Migration completed: ${successful.length}/${this.results.length} steps successful\n`
    summary += `Total records migrated: ${totalMigrated}\n`
    summary += `Total errors: ${totalErrors}\n`

    if (failed.length > 0) {
      summary += `\nFailed steps:\n`
      failed.forEach(f => {
        summary += `- ${f.step}: ${f.details.message || 'Unknown error'}\n`
      })
    }

    successful.forEach(s => {
      if (s.details.migrated > 0) {
        summary += `- ${s.step}: ${s.details.message}\n`
      }
    })

    return summary
  }

  async cleanupLocalStorage(): Promise<{ success: boolean, message: string }> {
    try {
      if (typeof window === 'undefined') {
        return { success: false, message: 'Not in browser environment' }
      }

      console.log('🧹 Starting localStorage cleanup...')

      const keysToBackup = [
        'testCaseWriter_generatedTestCases',
        'testCaseWriter_users',
        'testCaseWriter_runs',
        'testCaseWriter_teams',
        'testCaseWriter_projects',
        'testCaseWriter_currentUser',
        'testCaseWriter_auth_token'
      ]

      // Create backup before cleanup
      const backup: Record<string, string | null> = {}
      keysToBackup.forEach(key => {
        backup[key] = localStorage.getItem(key)
      })

      // Save backup to localStorage with timestamp
      const backupKey = `testCaseWriter_backup_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backup))

      console.log(`✅ Backup created: ${backupKey}`)

      // Clear original keys (except current user session)
      keysToBackup.forEach(key => {
        if (!key.includes('currentUser') && !key.includes('auth_token')) {
          localStorage.removeItem(key)
        }
      })

      console.log('🧹 localStorage cleanup completed')

      return {
        success: true,
        message: `Cleanup completed. Backup saved as: ${backupKey}`
      }
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async restoreFromBackup(backupKey: string): Promise<{ success: boolean, message: string }> {
    try {
      if (typeof window === 'undefined') {
        return { success: false, message: 'Not in browser environment' }
      }

      const backupData = localStorage.getItem(backupKey)
      if (!backupData) {
        return { success: false, message: 'Backup not found' }
      }

      const backup = JSON.parse(backupData)
      let restoredCount = 0

      Object.entries(backup).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value)
          restoredCount++
        }
      })

      return {
        success: true,
        message: `Restored ${restoredCount} localStorage entries from backup`
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const dataMigration = new DataMigration()

// Utility function for direct migration
export async function migrateAllDataToMongoDB(): Promise<MigrationSummary> {
  return await dataMigration.migrateAllDataToMongoDB()
}

// Utility function for cleanup
export async function cleanupLocalStorage(): Promise<{ success: boolean, message: string }> {
  return await dataMigration.cleanupLocalStorage()
}

// Utility function for restore
export async function restoreFromBackup(backupKey: string): Promise<{ success: boolean, message: string }> {
  return await dataMigration.restoreFromBackup(backupKey)
}