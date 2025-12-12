"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wallet, Receipt, Users, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProfile } from "@/lib/profile"
import Image from "next/image"

interface NavigationProps {
  user: {
    email?: string
  }
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname()
  const [profile, setProfile] = React.useState<any>(null)

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (error) {
        console.error("Failed to load profile:", error)
      }
    }
    loadProfile()
  }, [])

  const links = [
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/shared", label: "Shared Expenses", icon: Users },
  ]

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/transactions" className="flex items-center gap-2 font-bold text-xl">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                Zenith Ledger
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "gap-2",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Link href="/profile">
              <Button variant="ghost" size="icon" title="Profile" className="rounded-full p-0 h-9 w-9 overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
