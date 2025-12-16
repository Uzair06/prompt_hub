'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { user } = useUser()

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="font-semibold text-xl">Prompt Manager</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Prompt
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {user?.firstName || user?.emailAddresses[0].emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  )
}