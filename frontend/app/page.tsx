import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

export default function HomePage() {
  return (
    <>
      <SignedIn>
        {redirect('/dashboard')}
      </SignedIn>
      
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center space-y-6 p-8">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-4xl">P</span>
            </div>
            
            <h1 className="text-5xl font-bold text-gray-900">
              PromptHub
            </h1>
            
            <p className="text-xl text-gray-600 max-w-md mx-auto">
              Create, organize, and manage your AI prompts efficiently
            </p>
            
            <div className="flex gap-4 justify-center pt-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="px-8">
                  Get Started
                </Button>
              </SignUpButton>
              
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="px-8">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  )
}