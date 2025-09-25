/**
 * Database Configuration
 * Handles environment-specific database connections
 */

// Get the appropriate database URL based on environment
export function getDatabaseUrl(): string {
  const env = process.env.NODE_ENV || 'development'

  if (env === 'production') {
    return process.env.PROD_DATABASE_URL || process.env.DATABASE_URL!
  }

  // Development environment
  return process.env.DEV_DATABASE_URL || process.env.DATABASE_URL!
}

// Database configuration for different environments
export const dbConfig = {
  development: {
    url: process.env.DEV_DATABASE_URL,
    cluster: 'Cluster0',
    name: 'testcasewriter-dev'
  },
  production: {
    url: process.env.PROD_DATABASE_URL,
    cluster: 'Prod',
    name: 'testcasewriter'
  }
}

// Get current database info
export function getCurrentDbInfo() {
  const env = process.env.NODE_ENV || 'development'
  const config = dbConfig[env as keyof typeof dbConfig]

  return {
    environment: env,
    cluster: config.cluster,
    database: config.name,
    url: config.url
  }
}

// Log current database connection (for debugging)
export function logDbConnection() {
  const info = getCurrentDbInfo()
  console.log(`🗄️  Database Info:`)
  console.log(`   Environment: ${info.environment}`)
  console.log(`   Cluster: ${info.cluster}`)
  console.log(`   Database: ${info.database}`)
  console.log(`   Connected: ${info.url ? '✅' : '❌'}`)
}