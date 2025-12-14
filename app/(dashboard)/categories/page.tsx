"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Pencil, Trash2, Loader2, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { Category } from "@/types"
import { getCategories, deleteCategory } from "@/lib/api"
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

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)
  
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
      await deleteCategory(categoryToDelete.id)
      toast.success("Category deleted successfully")
      loadCategories()
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`)
    } finally {
      setCategoryToDelete(null)
    }
  }

  // Group categories by type
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

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
        <CategoryDialog onSuccess={loadCategories} trigger={
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        } />
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
              {incomeCategories.map((category) => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
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
                  {!category.is_default && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setCategoryToDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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
            {expenseCategories.map((category) => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
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
                  {!category.is_default && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setCategoryToDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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

      {/* Delete Confirmation */}
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
    </div>
  )
}
