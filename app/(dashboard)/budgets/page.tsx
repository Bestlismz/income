"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, ArrowLeft, Pencil, Trash2, TrendingUp, AlertTriangle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Budget } from "@/types"
import { getBudgets, deleteBudget, getTransactions } from "@/lib/api"
import { BudgetDialog } from "@/components/budgets/budget-dialog"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
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

export default function BudgetsPage() {
    const router = useRouter()
    const [budgets, setBudgets] = React.useState<Budget[]>([])
    const [spending, setSpending] = React.useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = React.useState(true)
    const [editingBudget, setEditingBudget] = React.useState<Budget | null>(null)
    const [budgetToDelete, setBudgetToDelete] = React.useState<Budget | null>(null)

    const loadData = React.useCallback(async () => {
        try {
            const [budgetsData, transactions] = await Promise.all([
                getBudgets(),
                getTransactions()
            ])
            setBudgets(budgetsData)

            // Calculate spending per category per month
            const spendingMap: Record<string, number> = {}
            transactions.forEach(tx => {
                if (tx.type === 'expense') {
                    const monthKey = tx.date.substring(0, 7) + "-01"
                    const key = `${monthKey}_${tx.category}`
                    spendingMap[key] = (spendingMap[key] || 0) + Math.abs(tx.amount)
                }
            })
            setSpending(spendingMap)
        } catch (error: any) {
            console.error("Failed to load budgets:", error)
            toast.error("Failed to load budgets")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleDelete = async () => {
        if (!budgetToDelete) return
        try {
            await deleteBudget(budgetToDelete.id)
            toast.success("Budget deleted successfully")
            loadData()
        } catch (error: any) {
            toast.error(`Failed to delete: ${error.message}`)
        } finally {
            setBudgetToDelete(null)
        }
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
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Budgets</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Set monthly spending limits
                        </p>
                    </div>
                </div>
                <BudgetDialog onSuccess={loadData} trigger={
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        New Budget
                    </Button>
                } />
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                </div>
            ) : budgets.length === 0 ? (
                 <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Start by setting a monthly budget to track your spending.
                    </p>
                    <BudgetDialog onSuccess={loadData} trigger={
                         <Button>Create Your First Budget</Button>
                    }/>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {budgets.map((budget) => {
                        const key = `${budget.month}_${budget.category}`
                        const spent = spending[key] || 0
                        const progress = Math.min((spent / budget.amount) * 100, 100)
                        const isOverBudget = spent > budget.amount
                        const isWarning = spent >= budget.amount * 0.8

                        return (
                            <Card key={budget.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                                <div 
                                    className={`absolute top-0 left-0 w-1 h-full ${
                                        isOverBudget ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{budget.category}</CardTitle>
                                            <CardDescription>
                                                {new Date(budget.month).toLocaleDateString('th-TH', { 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                })}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingBudget(budget)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setBudgetToDelete(budget)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-foreground'}`}>
                                            {formatCurrency(spent)}
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">
                                            of {formatCurrency(budget.amount)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <Progress 
                                        value={progress} 
                                        className="h-2" 
                                        indicatorColor={isOverBudget ? '#ef4444' : isWarning ? '#f97316' : '#22c55e'} 
                                    />
                                    <div className="flex justify-between mt-2 text-xs">
                                        <span className={isOverBudget ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-green-500'}>
                                            {progress.toFixed(0)}% used
                                        </span>
                                        {isOverBudget && (
                                            <span className="flex items-center gap-1 text-red-500">
                                                <AlertTriangle className="h-3 w-3" />
                                                Over by {formatCurrency(spent - budget.amount)}
                                            </span>
                                        )}
                                        {!isOverBudget && (
                                            <span className="text-muted-foreground">
                                                {formatCurrency(budget.amount - spent)} left
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Edit Dialog */}
            {editingBudget && (
                <BudgetDialog
                    budget={editingBudget}
                    open={!!editingBudget}
                    onOpenChange={(open) => !open && setEditingBudget(null)}
                    onSuccess={loadData}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Budget?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the budget for "{budgetToDelete?.category}"? This cannot be undone.
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
