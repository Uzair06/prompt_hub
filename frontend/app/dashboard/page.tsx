'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Prompt {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      // We'll implement this API call later
      setPrompts([])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching prompts:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading prompts...</div>
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Edit className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          No prompts yet
        </h2>
        <p className="text-gray-500 mb-6">
          Create your first prompt to get started
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Prompts</h1>
        <p className="text-gray-600 mt-1">
          Manage and organize your AI prompts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="line-clamp-1">{prompt.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {prompt.content}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {prompt.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}