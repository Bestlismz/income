"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wallet, Receipt, Users, LogOut, User, LayoutDashboard } from "lucide-react"
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
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/savings", label: "Savings", icon: Wallet },
    { href: "/shared", label: "Shared", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
  ]

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <>
      {/* Top Bar - Desktop & Mobile */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                MoneyFlow
              </span>
            </Link>
              
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.slice(0, 4).map((link) => {
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

            {/* Desktop User Section */}
            <div className="hidden md:flex items-center gap-2">
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

            {/* Mobile - Theme Toggle & Logout */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut}
                className="hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 h-10 w-10"
              >
                <LogOut className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 backdrop-blur-lg pb-safe">
        <div className="grid grid-cols-5 h-16">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                  isActive
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 active:text-blue-500 dark:active:text-blue-400"
                )}
              >
                <Icon className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Padding for Mobile - Prevents content from being hidden behind bottom nav */}
      <div className="md:hidden h-16" />
    </>
  )
}
