"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { createBudget, updateBudget, getCategories } from "@/lib/api"
import { Budget, Category } from "@/types"
import { toast } from "sonner"

interface BudgetDialogProps {
  budget?: Budget
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function BudgetDialog({ budget, open, onOpenChange, onSuccess, trigger }: BudgetDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [formData, setFormData] = React.useState({
    category: budget?.category || "",
    amount: budget?.amount.toString() || "",
    month: budget?.month || new Date().toISOString().substring(0, 7) + "-01"
  })

  React.useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (budget) {
        await updateBudget(budget.id, {
          category: formData.category,
          amount: Number(formData.amount),
          month: formData.month
        })
        toast.success("Budget updated successfully")
      } else {
        await createBudget({
          category: formData.category,
          amount: Number(formData.amount),
          month: formData.month
        })
        toast.success("Budget created successfully")
      }
      
      onOpenChange?.(false)
      setFormData({ category: "", amount: "", month: new Date().toISOString().substring(0, 7) + "-01" })
      onSuccess()
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Set Budget"}</DialogTitle>
          <DialogDescription>
            Set a monthly spending limit for a category
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="month"
                value={formData.month.substring(0, 7)}
                onChange={(e) => setFormData({ ...formData, month: e.target.value + "-01" })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="" disabled>Select category</option>
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Limit (฿)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {budget ? "Update" : "Create"} Budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
