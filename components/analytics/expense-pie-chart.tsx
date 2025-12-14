"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction } from "@/types"
import { formatCurrency } from "@/lib/utils"

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b"
]

interface ExpensePieChartProps {
  transactions: Transaction[]
}

export function ExpensePieChart({ transactions }: ExpensePieChartProps) {
  const data = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const categoryTotals: Record<string, number> = {}

    expenses.forEach(t => {
        // Use abstract value to summing up
      const amount = Math.abs(t.amount)
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount
    })

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  const totalExpense = data.reduce((sum, item) => sum + item.value, 0)

  if (transactions.length === 0 || totalExpense === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>No expense data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload
      const percent = ((value / totalExpense) * 100).toFixed(1)
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
          <p className="font-medium">{name}</p>
          <p className="text-muted-foreground">
            {formatCurrency(value)} ({percent}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>
          Distribution by category
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
