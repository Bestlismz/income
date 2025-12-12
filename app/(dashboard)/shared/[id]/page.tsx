"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSharedItems, getSharedItemDetails, addPaymentToSharedItem } from "@/lib/api"
import { exportSharedItemToExcel } from "@/lib/export-shared"
import { SharedItem } from "@/types"
import { ArrowLeft, Loader2, FileDown, Plus, Calendar, User } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function SharedItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [item, setItem] = React.useState<(SharedItem & { total_paid: number }) | null>(null)
  const [payments, setPayments] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)

  const loadData = React.useCallback(async () => {
    try {
      const [itemsData, paymentsData] = await Promise.all([
        getSharedItems(),
        getSharedItemDetails(resolvedParams.id)
      ])
      
      const currentItem = itemsData.find(i => i.id === resolvedParams.id)
      if (currentItem) {
        setItem(currentItem)
      }
      setPayments(paymentsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [resolvedParams.id])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!item) return
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await addPaymentToSharedItem(
        resolvedParams.id,
        Number(formData.get('amount')),
        item.title,
        formData.get('description') as string || undefined
      )
      setPaymentDialogOpen(false)
      loadData()
    } catch (error: any) {
      alert(`Failed to add payment: ${error.message}`)
    }
  }

  const handleExport = () => {
    if (item) {
      exportSharedItemToExcel(item, payments)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Item not found</p>
            <Button onClick={() => router.push('/shared')} className="mt-4">
              Back to Shared Expenses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const remaining = item.total_amount - item.total_paid
  const progress = (item.total_paid / item.total_amount) * 100

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/shared')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
            {item.due_date && (
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Due: {new Date(item.due_date).toLocaleDateString('th-TH')}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setPaymentDialogOpen(true)} disabled={remaining <= 0}>
            <Plus className="h-4 w-4" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Amount</CardDescription>
            <CardTitle className="text-2xl text-blue-500">
              {formatCurrency(item.total_amount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Paid</CardDescription>
            <CardTitle className="text-2xl text-green-500">
              {formatCurrency(item.total_paid)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`bg-gradient-to-br ${remaining > 0 ? 'from-orange-500/10 to-red-500/10 border-orange-500/20' : 'from-green-500/10 to-emerald-500/10 border-green-500/20'}`}>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className={`text-2xl ${remaining > 0 ? 'text-orange-500' : 'text-green-500'}`}>
              {formatCurrency(remaining)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
          <CardDescription>{progress.toFixed(1)}% completed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No payments yet
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.user_email || 'Unknown User'}</p>
                      {payment.description && (
                        <p className="text-xs text-muted-foreground italic">{payment.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paid_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-500">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddPayment}>
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
              <DialogDescription>
                Record a payment for {item.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (฿)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  max={remaining}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Remaining: {formatCurrency(remaining)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g., Monthly payment"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
