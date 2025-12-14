"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Pencil, Trash2, Loader2, Tag, CheckSquare, Square } from "lucide-react"
import { useRouter } from "next/navigation"
import { Category } from "@/types"
import { getCategories, deleteCategory, deleteCategories, createCategory } from "@/lib/api"
import { CategoryDialog } from "@/components/categories/category-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false)
  
  const loadCategories = React.useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error: any) {
      console.error("Failed to load categories:", error)
      console.error("Error message:", error.message || "Unknown error")
      toast.error("Failed to load categories")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleDelete = async () => {
    if (!categoryToDelete) return
    try {
      if (categoryToDelete.is_default) {
        // Soft delete for default categories: Create a tombstone custom category
        await createCategory({
          name: `___DELETED___${categoryToDelete.name}`,
          color: categoryToDelete.color,
          type: categoryToDelete.type,
          icon: 'Trash' 
        })
      } else {
        // Normal delete for custom categories
        await deleteCategory(categoryToDelete.id)
      }
      toast.success("Category deleted successfully")
      loadCategories()
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`)
    } finally {
      setCategoryToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await deleteCategories(Array.from(selectedIds))
      toast.success(`${selectedIds.size} categories deleted successfully`)
      setSelectedIds(new Set())
      loadCategories()
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`)
    } finally {
      setShowBulkDeleteDialog(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const toggleSelectAll = (categoryList: Category[]) => {
    const deletableCategories = categoryList.filter(c => !c.is_default)
    const deletableIds = deletableCategories.map(c => c.id)
    const allSelected = deletableIds.every(id => selectedIds.has(id))
    
    if (allSelected) {
      // Deselect all from this list
      const newSelection = new Set(selectedIds)
      deletableIds.forEach(id => newSelection.delete(id))
      setSelectedIds(newSelection)
    } else {
      // Select all from this list
      const newSelection = new Set(selectedIds)
      deletableIds.forEach(id => newSelection.add(id))
      setSelectedIds(newSelection)
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Group categories by type
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const renderCategoryList = (categoryList: Category[]) => {
    // 1. Identify which default categories are "deleted" (hidden by a tombstone custom category)
    const DELETED_PREFIX = "___DELETED___"
    const hiddenDefaultNames = new Set(
      categoryList
        .filter(c => !c.is_default && c.name.startsWith(DELETED_PREFIX))
        .map(c => c.name.replace(DELETED_PREFIX, ""))
    )

    // 2. Identify which default categories are overridden by a custom category (same name)
    const customNames = new Set(categoryList.filter(c => !c.is_default && !c.name.startsWith(DELETED_PREFIX)).map(c => c.name))
    
    // 3. Filter the list
    const visibleCategories = categoryList.filter(c => {
      // Hide the tombstone categories themselves
      if (c.name.startsWith(DELETED_PREFIX)) return false
      
      if (c.is_default) {
        // Hide if it's marked as deleted
        if (hiddenDefaultNames.has(c.name)) return false
        // Hide if it's overridden by a custom one
        if (customNames.has(c.name)) return false
      }
      return true
    })

    const deletableCategories = visibleCategories // All visible categories can be "deleted" now
    const hasSelectableItems = deletableCategories.length > 0
    const allSelected = hasSelectableItems && deletableCategories.every(c => selectedIds.has(c.id))
    const someSelected = hasSelectableItems && deletableCategories.some(c => selectedIds.has(c.id))

    return (
      <>
        {hasSelectableItems && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => toggleSelectAll(categoryList)}
              className="h-4 w-4"
            />
            <span className="text-xs text-muted-foreground">
              {allSelected ? 'Deselect all' : someSelected ? 'Select all' : 'Select all'}
            </span>
          </div>
        )}
        {visibleCategories.map((category) => (
          <div 
            key={category.id} 
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-center w-4 h-4">
              {!category.is_default ? (
                <Checkbox
                  checked={selectedIds.has(category.id)}
                  onCheckedChange={() => toggleSelection(category.id)}
                  className="h-4 w-4"
                />
              ) : <div className="w-4" />}
            </div>
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                {category.is_default && (
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setEditingCategory(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {!category.is_default && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setCategoryToDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manage Categories</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Customize your income and expense categories
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearSelection}
              >
                Clear ({selectedIds.size})
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedIds.size}
              </Button>
            </>
          )}
          <CategoryDialog onSuccess={loadCategories} trigger={
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          } />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
           <Skeleton className="h-[300px] rounded-xl" />
           <Skeleton className="h-[300px] rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Income Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <Tag className="h-5 w-5" />
                Income Categories
              </CardTitle>
              <CardDescription>
                Categories for your earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderCategoryList(incomeCategories)}
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Tag className="h-5 w-5" />
                Expense Categories
              </CardTitle>
              <CardDescription>
                Categories for your spending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderCategoryList(expenseCategories)}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      {editingCategory && (
        <CategoryDialog 
          category={editingCategory} 
          open={!!editingCategory} 
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onSuccess={loadCategories}
        />
      )}

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?
              Transactions associated with this category will NOT be deleted but might display the deleted category name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected {selectedIds.size === 1 ? 'category' : 'categories'}?
              This action cannot be undone. Transactions associated with these categories will NOT be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
