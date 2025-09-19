import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-storage'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const runCaseId = formData.get('runCaseId') as string
    const runStepId = formData.get('runStepId') as string
    const description = formData.get('description') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      )
    }

    if (!runCaseId && !runStepId) {
      return NextResponse.json(
        { error: 'Either runCaseId or runStepId is required' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'text/plain',
      'application/pdf',
      'application/json',
      'text/html'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const filename = `evidence_${timestamp}_${randomSuffix}.${fileExtension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'evidence')

    try {
      await writeFile(join(process.cwd(), 'public', 'uploads', '.gitkeep'), '')
    } catch (error) {
      // Directory might not exist, create the evidence folder
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file to uploads directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, filename)

    await writeFile(filePath, buffer)

    // Create evidence record in database
    const evidence = await prisma.evidence.create({
      data: {
        filename,
        url: `/uploads/evidence/${filename}`,
        type: getEvidenceType(file.type),
        size: file.size,
        mimeType: file.type,
        description: description || null,
        runCaseId: runCaseId || null,
        runStepId: runStepId || null,
        createdBy: currentUser.id
      }
    })

    return NextResponse.json({
      id: evidence.id,
      url: evidence.url,
      filename: evidence.filename,
      type: evidence.type,
      size: evidence.size,
      mimeType: evidence.mimeType,
      description: evidence.description
    })

  } catch (error) {
    console.error('Failed to upload evidence:', error)
    return NextResponse.json(
      { error: 'Failed to upload evidence' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const runCaseId = searchParams.get('runCaseId')
    const runStepId = searchParams.get('runStepId')

    // Build where clause
    const where: any = {}
    if (runCaseId) {
      where.runCaseId = runCaseId
    }
    if (runStepId) {
      where.runStepId = runStepId
    }

    const evidence = await prisma.evidence.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ evidence })

  } catch (error) {
    console.error('Failed to fetch evidence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evidence' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const evidenceId = searchParams.get('id')

    if (!evidenceId) {
      return NextResponse.json(
        { error: 'Evidence ID is required' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get evidence record
    const evidence = await prisma.evidence.findUnique({
      where: { id: evidenceId }
    })

    if (!evidence) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
      )
    }

    // Check if user can delete (owner or admin)
    if (evidence.createdBy !== currentUser.id && !currentUser.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      const { unlink } = await import('fs/promises')
      const filePath = join(process.cwd(), 'public', evidence.url)
      await unlink(filePath)
    } catch (error) {
      console.warn('Failed to delete file from filesystem:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete evidence record
    await prisma.evidence.delete({
      where: { id: evidenceId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to delete evidence:', error)
    return NextResponse.json(
      { error: 'Failed to delete evidence' },
      { status: 500 }
    )
  }
}

function getEvidenceType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'file'
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'log'
  return 'file'
}