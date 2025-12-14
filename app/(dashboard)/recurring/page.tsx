"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Pencil, Trash2, PlayCircle, PauseCircle, RefreshCw, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { RecurringTransaction } from "@/types"
import { getRecurringTransactions, deleteRecurringTransaction, updateRecurringTransaction, addTransaction } from "@/lib/api"
import { RecurringDialog } from "@/components/recurring/recurring-dialog"
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

export default function RecurringPage() {
    const router = useRouter()
    const [transactions, setTransactions] = React.useState<RecurringTransaction[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [editingTx, setEditingTx] = React.useState<RecurringTransaction | null>(null)
    const [txToDelete, setTxToDelete] = React.useState<RecurringTransaction | null>(null)
    const [generating, setGenerating] = React.useState<string | null>(null)

    const loadData = React.useCallback(async () => {
        try {
            const data = await getRecurringTransactions()
            setTransactions(data)
        } catch (error: any) {
            console.error("Failed to load recurring transactions:", error)
            toast.error("Failed to load recurring transactions")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleDelete = async () => {
        if (!txToDelete) return
        try {
            await deleteRecurringTransaction(txToDelete.id)
            toast.success("Recurring transaction deleted")
            loadData()
        } catch (error: any) {
            toast.error(`Failed to delete: ${error.message}`)
        } finally {
            setTxToDelete(null)
        }
    }

    const handleToggleActive = async (tx: RecurringTransaction) => {
        try {
            await updateRecurringTransaction(tx.id, { is_active: !tx.is_active })
            toast.success(tx.is_active ? "Paused" : "Activated")
            loadData()
        } catch (error: any) {
            toast.error(`Failed: ${error.message}`)
        }
    }

    const handleGenerate = async (tx: RecurringTransaction) => {
        setGenerating(tx.id)
        try {
            // Create a transaction from this template
            await addTransaction({
                amount: tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
                type: tx.type,
                category: tx.category,
                description: tx.description,
                date: new Date().toISOString().split('T')[0]
            })

            // Update last_generated
            await updateRecurringTransaction(tx.id, { 
                last_generated: new Date().toISOString().split('T')[0] 
            })

            toast.success("Transaction created from template")
            loadData()
        } catch (error: any) {
            toast.error(`Failed: ${error.message}`)
        } finally {
            setGenerating(null)
        }
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recurring Transactions</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Templates for bills and subscriptions
                        </p>
                    </div>
                </div>
                <RecurringDialog onSuccess={loadData} trigger={
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                    </Button>
                } />
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[120px] rounded-xl" />
                    <Skeleton className="h-[120px] rounded-xl" />
                </div>
            ) : transactions.length === 0 ? (
                 <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <RefreshCw className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No recurring transactions</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Create templates for bills that repeat monthly.
                    </p>
                    <RecurringDialog onSuccess={loadData} trigger={
                         <Button>Create Your First Template</Button>
                    }/>
                </Card>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <Card key={tx.id} className="group">
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg truncate">{tx.description}</h3>
                                            {!tx.is_active && (
                                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                                    Paused
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span>{formatCurrency(tx.amount)}</span>
                                            <span>•</span>
                                            <span className="capitalize">{tx.frequency}</span>
                                            <span>•</span>
                                            <span>{tx.category}</span>
                                            {tx.last_generated && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-green-600 dark:text-green-400">
                                                        Last: {new Date(tx.last_generated).toLocaleDateString('th-TH')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerate(tx)}
                                            disabled={generating === tx.id}
                                        >
                                            {generating === tx.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <PlayCircle className="h-4 w-4 mr-1" />
                                                    Generate
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleActive(tx)}
                                        >
                                            {tx.is_active ? (
                                                <PauseCircle className="h-4 w-4" />
                                            ) : (
                                                <PlayCircle className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingTx(tx)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setTxToDelete(tx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {editingTx && (
                <RecurringDialog
                    transaction={editingTx}
                    open={!!editingTx}
                    onOpenChange={(open) => !open && setEditingTx(null)}
                    onSuccess={loadData}
                />
            )}

            <AlertDialog open={!!txToDelete} onOpenChange={(open) => !open && setTxToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{txToDelete?.description}"? This cannot be undone.
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
