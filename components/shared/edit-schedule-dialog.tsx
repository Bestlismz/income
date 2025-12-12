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
import { PaymentScheduleItem } from "@/types"
import { PaymentScheduleTable } from "./payment-schedule-table"

interface EditScheduleDialogProps {
  schedule: PaymentScheduleItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (schedule: PaymentScheduleItem[]) => Promise<void>
}

export function EditScheduleDialog({ schedule, open, onOpenChange, onSave }: EditScheduleDialogProps) {
  const [editedSchedule, setEditedSchedule] = React.useState<PaymentScheduleItem[]>(schedule)
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setEditedSchedule(schedule)
    }
  }, [open, schedule])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(editedSchedule)
      onOpenChange(false)
    } catch (error: any) {
      alert(`Failed to update schedule: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment Schedule</DialogTitle>
          <DialogDescription>
            Add, edit, or remove payment periods
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PaymentScheduleTable 
            schedule={editedSchedule}
            onChange={setEditedSchedule}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
