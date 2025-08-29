import { RequirementChunk, GenerationRun, findExistingRun, saveGenerationRun, getChunksByDocId } from './chunking'
import { GenerationSettings, buildSettingsHash } from './settingsHash'
import { SaveResult, saveGeneratedTestCases } from './test-case-storage'
import { TestCase } from '@/types'
import { buildOrGetOutline } from './outline/build'
import { linkChunkToOutline } from './outline/link'
import { buildGenerationPrompt } from './prompt/buildGenerationPrompt'

export interface ChunkGenerationResult {
  saved: number
  skipped: number
  reused: boolean
  chunkId: string
  chunkIndex: number
  error?: string
}

export async function generateForChunk({
  docId,
  chunk,
  settings,
  projectId,
  onProgress
}: {
  docId: string
  chunk: RequirementChunk
  settings: GenerationSettings
  projectId?: string
  onProgress?: (step: string) => void
}): Promise<ChunkGenerationResult> {
  // Validate required parameters
  if (!chunk || !chunk.id || !settings) {
    throw new Error('Missing required parameters: chunk and settings are required')
  }
  const settingsHash = buildSettingsHash(settings)
  
  console.log(`🔧 Chunk Generation - Processing chunk ${chunk.chunkIndex} (${chunk.id?.substring(0, 8) || 'unknown'}...)`)
  
  try {
    // Idempotent check
    const existingRun = findExistingRun(chunk.id, settingsHash)
    if (existingRun) {
      console.log(`♻️ Chunk Generation - Reusing existing run for chunk ${chunk.chunkIndex}`)
      onProgress?.(`♻️ Chunk ${chunk.chunkIndex + 1} already processed`)
      return {
        saved: existingRun.saved,
        skipped: existingRun.skipped,
        reused: true,
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex
      }
    }
    
    onProgress?.(`🔄 Processing chunk ${chunk.chunkIndex + 1}...`)
    
    // Get all chunks for outline building (if docId exists)
    let chunkLinks = { featureIds: [], flowIds: [], ruleIds: [] }
    let outlineRow: any = null
    
    try {
      if (docId) {
        const allChunks = getChunksByDocId(docId)
        
        // Build or get cached outline for the entire document
        outlineRow = buildOrGetOutline(docId, allChunks.map(c => ({
          chunkIndex: c.chunkIndex,
          text: c.text
        })))
        
        // Link this specific chunk to relevant outline items
        chunkLinks = linkChunkToOutline(chunk.text, outlineRow.outline)
      } else {
        console.log('🔄 No docId provided, skipping outline integration')
      }
    } catch (error) {
      console.warn('⚠️ Outline integration failed, continuing without it:', error)
    }
    
    // Build enhanced prompt with outline context
    const jsonSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          testCase: { type: "string", description: "Clear, descriptive test case title" },
          module: { type: "string", description: "Feature/Component being tested" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          testSteps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step: { type: "number" },
                description: { type: "string" },
                testData: { type: "string" },
                expectedResult: { type: "string" }
              },
              required: ["step", "description", "expectedResult"]
            }
          },
          links: {
            type: "object",
            properties: {
              feature_ids: { type: "array", items: { type: "string" } },
              flow_ids: { type: "array", items: { type: "string" } },
              rule_ids: { type: "array", items: { type: "string" } }
            }
          }
        },
        required: ["testCase", "module", "testSteps"]
      }
    }
    
    const prompt = buildGenerationPrompt({
      docId,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.text,
      outline: outlineRow?.outline || null,
      slice: {
        features: chunkLinks.featureIds,
        flows: chunkLinks.flowIds,
        rules: chunkLinks.ruleIds
      },
      maxCases: settings.maxCases,
      schemaJson: JSON.stringify(jsonSchema, null, 2)
    })
    
    // Process chunk metadata (AI generation now happens client-side)
    const response = await processChunkMetadata({
      prompt,
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: 2000
    })
    
    let testCases: TestCase[]
    
    try {
      // Parse AI response
      const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response
      const rawCases = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.testCases || []
      
      // Convert to TestCase format
      testCases = rawCases.map((rawCase: any, index: number) => convertToTestCase(rawCase, {
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex,
        docId,
        projectId,
        index,
        chunkLinks
      }))
      
      console.log(`✅ Chunk Generation - Generated ${testCases.length} test cases for chunk ${chunk.chunkIndex}`)
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError)
      throw new Error(`Failed to parse AI response: ${parseError.message}`)
    }
    
    // Save with deduplication
    onProgress?.(`💾 Saving test cases from chunk ${chunk.chunkIndex + 1}...`)
    
    const saveResult = saveGeneratedTestCases(
      testCases,
      [`chunk-${chunk.chunkIndex}-${docId?.substring(0, 8) || 'doc'}`],
      settings.model,
      projectId,
      `Chunk ${chunk.chunkIndex + 1}`
    )
    
    // Record this generation run
    const run = saveGenerationRun({
      docId,
      chunkId: chunk.id,
      settingsHash,
      model: settings.model,
      saved: saveResult.saved,
      skipped: saveResult.skipped
    })
    
    onProgress?.(`✅ Chunk ${chunk.chunkIndex + 1} complete: ${saveResult.saved} saved, ${saveResult.skipped} skipped`)
    
    return {
      saved: saveResult.saved,
      skipped: saveResult.skipped,
      reused: false,
      chunkId: chunk.id,
      chunkIndex: chunk.chunkIndex
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Chunk Generation - Failed for chunk ${chunk.chunkIndex}:`, error)
    
    return {
      saved: 0,
      skipped: 0,
      reused: false,
      chunkId: chunk.id,
      chunkIndex: chunk.chunkIndex,
      error: errorMessage
    }
  }
}


async function processChunkMetadata({
  prompt,
  model,
  temperature,
  maxTokens
}: {
  prompt: string
  model: string
  temperature: number
  maxTokens: number
}): Promise<any[]> {
  // AI generation is now handled client-side, this just returns empty
  console.log('🔄 Server-side chunk metadata processing (AI generation moved to client-side)')
  return []
}

function convertToTestCase(rawCase: any, metadata: {
  chunkId: string
  chunkIndex: number
  docId: string
  projectId?: string
  index: number
  chunkLinks: {
    featureIds: string[]
    flowIds: string[]
    ruleIds: string[]
  }
}): TestCase {
  const timestamp = new Date()
  const testCaseId = `TC-${timestamp.getTime()}-${metadata.chunkIndex}-${metadata.index}`
  
  return {
    id: testCaseId,
    testCase: rawCase.testCase || rawCase.title || `Test Case from Chunk ${metadata.chunkIndex}`,
    module: rawCase.module || 'General',
    priority: rawCase.priority || 'medium',
    status: 'active',
    projectId: metadata.projectId,
    testSteps: rawCase.testSteps || [],
    testResult: 'Not Executed',
    qa: '',
    remarks: `Generated from chunk ${metadata.chunkIndex} of document ${metadata.docId?.substring(0, 8) || 'unknown'}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    data: {
      ...rawCase,
      chunkId: metadata.chunkId,
      chunkIndex: metadata.chunkIndex,
      docId: metadata.docId,
      generatedAt: timestamp.toISOString(),
      // Include outline links (either from AI response or from chunk linking)
      links: rawCase.links || {
        feature_ids: metadata.chunkLinks.featureIds,
        flow_ids: metadata.chunkLinks.flowIds,
        rule_ids: metadata.chunkLinks.ruleIds
      }
    }
  }
}