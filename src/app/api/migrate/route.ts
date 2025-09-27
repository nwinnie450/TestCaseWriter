import { NextRequest, NextResponse } from 'next/server'
import { dataMigration, MigrationSummary } from '@/lib/data-migration'
import { getCurrentUser } from '@/lib/user-storage'

export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || !['super-admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only admins can run data migration.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'migrate': {
        console.log('🚀 Starting data migration via API...')
        const result = await dataMigration.migrateAllDataToMongoDB()

        return NextResponse.json({
          success: result.overallSuccess,
          message: 'Data migration completed',
          details: result
        })
      }

      case 'cleanup': {
        console.log('🧹 Starting localStorage cleanup via API...')
        const result = await dataMigration.cleanupLocalStorage()

        return NextResponse.json({
          success: result.success,
          message: result.message
        })
      }

      case 'restore': {
        const { backupKey } = body
        if (!backupKey) {
          return NextResponse.json(
            { error: 'Backup key is required for restore operation' },
            { status: 400 }
          )
        }

        console.log(`🔄 Starting restore from backup: ${backupKey}`)
        const result = await dataMigration.restoreFromBackup(backupKey)

        return NextResponse.json({
          success: result.success,
          message: result.message
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: migrate, cleanup, restore' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || !['super-admin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Permission denied. Only admins can view migration status.' },
        { status: 403 }
      )
    }

    // Check localStorage data that could be migrated
    let localStorageStats = {
      testCases: 0,
      users: 0,
      runs: 0,
      teams: 0,
      projects: 0
    }

    if (typeof window !== 'undefined') {
      try {
        const testCasesData = localStorage.getItem('testCaseWriter_generatedTestCases')
        if (testCasesData) {
          const sessions = JSON.parse(testCasesData)
          localStorageStats.testCases = sessions.reduce((total: number, session: any) =>
            total + (session.testCases?.length || 0), 0
          )
        }

        const usersData = localStorage.getItem('testCaseWriter_users')
        if (usersData) {
          const users = JSON.parse(usersData)
          localStorageStats.users = Array.isArray(users) ? users.length : 0
        }

        const runsData = localStorage.getItem('testCaseWriter_runs')
        if (runsData) {
          const runs = JSON.parse(runsData)
          localStorageStats.runs = Array.isArray(runs) ? runs.length : 0
        }

        const teamsData = localStorage.getItem('testCaseWriter_teams')
        if (teamsData) {
          const teams = JSON.parse(teamsData)
          localStorageStats.teams = Array.isArray(teams) ? teams.length : 0
        }

        const projectsData = localStorage.getItem('testCaseWriter_projects')
        if (projectsData) {
          const projects = JSON.parse(projectsData)
          localStorageStats.projects = Array.isArray(projects) ? projects.length : 0
        }
      } catch (error) {
        console.warn('Error reading localStorage stats:', error)
      }
    }

    // Get MongoDB stats (would need to import mongodb service here)
    // For now, return localStorage stats
    return NextResponse.json({
      localStorageStats,
      migrationAvailable: Object.values(localStorageStats).some(count => count > 0)
    })

  } catch (error) {
    console.error('Migration status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get migration status' },
      { status: 500 }
    )
  }
}