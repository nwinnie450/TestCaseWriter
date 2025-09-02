'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  FileText, 
  Brain, 
  Target, 
  Users, 
  Building,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { DocumentContext, RequirementSection } from '@/lib/document-analyzer'

interface DocumentAnalysisCardProps {
  analysis: DocumentContext
  sections: RequirementSection[]
  onApplyContext: (context: any) => void
  onApplySectionContext: (section: RequirementSection) => void
}

export function DocumentAnalysisCard({ 
  analysis, 
  sections, 
  onApplyContext, 
  onApplySectionContext 
}: DocumentAnalysisCardProps) {
  
  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getComplexityIcon = (level: string) => {
    switch (level) {
      case 'complex': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'moderate': return <Info className="w-4 h-4 text-yellow-600" />
      default: return <CheckCircle className="w-4 h-4 text-green-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Document Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Smart Document Analysis</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            AI-powered analysis of your requirements documents and test matrices
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Analysis Confidence</span>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getConfidenceColor(analysis.confidenceScore)}`}>
              {Math.round(analysis.confidenceScore * 100)}%
            </div>
          </div>

          {/* Complexity Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Document Complexity</span>
            <div className="flex items-center space-x-2">
              {getComplexityIcon(analysis.complexityLevel)}
              <span className="text-sm capitalize">{analysis.complexityLevel}</span>
            </div>
          </div>

          {/* Detected Features */}
          {analysis.detectedFeatures.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Detected Features
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.detectedFeatures.map((feature) => (
                  <span key={feature} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                    {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Domains */}
          {analysis.suggestedDomains.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Building className="w-4 h-4 mr-1" />
                Suggested Business Domains
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestedDomains.map((domain) => (
                  <span key={domain} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium capitalize">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Identified User Roles */}
          {analysis.identifiedUserRoles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Identified User Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.identifiedUserRoles.map((role) => (
                  <span key={role} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium capitalize">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirement Sections */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Document Sections ({sections.length})</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Each section with suggested context for targeted test generation
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{section.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    section.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    section.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    section.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {section.priority}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {section.content.substring(0, 150)}...
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>🎯 {section.suggestedContext.featureCategory}</span>
                    <span>👤 {section.suggestedContext.userRole}</span>
                    <span>🏢 {section.suggestedContext.businessDomain}</span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onApplySectionContext(section)}
                    className="text-xs"
                  >
                    Use This Context
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Apply Actions */}
      <div className="flex items-center space-x-3">
        <Button
          onClick={() => onApplyContext({
            applicationType: 'web',
            featureCategory: analysis.detectedFeatures[0] || 'other',
            userRole: analysis.identifiedUserRoles[0] || 'customer',
            businessDomain: analysis.suggestedDomains[0] || 'other',
            testPriority: 'medium',
            testEnvironment: 'staging'
          })}
          className="flex-1"
        >
          Apply Overall Analysis
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => {
            // Generate multiple contexts for comprehensive testing
            const contexts = analysis.detectedFeatures.slice(0, 3).map(feature => ({
              applicationType: 'web',
              featureCategory: feature,
              userRole: analysis.identifiedUserRoles[0] || 'customer',
              businessDomain: analysis.suggestedDomains[0] || 'other',
              testPriority: 'medium',
              testEnvironment: 'staging'
            }))
            
            console.log('Generated multiple contexts for comprehensive testing:', contexts)
            // This could trigger multiple test generation runs
          }}
        >
          Generate for All Features
        </Button>
      </div>
    </div>
  )
}