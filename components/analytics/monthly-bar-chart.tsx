"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Transaction } from "@/types"
import { formatCurrency } from "@/lib/utils"

interface MonthlyBarChartProps {
  transactions: Transaction[]
}

export function MonthlyBarChart({ transactions }: MonthlyBarChartProps) {
  const data = React.useMemo(() => {
    // Group last 6 months
    const last6Months = new Array(6).fill(0).map((_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        income: 0,
        expense: 0
      }
    })

    transactions.forEach(t => {
      const date = new Date(t.date)
      const monthIndex = last6Months.findIndex(m => m.month === date.getMonth() && m.year === date.getFullYear())
      
      if (monthIndex !== -1) {
        if (t.type === 'income') {
          last6Months[monthIndex].income += t.amount
        } else {
          last6Months[monthIndex].expense += Math.abs(t.amount)
        }
      }
    })

    return last6Months
  }, [transactions])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg text-sm">
          <p className="font-medium mb-1">{label}</p>
          <div className="flex flex-col gap-1">
            <span className="text-green-500">
              Income: {formatCurrency(payload[0].value)}
            </span>
            <span className="text-red-500">
              Expense: {formatCurrency(payload[1].value)}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Income vs Expense</CardTitle>
        <CardDescription>
          Last 6 months comparison
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `฿${value/1000}k`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar 
              dataKey="income" 
              name="Income" 
              fill="#22c55e" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={32}
            />
            <Bar 
              dataKey="expense" 
              name="Expense" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
