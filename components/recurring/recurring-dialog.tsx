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
import { createRecurringTransaction, updateRecurringTransaction, getCategories } from "@/lib/api"
import { RecurringTransaction, Category } from "@/types"
import { toast } from "sonner"

interface RecurringDialogProps {
  transaction?: RecurringTransaction
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function RecurringDialog({ transaction, open, onOpenChange, onSuccess, trigger }: RecurringDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [formData, setFormData] = React.useState({
    description: transaction?.description || "",
    amount: transaction?.amount.toString() || "",
    category: transaction?.category || "",
    type: transaction?.type || "expense" as "income" | "expense",
    frequency: transaction?.frequency || "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    start_date: transaction?.start_date || new Date().toISOString().split('T')[0],
    end_date: transaction?.end_date || "",
    is_active: transaction?.is_active ?? true
  })

  React.useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const availableCategories = categories.filter(c => c.type === formData.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const payload = {
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        type: formData.type,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        is_active: formData.is_active
      }

      if (transaction) {
        await updateRecurringTransaction(transaction.id, payload)
        toast.success("Recurring transaction updated")
      } else {
        await createRecurringTransaction(payload)
        toast.success("Recurring transaction created")
      }
      
      onOpenChange?.(false)
      setFormData({ 
        description: "", 
        amount: "", 
        category: "", 
        type: "expense", 
        frequency: "monthly", 
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        is_active: true
      })
      onSuccess()
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Recurring Transaction" : "New Recurring Transaction"}</DialogTitle>
          <DialogDescription>
            Create a template for transactions that repeat automatically
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as "income" | "expense", category: ""})}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value as any})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Netflix subscription"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (฿)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            {transaction && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="text-sm font-normal">
                  Active (generate transactions automatically)
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {transaction ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
