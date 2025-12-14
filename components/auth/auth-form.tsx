"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"

export function AuthForm() {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isSignUp, setIsSignUp] = React.useState<boolean>(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        if (error) throw error
        setMessage("Check your email for confirmation link!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        window.location.href = "/"
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 border-slate-200 dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {message && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 text-sm animate-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <Button 
          disabled={isLoading} 
          type="submit" 
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 transition-all duration-200 hover:scale-[1.02] shadow-lg font-medium"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSignUp ? "Create Account" : "Sign In"}
        </Button>
      </form>

      {/* Toggle Sign In/Up */}
      <div className="text-center text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
        </span>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setMessage(null)
          }}
          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline-offset-4 hover:underline"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  )
}
