"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, ArrowRight, TrendingUp, Shield, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        router.push('/transactions')
      } else {
        setIsLoading(false)
      }
    }
    
    checkUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden relative">
      {/* Theme toggle - fixed top right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 animate-in fade-in duration-700 delay-1000">
        <ThemeToggle />
      </div>

      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="text-center space-y-6 sm:space-y-8 md:space-y-10">
          {/* Logo with enhanced animation */}
          <div className="flex justify-center animate-in zoom-in duration-700 delay-100">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <Wallet className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white animate-in zoom-in duration-500 delay-300" />
              </div>
            </div>
          </div>
          
          {/* Title with stagger animation */}
          <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-bottom-6 duration-700 delay-200">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight px-4">
              <span className="inline-block animate-in slide-in-from-left duration-700 delay-300">Money</span>
              <span className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent animate-in slide-in-from-right duration-700 delay-400">Flow</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4 animate-in fade-in duration-700 delay-500">
              Simple, beautiful finance tracking for the modern age
            </p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-4 animate-in fade-in duration-700 delay-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Track</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Secure</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Fast</span>
            </div>
          </div>
          
          {/* CTA Buttons with enhanced animations */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 pt-4 sm:pt-6 animate-in slide-in-from-bottom-6 duration-700 delay-700">
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-white dark:to-slate-100 dark:hover:from-slate-100 dark:hover:to-white dark:text-slate-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Trust indicator */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 animate-in fade-in duration-700 delay-1000 px-4">
            Join thousands managing their finances smarter
          </p>
        </div>
      </div>
    </div>
  )
}
