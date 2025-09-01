'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Layout } from '@/components/layout/Layout'
import { StepIndicator } from '@/components/generate/StepIndicator'
import { FileUploadZone } from '@/components/upload/FileUploadZone'
import { RequirementInput } from '@/components/generate/RequirementInput'
import { TemplateSelector } from '@/components/generate/TemplateSelector'
import { GenerateMoreButton } from '@/components/generate/GenerateMoreButton'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FileUploadProgress } from '@/types'
import { useSettings } from '@/contexts/SettingsContext'
import { useTokenUsage } from '@/contexts/TokenUsageContext'
import { generateTestCasesWithAI } from '@/lib/ai-providers'
import { AIGenerationError } from '@/lib/ai-generation'
import { generateMockTestCases, OpenAIError } from '@/lib/openai'
import { getAvailableProviders, getProvider } from '@/lib/ai-providers'
import { TestCase } from '@/types'
// Import the simple PDF parser
import { extractTextFromDocument as extractFromDoc } from '@/lib/simple-pdf-parser'

const extractTextFromDocument = async (file: File): Promise<string> => {
  const result = await extractFromDoc(file)
  return result.text
}
import { saveGeneratedTestCases } from '@/lib/test-case-storage'
import { getCurrentUser } from '@/lib/user-storage'
import { LoginModal } from '@/components/auth/LoginModal'
import { APIKeyModal } from '@/components/modals/APIKeyModal'
import { Wand2, FileText, Settings, Eye, Download, AlertCircle, Edit3, FolderOpen, Brain, Cpu, Zap, Table } from 'lucide-react'

const steps = [
  {
    id: 'project',
    title: 'Select Project',
    description: 'Choose which project for test cases'
  },
  {
    id: 'upload',
    title: 'Upload Documents',
    description: 'Upload requirements and specifications'
  },
  {
    id: 'template',
    title: 'Select Template',
    description: 'Choose test case template'
  },
  {
    id: 'configure',
    title: 'Configure Generation',
    description: 'Set generation parameters'
  },
  {
    id: 'review',
    title: 'Review & Generate',
    description: 'Review and generate test cases'
  },
  {
    id: 'export',
    title: 'Export',
    description: 'Export generated test cases'
  }
]

export default function GenerateTestCases() {
  const [currentStep, setCurrentStep] = useState(1)
  const [projects, setProjects] = useState<Array<{id: string, name: string, description?: string}>>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([])
  const [completedDocuments, setCompletedDocuments] = useState<{ file: File; content: string }[]>([])
  const [textRequirements, setTextRequirements] = useState<string[]>([])
  const [uploadedMatrices, setUploadedMatrices] = useState<Array<{ file: File; matrix: any }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('custom_qa_template_v1')
  const [generationConfig, setGenerationConfig] = useState({
    coverage: 'comprehensive' as 'comprehensive' | 'focused' | 'minimal',
    includeNegativeTests: true,
    includeEdgeCases: true,
    maxTestCases: 50,
    customInstructions: `Generate comprehensive test coverage for each requirement including:
- Positive scenarios (happy path, valid data, boundary conditions)
- Negative scenarios (invalid inputs, error conditions, unauthorized access)
- Edge cases (extreme values, special characters, concurrent operations)
- Integration scenarios (API interactions, database operations)
- Security scenarios (input validation, authentication, data sanitization)
- Performance scenarios (load conditions, resource limits)

MATRIX INTEGRATION: When test matrices are provided, use them to:
- Extract specific test scenarios and their expected behaviors
- Use matrix parameters as test data variations
- Map matrix categories to test case modules/features
- Ensure all matrix scenarios are covered in generated test cases
- Maintain traceability between matrix rows and generated test cases

CRITICAL ORDERING: Generate test cases in the EXACT SAME ORDER as requirements appear in the document. Maintain logical flow and sequential numbering (TC-0001, TC-0002, TC-0003...).

Ensure each test case has detailed steps with specific test data and expected results.`
  })
  // New metadata state
  const [projectId, setProjectId] = useState('')
  const [enhancement, setEnhancement] = useState('')
  const [ticketId, setTicketId] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Debug logging for tags state changes
  useEffect(() => {
    console.log('🔍 Generate Page - Tags state changed:', {
      tags: tags,
      tagsLength: tags.length,
      tagsContent: tags.join(', ')
    })
  }, [tags])

  // Debug logging for setTags function
  const handleTagsChange = (newTags: string[]) => {
    console.log('🔍 Generate Page - handleTagsChange called with:', {
      newTags: newTags,
      newTagsLength: newTags.length,
      previousTags: tags
    })
    setTags(newTags)
  }
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState('')
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
  const [chunkingResults, setChunkingResults] = useState<Array<{docId: string, totalChunks: number}>>([])
  const [duplicateInfo, setDuplicateInfo] = useState<{
    exactDuplicates: number
    potentialDuplicates: number
    duplicateDetails?: any[]
  } | null>(null)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionTestCaseCount, setSessionTestCaseCount] = useState(0)
  
  const { settings, getAIConfig, hasValidAPIKey, updateAIConfig } = useSettings()
  const { addUsage } = useTokenUsage()

  // Get available AI providers and current selection
  const availableProviders = getAvailableProviders()
  const currentProvider = getProvider(getAIConfig().providerId)

  // Load current session statistics
  const loadSessionStats = () => {
    try {
      const sessions = localStorage.getItem('testCaseWriter_generatedTestCases')
      if (sessions) {
        const parsedSessions = JSON.parse(sessions)
        if (parsedSessions.length > 0) {
          // Get the most recent session for the current project
          const projectSessions = projectId ? 
            parsedSessions.filter((s: any) => s.projectId === projectId) : 
            parsedSessions
          
          if (projectSessions.length > 0) {
            const latestSession = projectSessions[projectSessions.length - 1]
            setCurrentSessionId(latestSession.id)
            setSessionTestCaseCount(latestSession.testCases?.length || 0)
            
            // If we have test cases for this session, load them for display only
            // Don't set generatedTestCases to avoid infinite loops
            // setGeneratedTestCases will be set during actual generation
          }
        }
      }
    } catch (error) {
      console.error('Failed to load session stats:', error)
    }
  }

  // Load current user and projects
  React.useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)

    // Load projects
    try {
      const stored = localStorage.getItem('testCaseWriter_projects')
      if (stored) {
        const parsedProjects = JSON.parse(stored)
        const activeProjects = parsedProjects.filter((p: any) => p.status === 'active')
        setProjects(activeProjects)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }

    // Load current session stats
    loadSessionStats()
  }, [])

  // Refresh session stats when generation completes - removed dependency to prevent loops
  // This will be called manually after generation instead

  // Reload session stats when project changes
  React.useEffect(() => {
    if (projectId) {
      loadSessionStats()
    }
  }, [projectId])
  
  // Add ref to prevent infinite loops
  const loadedProjectRef = React.useRef<string | null>(null)

  // Function to restore previous generation session
  const restorePreviousSession = (projectParam: string | null) => {
    try {
      console.log('🔄 Restoring previous session for project:', projectParam)
      
      // Try to restore from session storage first (most recent session)
      const sessionData = sessionStorage.getItem('testCaseWriter_lastGenerationSession')
      if (sessionData) {
        const parsed = JSON.parse(sessionData)
        console.log('📋 Found session data:', parsed)
        
        // Check if session matches project
        if (!projectParam || parsed.projectId === projectParam) {
          // Restore documents and matrices
          if (parsed.completedDocuments) {
            setCompletedDocuments(parsed.completedDocuments)
          }
          if (parsed.uploadedMatrices) {
            setUploadedMatrices(parsed.uploadedMatrices)
          }
          if (parsed.textRequirements) {
            setTextRequirements(parsed.textRequirements)
          }
          if (parsed.selectedTemplateId) {
            setSelectedTemplateId(parsed.selectedTemplateId)
          }
          if (parsed.tags) {
            setTags(parsed.tags)
          }
          if (parsed.enhancement) {
            setEnhancement(parsed.enhancement)
          }
          if (parsed.ticketId) {
            setTicketId(parsed.ticketId)
          }
          if (parsed.generationConfig) {
            setGenerationConfig(parsed.generationConfig)
          }
          if (parsed.currentSessionId) {
            setCurrentSessionId(parsed.currentSessionId)
            // Also update session count
            import('@/lib/test-case-storage').then(({ getStoredTestCaseSessions }) => {
              try {
                const sessions = getStoredTestCaseSessions()
                const currentSession = sessions.find((s: any) => s.id === parsed.currentSessionId)
                if (currentSession) {
                  setSessionTestCaseCount(currentSession.totalCount)
                }
              } catch (error) {
                console.error('Failed to load session count:', error)
              }
            }).catch(error => {
              console.error('Failed to import test-case-storage:', error)
            })
          }
          
          // Go directly to generation ready step
          setCurrentStep(5)
          console.log('✅ Session restored successfully')
          return
        }
      }
      
      // Fallback: go to upload step if no session found
      console.log('⚠️ No matching session found, going to upload step')
      setCurrentStep(2)
      
    } catch (error) {
      console.error('❌ Error restoring session:', error)
      setCurrentStep(2)
    }
  }

  // Check for project parameter in URL and skip to step 2 if provided
  React.useEffect(() => {
    if (typeof window !== 'undefined' && projects.length > 0) {
      const urlParams = new URLSearchParams(window.location.search)
      const projectParam = urlParams.get('project')
      const stepParam = urlParams.get('step')
      const continueParam = urlParams.get('continue')
      
      if (projectParam && loadedProjectRef.current !== projectParam) {
        const project = projects.find(p => p.id === projectParam)
        if (project) {
          loadedProjectRef.current = projectParam
          setProjectId(projectParam)
          
          // If continue=true, restore the previous session and go to generation step
          if (continueParam === 'true') {
            restorePreviousSession(projectParam)
          }
          // If step=upload is specified, go directly to upload step
          else if (stepParam === 'upload') {
            setCurrentStep(2)
          } else {
            // Check if there's existing session data to determine step
            try {
              const sessions = localStorage.getItem('testCaseWriter_generatedTestCases')
              if (sessions) {
                const parsedSessions = JSON.parse(sessions)
                const hasRecentSession = parsedSessions.some((s: any) => 
                  s.projectId === projectParam && 
                  new Date(s.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Within 24 hours
                )
                // If there's a recent session, go to the final step
                setCurrentStep(hasRecentSession ? 6 : 2)
              } else {
                setCurrentStep(2) // Skip project selection step
              }
            } catch (error) {
              console.error('Error loading session data:', error)
              setCurrentStep(2)
            }
          }
        }
      }
      // Handle continue without specific project
      else if (continueParam === 'true' && loadedProjectRef.current === null) {
        loadedProjectRef.current = 'continue-session'
        restorePreviousSession(null)
      }
      // Also handle case where only step=upload is provided (no project)
      else if (stepParam === 'upload' && loadedProjectRef.current === null) {
        loadedProjectRef.current = 'no-project'
        setCurrentStep(2)
      }
    }
  }, [projects])

  // File upload handling
  const handleFilesAdded = async (files: File[]) => {
    // Update progress state
    const newProgress: FileUploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
      error: undefined
    }))
    setUploadProgress(prev => [...prev, ...newProgress])
    
    // Process files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const progressIndex = uploadProgress.length + i
      
      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 90; progress += 10) {
          setUploadProgress(prev => {
            const updated = [...prev]
            if (updated[progressIndex]) {
              updated[progressIndex].progress = progress
            }
            return updated
          })
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Check if file is a matrix (CSV/Excel)
        const fileName = file.name.toLowerCase()
        const isMatrix = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
        
        if (isMatrix) {
          // Parse matrix file
          const { parseMatrixFile } = await import('@/lib/matrix-parser')
          const matrix = await parseMatrixFile(file)
          
          console.log(`📊 Matrix parsing result for ${file.name}:`, {
            totalScenarios: matrix.metadata.totalScenarios,
            parameters: matrix.metadata.parameters,
            categories: matrix.metadata.categories
          })
          
          // Complete upload
          setUploadProgress(prev => {
            const updated = [...prev]
            if (updated[progressIndex]) {
              updated[progressIndex].progress = 100
              updated[progressIndex].status = 'completed'
            }
            return updated
          })
          
          // Add to uploaded matrices
          setUploadedMatrices(prev => [...prev, { file, matrix }])
        } else {
          // Extract text content for documents
          const content = await extractTextFromDocument(file)
          
          console.log(`📄 Text extraction result for ${file.name}:`, {
            contentLength: content.length,
            contentPreview: content.substring(0, 200),
            isEmpty: !content || content.trim().length === 0
          })
          
          if (!content || content.trim().length === 0) {
            throw new Error(`No readable content found in ${file.name}. The document may be image-based, password-protected, or corrupted.`)
          }
          
          // Complete upload
          setUploadProgress(prev => {
            const updated = [...prev]
            if (updated[progressIndex]) {
              updated[progressIndex].progress = 100
              updated[progressIndex].status = 'completed'
            }
            return updated
          })
          
          // Add to completed documents
          setCompletedDocuments(prev => [...prev, { file, content }])
        }
        
      } catch (error) {
        console.error('File processing error:', error)
        setUploadProgress(prev => {
          const updated = [...prev]
          if (updated[progressIndex]) {
            updated[progressIndex].status = 'error'
            updated[progressIndex].error = error instanceof Error ? error.message : 'Unknown error'
          }
          return updated
        })
      }
    }
  }

  const handleFileRemoved = (index: number) => {
    // Remove from upload progress
    const removedFile = uploadProgress[index]
    setUploadProgress(prev => prev.filter((_, i) => i !== index))
    
    // Remove from completed documents if it exists
    if (removedFile) {
      setCompletedDocuments(prev => 
        prev.filter(doc => doc.file.name !== removedFile.file.name)
      )
    }
  }

  // Check if user can proceed from requirements step
  const canProceedFromRequirements = completedDocuments.length > 0 || textRequirements.length > 0 || uploadedMatrices.length > 0

  // Mock templates data - in a real app this would come from a database or API
  const templates = [
    {
      id: 'custom_qa_template_v1',
      name: 'Your Custom QA Template',
      description: 'Your exact format: Test Case ID | Module | Test Case | *Test Steps | Test Result | QA | Remarks',
      fields: [],
      version: 1,
      isPublished: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user-1'
    },
    {
      id: 'basic_template',
      name: 'Basic Test Case Template',
      description: 'Simple template with essential fields for quick test case creation',
      fields: [],
      version: 1,
      isPublished: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user-1'
    },
    {
      id: 'api_template',
      name: 'API Testing Template',
      description: 'Specialized template for API endpoint testing with request/response validation',
      fields: [],
      version: 1,
      isPublished: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user-1'
    }
  ]

  const breadcrumbs = [
    { label: 'Generate', href: '/generate' },
    { label: 'New Generation' }
  ]

  // Old file handler removed - now using the comprehensive async one above

  const simulateUpload = (upload: FileUploadProgress, index: number) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      
      setUploadProgress(prev => 
        prev.map((item, i) => 
          i === index 
            ? { 
                ...item, 
                progress: Math.min(progress, 100),
                status: progress >= 100 ? 'processing' : 'uploading'
              }
            : item
        )
      )

      if (progress >= 100) {
        clearInterval(interval)
        
        // Simulate processing
        setTimeout(() => {
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index 
                ? { ...item, status: 'completed', documentId: `doc-${Date.now()}-${i}` }
                : item
            )
          )
        }, 1000 + Math.random() * 2000)
      }
    }, 100)
  }

  const canProceedFromUpload = uploadProgress.some(item => item.status === 'completed')
  const canProceedFromTemplate = selectedTemplateId !== null

  // AI-powered test case generation
  const startGeneration = async () => {
    console.log('🚀 Starting AI test case generation...')
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationError(null)
    
    try {
      // Get AI configuration from settings
      const aiConfig = getAIConfig()
      console.log('🔑 AI Config:', { 
        provider: aiConfig.provider, 
        hasApiKey: !!aiConfig.apiKey,
        apiKeyLength: aiConfig.apiKey.length,
        model: aiConfig.model,
        documentFocused: aiConfig.documentFocused,
        requireDocuments: aiConfig.requireDocuments
      })
      
      // Check if we have a valid API key
      if (!hasValidAPIKey()) {
        throw new Error(`No ${currentProvider?.name || 'AI'} API key configured. Please add your API key in the AI configuration.`)
      }
      
      // Get all requirements content (documents + text + matrices)
      const documentTexts = completedDocuments.map(doc => doc.content)
      
      // Process matrix data into structured format for AI
      const matrixContent: string[] = []
      uploadedMatrices.forEach(matrixData => {
        const { matrix } = matrixData
        let matrixText = `\n=== TEST MATRIX: ${matrix.fileName} ===\n`
        matrixText += `Total Scenarios: ${matrix.metadata.totalScenarios}\n`
        matrixText += `Categories: ${matrix.metadata.categories.join(', ')}\n`
        matrixText += `Parameters: ${matrix.metadata.parameters.join(', ')}\n\n`
        
        matrix.rows.forEach((row: any, index: number) => {
          matrixText += `Scenario ${index + 1}: ${row.testScenario}\n`
          matrixText += `Expected: ${row.expectedBehavior}\n`
          if (row.priority) matrixText += `Priority: ${row.priority}\n`
          if (row.category) matrixText += `Category: ${row.category}\n`
          
          // Add parameters
          Object.entries(row.parameters).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim()) matrixText += `${key}: ${value}\n`
          })
          matrixText += '\n'
        })
        
        matrixContent.push(matrixText)
      })
      
      const allRequirements = [...documentTexts, ...textRequirements, ...matrixContent]
      
      console.log('📄 Requirements:', { 
        documents: completedDocuments.length,
        textRequirements: textRequirements.length,
        matrices: uploadedMatrices.length,
        totalContent: allRequirements.length,
        documentFiles: completedDocuments.map(d => ({ name: d.file.name, size: d.content.length })),
        textSizes: textRequirements.map(t => t.length),
        matrixFiles: uploadedMatrices.map(m => ({ name: m.file.name, scenarios: m.matrix.metadata.totalScenarios }))
      })
      
      if (allRequirements.length === 0) {
        throw new Error('No requirements provided. Please upload documents, add text requirements, or upload test matrices.')
      }
      
      // Prepare all requirements content (already extracted documents + text requirements)
      setGenerationStep('Preparing requirements content...')
      setGenerationProgress(10)
      
      // Format document content properly
      const formattedDocuments = completedDocuments.map(doc => 
        `Document: ${doc.file.name}\nType: ${doc.file.type}\nSize: ${Math.round(doc.file.size / 1024)}KB\n\nCONTENT:\n${doc.content}`
      )
      
      // Format text requirements
      const formattedTextRequirements = textRequirements.map((text, index) => 
        `Text Requirement ${index + 1}:\n\nCONTENT:\n${text}`
      )
      
      // Combine all content
      const allDocumentContents = [...formattedDocuments, ...formattedTextRequirements]
      
      // Validate that we have actual document content  
      const validDocuments = allDocumentContents.filter(content => 
        !content.includes('Error:') && content.includes('CONTENT:')
      )
      
      if (validDocuments.length === 0) {
        throw new Error('No documents could be parsed successfully. Please ensure your uploaded files contain readable text content and try again.')
      }
      
      console.log('Successfully parsed documents:', validDocuments.length, 'out of', allDocumentContents.length)
      console.log('Document content preview:', allDocumentContents.map((doc: string) => ({
        name: doc.split('\n')[0],
        contentLength: doc.split('CONTENT:\n')[1]?.length || 0,
        hasContent: doc.includes('CONTENT:') && !doc.includes('Error:')
      })))
      
      // Get selected template
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
      if (!selectedTemplate) {
        throw new Error('No template selected. Please select a template first.')
      }
      
      // Update progress
      setGenerationStep('Analyzing uploaded documents...')
      setGenerationProgress(20)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Chunk documents for efficient processing
      setGenerationStep('Chunking documents for optimal processing...')
      setGenerationProgress(30)
      
      const { chunkDocuments } = await import('@/lib/documentChunking')
      const documentsForChunking = completedDocuments.map(doc => ({
        extractedText: doc.content, // Fix: use doc.content instead of doc.extractedText
        fileName: doc.file.name,
        uploadedAt: new Date() // Fix: completedDocuments doesn't have uploadedAt
      }))
      
      const chunkingResults = await chunkDocuments(documentsForChunking)
      const totalChunks = chunkingResults.reduce((sum, result) => sum + result.totalChunks, 0)
      const totalTokens = chunkingResults.reduce((sum, result) => sum + result.totalTokens, 0)
      
      // Store chunking results for Generate More button
      setChunkingResults(chunkingResults.map(r => ({
        docId: r.docId,
        totalChunks: r.totalChunks
      })))
      
      console.log('📊 Document chunking complete:', {
        documents: chunkingResults.length,
        totalChunks,
        estimatedTokens: totalTokens,
        results: chunkingResults.map(r => ({
          docId: r.docId.substring(0, 8) + '...',
          chunks: r.totalChunks,
          tokens: r.totalTokens
        }))
      })
      
      setGenerationStep(`Documents chunked: ${totalChunks} chunks (~${totalTokens} tokens)`)
      setGenerationProgress(35)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setGenerationStep('Extracting requirements and user stories...')
      setGenerationProgress(40)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setGenerationStep('Generating test cases with AI...')
      setGenerationProgress(60)
      
      // Create a proper template structure for the AI
      const templateStructure = `Test Case Format:
- Test Case ID: TC-XXXX format
- Module: Functional area being tested
- Test Case: Clear description of what is being tested
- Test Steps: Numbered steps with description, test data, and expected result
- Test Result: Execution status
- QA: Quality assurance notes
- Remarks: Additional context or notes

Template: ${selectedTemplate.description}`

      // Generate test cases using OpenAI
      console.log('Calling OpenAI API with:', {
        documents: allDocumentContents,
        template: templateStructure,
        config: generationConfig,
        aiConfig: { ...aiConfig, apiKey: aiConfig.apiKey.substring(0, 10) + '...' }
      })
      
      const result = await generateTestCasesWithAI({
        documents: allDocumentContents,
        template: templateStructure,
        config: generationConfig,
        aiConfig
      })
      
      console.log('OpenAI API response:', result)
      
      // Record token usage if available
      if (result.usage) {
        addUsage({
          operation: 'generate_test_cases',
          providerId: aiConfig.providerId,
          model: aiConfig.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          fileName: completedDocuments[0]?.file.name,
          testCasesGenerated: result.testCases.length
        })
        
        console.log('Token usage recorded:', {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          model: aiConfig.model
        })
      }
      
      setGenerationProgress(80)
      setGenerationStep('Applying template structure...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Add metadata to generated test cases
      const testCasesWithMetadata = result.testCases.map((testCase: any) => ({
        ...testCase,
        // Add required fields for the TestCase interface
        templateId: selectedTemplateId || 'default',
        projectId: projectId || 'default',
        status: 'draft' as const,
        priority: 'medium' as const,
        tags: [...tags],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'system',
        estimatedTime: undefined,
        actualTime: undefined,
        lastModifiedBy: undefined,
        // Add enhancement and ticket fields
        enhancement: enhancement || undefined,
        ticketId: ticketId || undefined,
        // Store metadata in the data field for custom fields
        data: {
          module: testCase.module,
          testCase: testCase.testCase,
          testSteps: testCase.testSteps,
          testResult: testCase.testResult,
          qa: testCase.qa,
          remarks: testCase.remarks,
        }
      }))
      
      // Debug logging for all fields
      console.log('🔍 Generation Debug - User inputs:', {
        tags,
        tagsType: typeof tags,
        tagsLength: Array.isArray(tags) ? tags.length : 'not array',
        enhancement,
        ticketId,
        projectId
      })
      console.log('🔍 Generation Debug - Test cases with metadata:', testCasesWithMetadata.map(tc => ({
        id: tc.id,
        rootTags: tc.tags,
        rootTagsType: typeof tc.tags,
        rootTagsLength: Array.isArray(tc.tags) ? tc.tags.length : 'not array',
        enhancement: tc.enhancement,
        ticketId: tc.ticketId,
        dataTags: tc.data?.tags,
        dataTagsType: typeof tc.data?.tags,
        hasTags: tc.tags && tc.tags.length > 0,
        hasEnhancement: !!tc.enhancement,
        hasTicket: !!tc.ticketId
      })))
      
      setGeneratedTestCases(testCasesWithMetadata)
      setDuplicateInfo(null)
      
      // Save generated test cases to localStorage for persistence
      try {
        const documentNames = completedDocuments.map(doc => doc.file.name)
        
        // Get project name if projectId is selected
        let projectName = undefined
        if (projectId) {
          try {
            const stored = localStorage.getItem('testCaseWriter_projects')
            if (stored) {
              const projects = JSON.parse(stored)
              const project = projects.find((p: any) => p.id === projectId)
              projectName = project?.name
            }
          } catch (e) {
            console.error('Failed to get project name:', e)
          }
        }
        
        const { saveGeneratedTestCases } = await import('@/lib/test-case-storage')
        const saveResult = saveGeneratedTestCases(
          testCasesWithMetadata as TestCase[],
          completedDocuments.map(doc => doc.file.name),
          aiConfig.model,
          projectId,
          projectName,
          currentSessionId || undefined // Pass existing session ID to continue the session
        )
        
        console.log('✅ Test cases saved:', saveResult)
        
        // Update session info
        if (saveResult.sessionId && saveResult.sessionId !== 'no-new-cases') {
          setCurrentSessionId(saveResult.sessionId)
          // Update session count (get total from all sessions for this project)
          if (projectId) {
            try {
              const { getStoredTestCaseSessions } = await import('@/lib/test-case-storage')
              const sessions = getStoredTestCaseSessions()
              const currentSession = sessions.find(s => s.id === saveResult.sessionId)
              if (currentSession) {
                setSessionTestCaseCount(currentSession.totalCount)
              }
            } catch (error) {
              console.error('Failed to update session count:', error)
            }
          }
        }
        
        // Update generation step with deduplication info
        if (saveResult.skipped > 0) {
          setGenerationStep(`✅ Saved ${saveResult.saved} new test cases · 🚫 Skipped ${saveResult.skipped} duplicates`)
        } else {
          setGenerationStep(`✅ Saved ${saveResult.saved} test cases`)
        }
      } catch (saveError) {
        console.error('⚠️ Failed to save test cases:', saveError)
        // Don't fail the generation if saving fails
      }
    
    setGenerationProgress(100)
    setGenerationStep('Generation complete!')
    
    // Save current session for "Generate More" functionality
    try {
      const sessionData = {
        projectId,
        completedDocuments,
        uploadedMatrices,
        textRequirements,
        selectedTemplateId,
        tags,
        enhancement,
        ticketId,
        generationConfig,
        currentSessionId, // Include current session ID
        timestamp: Date.now()
      }
      sessionStorage.setItem('testCaseWriter_lastGenerationSession', JSON.stringify(sessionData))
      console.log('💾 Session saved for future "Generate More" operations')
    } catch (error) {
      console.error('⚠️ Failed to save session:', error)
    }
    
    setCurrentStep(6)
      
    } catch (error) {
      console.error('Generation error:', error)
      
      let errorMessage = 'An unexpected error occurred during generation.'
      
      if (error instanceof AIGenerationError) {
        errorMessage = error.message
      } else if (error instanceof OpenAIError) {
        errorMessage = `OpenAI API Error: ${error.message}`
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setGenerationError(errorMessage)
      setGenerationStep('Generation failed - check error details above')
      
      // Don't fallback to mock generation - show the actual error
      console.log('Full error details:', {
        error: error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
    } finally {
      setIsGenerating(false)
      setEstimatedTime(0)
    }
  }



  const handleReviewTestCases = () => {
    // Navigate to library with current project filter if available
    const projectParam = projectId ? `&project=${projectId}` : ''
    const url = `/library?view=generated${projectParam}`
    console.log('🔍 Navigating to:', url)
    window.location.href = url
  }

  const handleExportTestCases = () => {
    // Navigate to export with generated test cases
    window.location.href = '/export?cases=generated'
  }

  const handleViewSessionTestCases = () => {
    // Navigate to library filtered by current project
    const projectParam = projectId ? `?project=${projectId}` : ''
    const url = `/library${projectParam}`
    console.log('🔍 Session View - Navigating to:', url, { projectId })
    window.location.href = url
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Project</h2>
              <p className="text-gray-600">
                Choose which project these test cases will belong to. Projects help organize and manage your test cases effectively.
              </p>
            </div>
            
            {!currentUser ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
                <p className="text-gray-600 mb-6">
                  You need to be logged in to generate test cases and associate them with projects.
                </p>
                <Button variant="primary" onClick={() => setShowLoginModal(true)}>
                  Login to Continue
                </Button>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
                <p className="text-gray-600 mb-6">
                  You need to create a project first before generating test cases.
                </p>
                <Button variant="primary" onClick={() => window.location.href = '/projects'}>
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Choose Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          projectId === project.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setProjectId(project.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-gray-500">{project.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Don't see your project? <a href="/projects" className="underline">Create a new project</a> first.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {currentUser && projects.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep(2)}
                  disabled={!projectId}
                >
                  Next: Upload Requirements
                </Button>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Provide Requirements</h2>
              <p className="text-gray-600">
                Upload your requirements documents (PDF, Word) and test matrices (CSV, Excel) or enter requirements directly as text. Matrix files help generate more accurate test cases by defining test parameters and expected behaviors.
              </p>
            </div>
            
            <RequirementInput
              completedDocuments={completedDocuments}
              textRequirements={textRequirements}
              onDocumentsChange={setCompletedDocuments}
              onTextRequirementsChange={setTextRequirements}
              uploadProgress={uploadProgress}
              onFileUpload={handleFilesAdded}
              onFileRemoved={handleFileRemoved}
              projectId={projectId}
              enhancement={enhancement}
              ticketId={ticketId}
              tags={tags}
              onProjectChange={setProjectId}
              onEnhancementChange={setEnhancement}
              onTicketIdChange={setTicketId}
              onTagsChange={handleTagsChange}
            />
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setCurrentStep(4)}
                disabled={!canProceedFromRequirements}
              >
                Next: Select Template
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Test Case Template</h2>
              <p className="text-gray-600">
                Choose a template that matches your testing needs. This will determine the structure and fields of your generated test cases.
              </p>
            </div>
            
            <TemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={setSelectedTemplateId}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configure Generation Settings</h2>
              <p className="text-gray-600">
                Customize how test cases should be generated from your documents.
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Model Selection</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Provider
                    </label>
                    <select
                      value={getAIConfig().providerId}
                      onChange={(e) => {
                        const provider = getProvider(e.target.value)
                        if (provider) {
                          updateAIConfig({
                            providerId: provider.id,
                            provider: provider.id as any,
                            model: provider.models[0]
                          })
                        }
                      }}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {availableProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <select
                      value={getAIConfig().model}
                      onChange={(e) => updateAIConfig({ model: e.target.value })}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {currentProvider?.models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      )) || <option value="">No models available</option>}
                    </select>
                  </div>
                </div>

                {!hasValidAPIKey() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">API Key Required</p>
                        <p className="text-amber-700">Configure your {currentProvider?.name} API key in Settings to enable AI generation.</p>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowAPIKeyModal(true)}
                        >
                          Configure API Key
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Case Generation Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Coverage Level</h3>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      value: 'comprehensive',
                      label: 'Comprehensive',
                      description: 'Generate detailed test cases for all scenarios'
                    },
                    {
                      value: 'focused',
                      label: 'Focused',
                      description: 'Focus on critical paths and main features'
                    },
                    {
                      value: 'minimal',
                      label: 'Minimal',
                      description: 'Essential test cases only'
                    }
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="coverage"
                        value={option.value}
                        checked={generationConfig.coverage === option.value}
                        onChange={(e) => setGenerationConfig(prev => ({
                          ...prev,
                          coverage: e.target.value as any
                        }))}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Options</h3>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generationConfig.includeNegativeTests}
                      onChange={(e) => setGenerationConfig(prev => ({
                        ...prev,
                        includeNegativeTests: e.target.checked
                      }))}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Include Negative Tests</p>
                      <p className="text-sm text-gray-500">Generate tests for error conditions</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generationConfig.includeEdgeCases}
                      onChange={(e) => setGenerationConfig(prev => ({
                        ...prev,
                        includeEdgeCases: e.target.checked
                      }))}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Include Edge Cases</p>
                      <p className="text-sm text-gray-500">Test boundary conditions</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Test Cases
                    </label>
                    <input
                      type="number"
                      value={generationConfig.maxTestCases}
                      onChange={(e) => setGenerationConfig(prev => ({
                        ...prev,
                        maxTestCases: parseInt(e.target.value) || 50
                      }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="1"
                      max="200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Instructions
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Add your specific testing requirements, scenarios, or instructions for the AI to follow when generating test cases.
                    </p>
                    <textarea
                      value={generationConfig.customInstructions}
                      onChange={(e) => setGenerationConfig(prev => ({
                        ...prev,
                        customInstructions: e.target.value
                      }))}
                      onPaste={(e) => {
                        // Handle clipboard paste
                        const pastedText = e.clipboardData.getData('text')
                        if (pastedText) {
                          e.preventDefault()
                          setGenerationConfig(prev => ({
                            ...prev,
                            customInstructions: prev.customInstructions + pastedText
                          }))
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle Ctrl+V (Cmd+V on Mac)
                        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                          e.preventDefault()
                          navigator.clipboard.readText().then(text => {
                            if (text) {
                              setGenerationConfig(prev => ({
                                ...prev,
                                customInstructions: prev.customInstructions + text
                              }))
                            }
                          }).catch(err => {
                            console.log('Clipboard read failed, using default paste behavior')
                          })
                        }
                      }}
                      className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
                      rows={6}
                      placeholder="Any specific requirements or focus areas for test generation...&#10;&#10;You can paste your custom instructions here using Ctrl+V (or Cmd+V on Mac)"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Paste using Ctrl+V or right-click → Paste</span>
                        <Button
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText()
                              if (text) {
                                setGenerationConfig(prev => ({
                                  ...prev,
                                  customInstructions: prev.customInstructions + text
                                }))
                              }
                            } catch (err) {
                              console.log('Clipboard read failed:', err)
                              // Fallback: try to paste using execCommand
                              const textarea = document.createElement('textarea')
                              textarea.value = ''
                              document.body.appendChild(textarea)
                              textarea.focus()
                              document.execCommand('paste')
                              const pastedText = textarea.value
                              document.body.removeChild(textarea)
                              if (pastedText) {
                                setGenerationConfig(prev => ({
                                  ...prev,
                                  customInstructions: prev.customInstructions + pastedText
                                }))
                              }
                            }
                          }}
                          size="sm"

                          variant="secondary"
                          className="text-xs h-6 px-2"
                        >
                          Paste
                        </Button>
                        <Button
                          onClick={() => setGenerationConfig(prev => ({
                            ...prev,
                            customInstructions: ''
                          }))}
                          size="sm"
                          variant="secondary"
                          className="text-xs h-6 px-2"
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={() => setGenerationConfig(prev => ({
                            ...prev,
                            customInstructions: `Generate comprehensive test coverage for each requirement including:
- Positive scenarios (happy path, valid data, boundary conditions)
- Negative scenarios (invalid inputs, error conditions, unauthorized access)
- Edge cases (extreme values, special characters, concurrent operations)
- Integration scenarios (API interactions, database operations)
- Security scenarios (input validation, authentication, data sanitization)
- Performance scenarios (load conditions, resource limits)

CRITICAL ORDERING: Generate test cases in the EXACT SAME ORDER as requirements appear in the document. Maintain logical flow and sequential numbering (TC-0001, TC-0002, TC-0003...).

Ensure each test case has detailed steps with specific test data and expected results.`
                          }))}
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 px-2"
                        >
                          Reset to Default
                        </Button>
                      </div>
                      <span className="text-xs text-gray-500">{generationConfig.customInstructions.length} characters</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep(5)}>
                Next: Review Settings
              </Button>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Review & Generate</h2>
              <p className="text-gray-600">
                Review your settings and generate test cases from your documents.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Requirements ({completedDocuments.length + textRequirements.length + uploadedMatrices.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {completedDocuments.map((doc, index) => (
                      <div key={`doc-${index}`} className="flex items-center space-x-2 text-sm">
                          <FileText className="h-4 w-4 text-primary-600" />
                        <span className="truncate">{doc.file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({Math.ceil(doc.content.length / 4)} tokens)
                        </span>
                      </div>
                    ))}
                    {textRequirements.map((_, index) => (
                      <div key={`text-${index}`} className="flex items-center space-x-2 text-sm">
                        <Edit3 className="h-4 w-4 text-blue-600" />
                        <span className="truncate">Text Requirement {index + 1}</span>
                        <span className="text-xs text-gray-500">
                          (~{Math.ceil(textRequirements[index].length / 4)} tokens)
                        </span>
                        </div>
                      ))}
                    {uploadedMatrices.map((matrixData, index) => (
                      <div key={`matrix-${index}`} className="flex items-center space-x-2 text-sm">
                        <Table className="h-4 w-4 text-green-600" />
                        <span className="truncate">{matrixData.file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({matrixData.matrix.metadata.totalScenarios} scenarios)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generation Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Provider:</span>
                      <span className="font-medium">{currentProvider?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{getAIConfig().model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coverage:</span>
                      <span className="font-medium capitalize">{generationConfig.coverage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Negative Tests:</span>
                      <span className="font-medium">{generationConfig.includeNegativeTests ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Edge Cases:</span>
                      <span className="font-medium">{generationConfig.includeEdgeCases ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Cases:</span>
                      <span className="font-medium">{generationConfig.maxTestCases}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary-200 bg-primary-50/50">
              <CardContent className="p-6 text-center">
                <Wand2 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to Generate Test Cases
                </h3>
                <p className="text-gray-600 mb-6">
                  Our AI will analyze your {completedDocuments.length + textRequirements.length + uploadedMatrices.length} requirements 
                  ({completedDocuments.length} documents + {textRequirements.length} text requirements + {uploadedMatrices.length} test matrices) 
                  and generate comprehensive test cases based on your selected template and settings.
                  {uploadedMatrices.length > 0 && <span className="block text-green-600 text-sm mt-2">✨ Test matrices will enhance accuracy by providing structured test parameters and expected behaviors.</span>}
                </p>



                {!hasValidAPIKey() && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">API Key Required</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          You need to configure your OpenAI API key in Settings &gt; AI Configuration to generate test cases with AI.
                        </p>
                        <div className="mt-3">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => window.location.href = '/settings'}
                          >
                            Configure AI Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center space-x-4">
                  <Button variant="secondary" onClick={() => setCurrentStep(4)} disabled={isGenerating}>
                    Back to Settings
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={startGeneration}
                    icon={Wand2}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Test Cases'}
                  </Button>
                </div>
                
                {isGenerating && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">{generationStep}</span>
                      <span className="text-sm text-blue-700">
                        {estimatedTime > 0 ? `~${estimatedTime}s remaining` : 'Almost done...'}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-200" 
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1 text-center">
                      {Math.round(generationProgress)}% complete
                    </div>
                  </div>
                )}

                {generationError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">AI Generation Failed</h4>
                        <p className="text-sm text-red-700 mt-1">{generationError}</p>
                        
                        <div className="mt-3 bg-red-100 p-3 rounded text-xs text-red-800">
                          <strong>Debugging Info:</strong>
                          <ul className="mt-2 list-disc pl-4 space-y-1">
                            <li>Check browser console (F12) for detailed error logs</li>
                            <li>Verify your OpenAI API key is configured in Settings</li>
                            <li>Ensure PDF documents were uploaded and parsed successfully</li>
                            <li>Check if the AI service is accessible</li>
                          </ul>
                        </div>
                        
                        <div className="mt-3 flex space-x-3">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setGenerationError(null)}
                          >
                            Dismiss
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={startGeneration}
                            disabled={isGenerating}
                          >
                            Retry Generation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Generation Complete</h2>
              <p className="text-gray-600">
                Your test cases have been generated successfully. Review and export them to your preferred format.
              </p>
            </div>
            
            <Card className="border-success-200 bg-success-50/50">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {generatedTestCases.length} Test Cases Generated
                </h3>
                <p className="text-gray-600 mb-4">
                  Based on your requirements, we've generated comprehensive test cases covering all scenarios, including edge cases and negative testing paths.
                </p>

                {/* Duplicate Detection Warning */}
                {duplicateInfo && (duplicateInfo.exactDuplicates > 0 || duplicateInfo.potentialDuplicates > 0) && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Potential Duplicates Detected
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            {duplicateInfo.exactDuplicates > 0 && 
                              `Found ${duplicateInfo.exactDuplicates} exact/near-duplicate test case(s). `
                            }
                            {duplicateInfo.potentialDuplicates > 0 && 
                              `Found ${duplicateInfo.potentialDuplicates} potentially similar test case(s). `
                            }
                            You may want to review these in the Library page to avoid redundancy.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedTestCases.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Generated Test Cases:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {generatedTestCases.slice(0, 3).map((testCase, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-primary-600 font-mono">{testCase.id}</span>
                          <span>-</span>
                          <span>{testCase.testCase}</span>
                        </li>
                      ))}
                      {generatedTestCases.length > 3 && (
                        <li className="text-gray-500">+ {generatedTestCases.length - 3} more test cases...</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Current Session Info */}
                {currentSessionId && sessionTestCaseCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Current Session</h4>
                        <p className="text-sm text-blue-700">
                          {sessionTestCaseCount} total test case{sessionTestCaseCount !== 1 ? 's' : ''} generated
                          {projectId && projects.find(p => p.id === projectId) && (
                            <span className="ml-2">• Project: {projects.find(p => p.id === projectId)?.name}</span>
                          )}
                        </p>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleViewSessionTestCases}
                        className="border-blue-300 text-blue-600 hover:bg-blue-100"
                      >
                        <FolderOpen className="h-4 w-4 mr-1" />
                        View in Library
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Generate More Section */}
                {chunkingResults.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Generate Additional Test Cases</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Process remaining document chunks to generate more test cases with the same settings.
                    </p>
                    {chunkingResults.map((result, index) => (
                      <div key={result.docId} className="mb-3">
                        <GenerateMoreButton
                          docId={result.docId}
                          projectId={projectId}
                          enhancement={enhancement}
                          ticketId={ticketId}
                          tags={tags}
                          settings={{
                            model: settings.ai.model || 'gpt-4o-mini',
                            maxCases: generationConfig.maxTestCases,
                            temperature: settings.ai.temperature || 0.2,
                            schemaVersion: 'v1',
                            promptTemplateVersion: 'v1.0',
                            projectId
                          }}
                          onProgress={(step) => setGenerationStep(step)}
                          onComplete={(result) => {
                            console.log('Generate More completed:', result)
                            // Refresh session stats to show updated count
                            loadSessionStats()
                          }}
                        />
                        {chunkingResults.length > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Document {index + 1} of {chunkingResults.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Primary Action Buttons */}
                <div className="flex justify-center space-x-3 mb-4">
                  <Button 
                    variant="primary" 
                    size="lg"
                    icon={FolderOpen}
                    onClick={handleReviewTestCases}
                    className="px-6"
                  >
                    View All Test Cases in Library
                  </Button>
                </div>
                
                {/* Secondary Actions */}
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="secondary" 
                    icon={Wand2}
                    onClick={() => {
                      // Keep everything and just trigger generation again
                      setGenerationProgress(0)
                      setGenerationStep('')
                      // Trigger generation with existing documents
                      startGeneration()
                    }}
                  >
                    Generate More
                  </Button>
                  <Button 
                    variant="secondary" 
                    icon={Download}
                    onClick={handleExportTestCases}
                  >
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Generate Test Cases"
    >
      <div className="space-y-10">
        <StepIndicator steps={steps} currentStep={currentStep} />
        <div className="max-w-5xl mx-auto">
        {renderStepContent()}
        </div>
      </div>

      {/* API Key Configuration Modal */}
      <APIKeyModal
        isOpen={showAPIKeyModal}
        onClose={() => setShowAPIKeyModal(false)}
        onSuccess={() => {
          // Modal closes automatically, no need to force re-render
          // The context will update automatically
          setShowAPIKeyModal(false)
        }}
      />
    </Layout>
  )
}