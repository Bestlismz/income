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
import { Loader2, Plus, GripVertical } from "lucide-react"
import { Category } from "@/types"
import { createCategory, updateCategory } from "@/lib/api" // We'll add updateCategory later or handle it here if valid
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Predefined colors for categories
const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate
]

interface CategoryDialogProps {
  category?: Category
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CategoryDialog({ category, open, onOpenChange, onSuccess, trigger }: CategoryDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [type, setType] = React.useState<'income' | 'expense'>(category?.type || 'expense')
  const [color, setColor] = React.useState(category?.color || CATEGORY_COLORS[0])

  // Sync internal state with props when dialog opens/updates
  React.useEffect(() => {
    if (category) {
      setType(category.type)
      setColor(category.color)
    } else {
      // Reset defaults for new category
      setType('expense')
      setColor(CATEGORY_COLORS[0])
    }
  }, [category, open, isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      if (category && !category.is_default) {
        await updateCategory(category.id, {
          name: formData.get('name') as string,
          color,
          type,
        })
        toast.success("Category updated successfully")
      } else {
        // Create new category (for new or editing default)
        await createCategory({
          name: formData.get('name') as string,
          color,
          type,
          icon: 'Circle' // Default icon for now
        })
        toast.success(category && category.is_default ? "Category customized successfully" : "Category created successfully")
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

  // Controlled vs Uncontrolled open state
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
            <DialogTitle>{category ? (category.is_default ? 'Customize Category' : 'Edit Category') : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {category ? 'Edit the details of this category.' : 'Add a new category to organize your finances.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === 'income' ? 'default' : 'outline'}
                  onClick={() => setType('income')}
                  className={cn(type === 'income' && "bg-green-600 hover:bg-green-700")}
                >
                  Income
                </Button>
                <Button
                  type="button"
                  variant={type === 'expense' ? 'default' : 'outline'}
                  onClick={() => setType('expense')}
                  className={cn(type === 'expense' && "bg-red-600 hover:bg-red-700")}
                >
                  Expense
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category?.name}
                placeholder="e.g., Groceries"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((c) => (
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
              {category ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
