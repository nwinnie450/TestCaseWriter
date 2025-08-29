// Simple hash function for browser compatibility
function simpleHash(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString(16)
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16)
}

export interface GenerationSettings {
  model: string
  maxCases: number
  temperature: number
  schemaVersion: string
  promptTemplateVersion: string
  projectId?: string
}

export function buildSettingsHash(settings: GenerationSettings): string {
  const raw = [
    settings.model,
    settings.maxCases.toString(),
    settings.temperature.toString(),
    settings.schemaVersion,
    settings.promptTemplateVersion,
    settings.projectId || ''
  ].join('|')
  
  const hash = simpleHash(raw)
  console.log(`🔧 Settings Hash - Generated: ${hash.substring(0, 8)}... for settings:`, {
    model: settings.model,
    maxCases: settings.maxCases,
    temperature: settings.temperature,
    schemaVersion: settings.schemaVersion,
    promptTemplateVersion: settings.promptTemplateVersion,
    projectId: settings.projectId
  })
  
  return hash
}

export function getCurrentSettings(
  model: string = 'gpt-4o-mini',
  maxCases: number = 6,
  temperature: number = 0.2,
  projectId?: string
): GenerationSettings {
  return {
    model,
    maxCases,
    temperature,
    schemaVersion: 'v1',
    promptTemplateVersion: 'v1.0',
    projectId
  }
}

export function areSettingsEqual(a: GenerationSettings, b: GenerationSettings): boolean {
  return buildSettingsHash(a) === buildSettingsHash(b)
}