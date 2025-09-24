import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  // Simple base64 encoding for consistency with user-storage.ts
  // In production, use bcrypt or similar
  return Buffer.from(password).toString('base64')
}

async function main() {
  console.log('🌱 Seeding database...')

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@merquri.io' }
  })

  if (existingAdmin) {
    console.log('✅ Admin user already exists')
    return
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@merquri.io',
      name: 'Admin User',
      username: 'admin',
      password: hashPassword('Password888!'),
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin User&background=1f2937&color=fff'
    }
  })

  console.log('✅ Admin user created:', {
    id: admin.id,
    email: admin.email,
    username: admin.username,
    role: admin.role
  })

  console.log('🌱 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })