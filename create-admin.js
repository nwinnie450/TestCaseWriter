// Create admin user in database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔍 Creating admin user...')

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@testcasewriter.com' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username)
      return
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@testcasewriter.com',
        username: 'admin',
        name: 'System Administrator',
        role: 'super-admin',
        password: 'hashed_admin_password_123' // In real app, this should be properly hashed
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('👤 Username:', admin.username)
    console.log('🔑 Role:', admin.role)
    console.log('🆔 ID:', admin.id)

    // Also create a regular QA user for testing
    const qaUser = await prisma.user.create({
      data: {
        email: 'qa@testcasewriter.com',
        username: 'qa_tester',
        name: 'QA Tester',
        role: 'user',
        password: 'hashed_qa_password_123'
      }
    })

    console.log('✅ QA user created successfully!')
    console.log('📧 Email:', qaUser.email)
    console.log('👤 Username:', qaUser.username)
    console.log('🔑 Role:', qaUser.role)

    // List all users
    const allUsers = await prisma.user.findMany()
    console.log('\n👥 All users in database:')
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.username}) - ${user.role}`)
    })

  } catch (error) {
    console.error('❌ Failed to create admin:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()