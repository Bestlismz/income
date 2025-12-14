"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wallet, Receipt, Users, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProfile } from "@/lib/profile"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

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
    { href: "/dashboard", label: "Dashboard", icon: Wallet },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/shared", label: "Shared Expenses", icon: Users },
  ]

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              MoneyFlow
            </span>
          </Link>
            
          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "gap-2 transition-all duration-200",
                      isActive 
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium" 
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/profile">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
