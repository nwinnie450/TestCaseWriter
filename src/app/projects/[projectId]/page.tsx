'use client'

import React from 'react'
import { useParams } from 'next/navigation'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Project Details</h1>
      <p>Project ID: {projectId}</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Project details will be displayed here.</p>
            </div>
          </div>
  )
}