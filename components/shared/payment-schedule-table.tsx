"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import { PaymentScheduleItem } from "@/types"

interface PaymentScheduleTableProps {
  schedule: PaymentScheduleItem[]
  onChange: (schedule: PaymentScheduleItem[]) => void
}

export function PaymentScheduleTable({ schedule, onChange }: PaymentScheduleTableProps) {
  const addMonth = () => {
    const newMonth = schedule.length + 1
    const today = new Date().toISOString().split('T')[0]
    onChange([...schedule, { month: newMonth, due_date: today, principal: 0, interest: 0 }])
  }

  const removeMonth = (index: number) => {
    const newSchedule = schedule.filter((_, i) => i !== index)
    // Renumber months
    const renumbered = newSchedule.map((item, i) => ({ ...item, month: i + 1 }))
    onChange(renumbered)
  }

  const updateMonth = (index: number, field: keyof PaymentScheduleItem, value: string | number) => {
    const newSchedule = [...schedule]
    newSchedule[index] = { ...newSchedule[index], [field]: value }
    onChange(newSchedule)
  }

  const totals = React.useMemo(() => {
    return schedule.reduce(
      (acc, item) => ({
        principal: acc.principal + item.principal,
        interest: acc.interest + item.interest,
        total: acc.total + item.principal + item.interest
      }),
      { principal: 0, interest: 0, total: 0 }
    )
  }, [schedule])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Payment Schedule</Label>
        <Button type="button" size="sm" onClick={addMonth} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Period
        </Button>
      </div>

      {schedule.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
          <p className="text-sm">No payment schedule defined yet.</p>
          <p className="text-xs mt-1">Click "Add Period" to create your payment plan.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Principal (฿)</th>
                  <th className="px-4 py-3 text-right font-semibold">Interest (฿)</th>
                  <th className="px-4 py-3 text-right font-semibold">Total (฿)</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {item.month}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="date"
                        value={item.due_date}
                        onChange={(e) => updateMonth(index, 'due_date', e.target.value)}
                        className="w-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.principal || ''}
                        onChange={(e) => {
                          const val = e.target.valueAsNumber
                          updateMonth(index, 'principal', isNaN(val) ? 0 : val)
                        }}
                        className="text-right w-32"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.interest || ''}
                        onChange={(e) => {
                          const val = e.target.valueAsNumber
                          updateMonth(index, 'interest', isNaN(val) ? 0 : val)
                        }}
                        className="text-right w-32"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {(item.principal + item.interest).toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMonth(index)}
                        className="h-8 w-8 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-primary/5 font-bold">
                  <td className="px-4 py-3" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {totals.principal.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {totals.interest.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {totals.total.toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {schedule.length > 0 && (
        <p className="text-xs text-muted-foreground">
          💡 Tip: Payments will be allocated to interest first, then principal for each period in order.
        </p>
      )}
    </div>
  )
}
