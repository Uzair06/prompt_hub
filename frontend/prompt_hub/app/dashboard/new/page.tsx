'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import PromptEditor, { PromptData } from '@/components/ui/PromptEditor'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function NewPromptPage() {
  const router = useRouter()
  const { user } = useUser()

  const handleSave = async (data: PromptData) => {
    try {
      const response = await axios.post(`${API_URL}/prompts`, {
        ...data,
        userId: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Show success message (we'll implement toast later)
      alert('Prompt created successfully!')
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating prompt:', error)
      alert('Failed to create prompt. Please try again.')
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  return (
    <div>
      <PromptEditor onSave={handleSave} onCancel={handleCancel} />
    </div>
  )
}