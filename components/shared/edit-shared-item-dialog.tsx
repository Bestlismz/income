"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SharedItem, PaymentScheduleItem } from "@/types"
import { PaymentScheduleTable } from "./payment-schedule-table"

interface EditSharedItemDialogProps {
  item: SharedItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<SharedItem>) => Promise<void>
}

export function EditSharedItemDialog({ item, open, onOpenChange, onSave }: EditSharedItemDialogProps) {
  const [paymentSchedule, setPaymentSchedule] = React.useState<PaymentScheduleItem[]>(
    item.payment_schedule || []
  )
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setPaymentSchedule(item.payment_schedule || [])
    }
  }, [open, item])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)

    const formData = new FormData(e.currentTarget)
    
    const scheduleTotals = paymentSchedule.reduce(
      (acc, item) => ({
        principal: acc.principal + item.principal,
        interest: acc.interest + item.interest
      }),
      { principal: 0, interest: 0 }
    )

    try {
      await onSave({
        title: formData.get('title') as string,
        total_amount: Number(formData.get('total_amount')),
        principal_amount: scheduleTotals.principal > 0 ? scheduleTotals.principal : undefined,
        interest_amount: scheduleTotals.interest > 0 ? scheduleTotals.interest : undefined,
        payment_schedule: paymentSchedule.length > 0 ? paymentSchedule : undefined,
        due_date: (formData.get('due_date') as string) || undefined,
      })
      onOpenChange(false)
    } catch (error: any) {
      alert(`Failed to update: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Shared Expense</DialogTitle>
            <DialogDescription>
              Update the details of this shared expense
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                name="title"
                defaultValue={item.title}
                placeholder="e.g., Condo Payment"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-total">Total Amount (฿)</Label>
              <Input
                id="edit-total"
                name="total_amount"
                type="number"
                step="0.01"
                defaultValue={item.total_amount}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                This should match the sum of all months in the schedule
              </p>
            </div>
            
            <PaymentScheduleTable 
              schedule={paymentSchedule}
              onChange={setPaymentSchedule}
            />

            <div className="space-y-2">
              <Label htmlFor="edit-due-date">Due Date (Optional)</Label>
              <Input
                id="edit-due-date"
                name="due_date"
                type="date"
                defaultValue={item.due_date}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
