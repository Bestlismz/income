"use client"

import * as React from "react"
import { getTransactions } from "@/lib/api"
import { Transaction } from "@/types"
import { ExpensePieChart } from "@/components/analytics/expense-pie-chart"
import { MonthlyBarChart } from "@/components/analytics/monthly-bar-chart"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, ArrowLeft } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AnalyticsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    getTransactions().then(data => {
      setTransactions(data)
      setIsLoading(false)
    }).catch(console.error)
  }, [])

  // Calculate high-level metrics for current month
  const metrics = React.useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const income = currentMonthTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
      
    const expense = currentMonthTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const balance = income - expense
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0

    return { income, expense, balance, savingsRate }
  }, [transactions])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
                Financial insights for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(metrics.income)}</div>
            <p className="text-xs text-muted-foreground">Current Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(metrics.expense)}</div>
            <p className="text-xs text-muted-foreground">Current Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              {formatCurrency(metrics.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Current Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{metrics.savingsRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">of Income</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <MonthlyBarChart transactions={transactions} />
        <ExpensePieChart transactions={transactions} />
      </div>
    </div>
  )
}
