import { AuthForm } from "@/components/auth/auth-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 relative overflow-hidden">
      {/* Theme toggle - fixed top right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 animate-in fade-in duration-700 delay-500">
        <ThemeToggle />
      </div>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
          <CardHeader className="space-y-6 text-center pb-6 sm:pb-8 px-4 sm:px-6">
            {/* Logo with enhanced animation */}
            <div className="flex justify-center animate-in zoom-in duration-500 delay-100">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Title with stagger animation */}
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                MoneyFlow
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Sign in to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8 animate-in fade-in duration-700 delay-300">
            <AuthForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
