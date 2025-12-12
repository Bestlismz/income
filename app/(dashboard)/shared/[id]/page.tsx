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
import { SharedItem, PaymentScheduleItem } from "@/types"
import { ArrowLeft, Plus, FileDown, User, Pencil, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { calculateTotals } from "@/lib/payment-allocation"
import Image from "next/image"
import { ImageViewerDialog } from "@/components/shared/image-viewer-dialog"
import { EditScheduleDialog } from "@/components/shared/edit-schedule-dialog"
import { updateSharedItem } from "@/lib/api"

export default function SharedItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [item, setItem] = React.useState<(SharedItem & { total_paid: number }) | null>(null)
  const [payments, setPayments] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<number | null>(null) // Period number
  const [viewingImage, setViewingImage] = React.useState<string | null>(null)
  const [editScheduleOpen, setEditScheduleOpen] = React.useState(false)

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
    const receiptFile = (formData.get('receipt') as File)?.size > 0 
      ? formData.get('receipt') as File 
      : undefined
    
    try {
      await addPaymentToSharedItem(
        resolvedParams.id,
        Number(formData.get('amount')),
        item.title,
        formData.get('description') as string || undefined,
        selectedItem || undefined,
        receiptFile
      )
      setPaymentDialogOpen(false)
      setSelectedItem(null)
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

  // Calculate principal and interest breakdown
  const hasBreakdown = item.principal_amount && item.interest_amount
  const breakdown = hasBreakdown 
    ? calculateTotals(payments, item.principal_amount!, item.interest_amount!)
    : null

  const handleScheduleUpdate = async (newSchedule: PaymentScheduleItem[]) => {
    if (!item) return

    // Calculate new totals
    const totals = newSchedule.reduce(
      (acc, period) => ({
        principal: acc.principal + period.principal,
        interest: acc.interest + period.interest,
        total: acc.total + period.principal + period.interest
      }),
      { principal: 0, interest: 0, total: 0 }
    )

    try {
      await updateSharedItem(resolvedParams.id, {
        payment_schedule: newSchedule,
        principal_amount: totals.principal,
        interest_amount: totals.interest,
        total_amount: totals.total
      })
      loadData()
    } catch (error: any) {
      throw error
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/shared')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item?.title}</h1>
            <p className="text-muted-foreground">Shared expense details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
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
        {item.principal_amount && item.interest_amount && (
          <>
            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
              <CardHeader className="pb-2">
                <CardDescription>Principal Left</CardDescription>
                <CardTitle className="text-2xl text-indigo-500">
                  {(() => {
                    const breakdown = calculateTotals(payments, item.principal_amount!, item.interest_amount!)
                    return formatCurrency(item.principal_amount - breakdown.totalPrincipalPaid)
                  })()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardDescription>Interest Left</CardDescription>
                <CardTitle className="text-2xl text-amber-500">
                  {(() => {
                    const breakdown = calculateTotals(payments, item.principal_amount!, item.interest_amount!)
                    return formatCurrency(item.interest_amount - breakdown.totalInterestPaid)
                  })()}
                </CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
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

      {/* Payment Schedule Table */}
      {item.payment_schedule && item.payment_schedule.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Schedule</CardTitle>
                <CardDescription>Track payments by period</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditScheduleOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-right font-semibold">Principal</th>
                    <th className="px-4 py-3 text-right font-semibold">Interest</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {item.payment_schedule.map((period) => {
                    const periodPayments = payments.filter(p => p.period_id === period.month)
                    const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0)
                    const periodTotal = period.principal + period.interest
                    const isComplete = totalPaid >= periodTotal

                    return (
                      <tr key={period.month} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{period.month}</td>
                        <td className="px-4 py-3">
                          {new Date(period.due_date).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(period.principal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(period.interest)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(periodTotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Complete
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Paid: {formatCurrency(totalPaid)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!isComplete && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedItem(period.month)
                                setPaymentDialogOpen(true)
                              }}
                            >
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {payment.user_avatar ? (
                        <Image
                          src={payment.user_avatar}
                          alt={payment.user_email || 'User'}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
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
                      {payment.receipt_url && (
                        <button
                          onClick={() => setViewingImage(payment.receipt_url)}
                          className="text-xs text-blue-500 hover:underline mt-1"
                        >
                          📎 View Receipt
                        </button>
                      )}
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
                {selectedItem && ` - Period ${selectedItem}`}
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
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt (Optional)</Label>
                <Input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/*"
                />
                <p className="text-xs text-muted-foreground">
                  Upload payment slip or receipt
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setPaymentDialogOpen(false)
                setSelectedItem(null)
              }}>
                Cancel
              </Button>
              <Button type="submit">Add Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <ImageViewerDialog
        imageUrl={viewingImage}
        open={!!viewingImage}
        onOpenChange={(open) => !open && setViewingImage(null)}
      />

      {/* Edit Schedule Dialog */}
      {item?.payment_schedule && (
        <EditScheduleDialog
          schedule={item.payment_schedule}
          open={editScheduleOpen}
          onOpenChange={setEditScheduleOpen}
          onSave={handleScheduleUpdate}
        />
      )}
    </div>
  )
}
