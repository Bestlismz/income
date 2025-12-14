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
import { Loader2 } from "lucide-react"
import { SavingsGoal } from "@/types"
import { createSavingsGoal, updateSavingsGoal } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const GOAL_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
]

interface SavingsGoalDialogProps {
  goal?: SavingsGoal
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function SavingsGoalDialog({ goal, open, onOpenChange, onSuccess, trigger }: SavingsGoalDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [color, setColor] = React.useState(goal?.color || GOAL_COLORS[0])

  // Sync internal state with props when dialog opens/updates
  React.useEffect(() => {
    if (goal) {
      setColor(goal.color)
    } else {
      setColor(GOAL_COLORS[0])
    }
  }, [goal, open, isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      if (goal) {
        await updateSavingsGoal(goal.id, {
          name: formData.get('name') as string,
          target_amount: Number(formData.get('target_amount')),
          deadline: formData.get('deadline') as string || undefined,
          color,
        })
        toast.success("Goal updated successfully")
      } else {
        await createSavingsGoal({
          name: formData.get('name') as string,
          target_amount: Number(formData.get('target_amount')),
          current_amount: 0,
          deadline: formData.get('deadline') as string || undefined,
          color,
          icon: 'PiggyBank'
        })
        toast.success("Goal created successfully")
      }
      
      setIsOpen(false)
      onOpenChange?.(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Controlled vs Uncontrolled
  const showDialog = open !== undefined ? open : isOpen
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Dialog open={showDialog} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{goal ? 'Edit Goal' : 'Create Savings Goal'}</DialogTitle>
            <DialogDescription>
              Set a target for something you want to buy or do.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={goal?.name}
                placeholder="e.g., New Laptop, Japan Trip"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Amount (฿)</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="number"
                step="0.01"
                defaultValue={goal?.target_amount}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={goal?.deadline}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      color === c ? "ring-2 ring-offset-2 ring-black dark:ring-white scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
