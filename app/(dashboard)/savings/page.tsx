"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, ArrowLeft, Pencil, Trash2, PiggyBank, Target, Calendar, Coins, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { SavingsGoal } from "@/types"
import { getSavingsGoals, deleteSavingsGoal, updateSavingsGoal, addTransaction } from "@/lib/api"
import { SavingsGoalDialog } from "@/components/savings/savings-goal-dialog"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SavingsPage() {
    const router = useRouter()
    const [goals, setGoals] = React.useState<SavingsGoal[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [editingGoal, setEditingGoal] = React.useState<SavingsGoal | null>(null)
    const [goalToDelete, setGoalToDelete] = React.useState<SavingsGoal | null>(null)
    
    // Deposit State
    const [depositGoal, setDepositGoal] = React.useState<SavingsGoal | null>(null)
    const [depositAmount, setDepositAmount] = React.useState("")
    const [isDepositing, setIsDepositing] = React.useState(false)

    const loadGoals = React.useCallback(async () => {
        try {
            const data = await getSavingsGoals()
            setGoals(data)
        } catch (error: any) {
            console.error("Failed to load savings goals:", error)
            console.error("Error message:", error.message || "Unknown error")
            toast.error("Failed to load savings goals")
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadGoals()
    }, [loadGoals])

    const handleDelete = async () => {
        if (!goalToDelete) return
        try {
            await deleteSavingsGoal(goalToDelete.id)
            toast.success("Goal deleted successfully")
            loadGoals()
        } catch (error: any) {
            toast.error(`Failed to delete: ${error.message}`)
        } finally {
            setGoalToDelete(null)
        }
    }

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!depositGoal) return

        setIsDepositing(true)
        try {
            const amount = Number(depositAmount)
            const newAmount = depositGoal.current_amount + amount
            const wasComplete = depositGoal.current_amount >= depositGoal.target_amount
            const isNowComplete = newAmount >= depositGoal.target_amount
            
            await updateSavingsGoal(depositGoal.id, {
                current_amount: newAmount
            })

            console.log("Goal updated. Now creating transaction...") // DEBUG LOG

            // Create a corresponding transaction
            const tx = await addTransaction({
                amount: -Math.abs(amount), // Expense
                type: 'expense',
                category: 'Savings',
                description: `Deposit to ${depositGoal.name}`,
                date: new Date().toISOString().split('T')[0]
            })
            
            console.log("Transaction created successfully:", tx) // DEBUG LOG
            
            toast.success(`Deposited ${formatCurrency(amount)} to ${depositGoal.name}`)

            // Celebrate if goal just completed
            if (!wasComplete && isNowComplete) {
                import('canvas-confetti').then((confetti) => {
                    confetti.default({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    })
                })
                toast.success(`🎉 Goal "${depositGoal.name}" completed!`, { duration: 5000 })
            }

            setDepositGoal(null)
            setDepositAmount("")
            loadGoals()
        } catch (error: any) {
            console.error("Deposit flow failed:", error) // DEBUG LOG
            toast.error(`Deposit failed: ${error.message}`)
        } finally {
            setIsDepositing(false)
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
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Savings Goals</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Track your progress towards your dreams
                        </p>
                    </div>
                </div>
                <SavingsGoalDialog onSuccess={loadGoals} trigger={
                    <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        New Goal
                    </Button>
                } />
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                    <Skeleton className="h-[200px] rounded-xl" />
                </div>
            ) : goals.length === 0 ? (
                 <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                        <PiggyBank className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No savings goals yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                        Create a goal to start saving for things that matter to you.
                    </p>
                    <SavingsGoalDialog onSuccess={loadGoals} trigger={
                         <Button>Create Your First Goal</Button>
                    }/>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal) => {
                        const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                        const isCompleted = goal.current_amount >= goal.target_amount

                        return (
                            <Card key={goal.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                                <div 
                                    className="absolute top-0 left-0 w-1 h-full" 
                                    style={{ backgroundColor: goal.color }}
                                />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {/* Could render icon dynamically if stored in DB */}
                                            <Target className="h-5 w-5 text-muted-foreground" />
                                            {goal.name}
                                        </CardTitle>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingGoal(goal)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setGoalToDelete(goal)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="text-2xl font-bold">
                                            {formatCurrency(goal.current_amount)}
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1">
                                            of {formatCurrency(goal.target_amount)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <Progress value={progress} className="h-2" indicatorColor={goal.color} />
                                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                        <span>{progress.toFixed(0)}% Achieved</span>
                                        {goal.deadline && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(goal.deadline).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        className="w-full" 
                                        variant={isCompleted ? "outline" : "default"}
                                        disabled={isCompleted}
                                        onClick={() => setDepositGoal(goal)}
                                    >
                                        <Coins className="mr-2 h-4 w-4" />
                                        {isCompleted ? "Goal Reached! 🎉" : "Deposit"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Edit Dialog */}
            {editingGoal && (
                <SavingsGoalDialog
                    goal={editingGoal}
                    open={!!editingGoal}
                    onOpenChange={(open) => !open && setEditingGoal(null)}
                    onSuccess={loadGoals}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{goalToDelete?.name}&quot;? This cannot be undone.
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

            {/* Deposit Dialog */}
            <Dialog open={!!depositGoal} onOpenChange={(open) => !open && setDepositGoal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deposit to {depositGoal?.name}</DialogTitle>
                        <DialogDescription>
                            Add funds to this savings goal.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDeposit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="deposit-amount">Amount (฿)</Label>
                                <Input
                                    id="deposit-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDepositGoal(null)}>Cancel</Button>
                            <Button type="submit" disabled={isDepositing || !depositAmount}>
                                {isDepositing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Deposit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
