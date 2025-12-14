"use client"

import * as React from "react"
import { motion } from "framer-motion"
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
import { exportSharedItemToPDF } from "@/lib/export-shared"
import { SharedItem, PaymentScheduleItem } from "@/types"
import { ArrowLeft, Plus, FileDown, User, Pencil, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { calculateTotals } from "@/lib/payment-allocation"
import Image from "next/image"
import { ImageViewerDialog } from "@/components/shared/image-viewer-dialog"
import { EditScheduleDialog } from "@/components/shared/edit-schedule-dialog"
import { updateSharedItem } from "@/lib/api"
import { Pagination } from "@/components/ui/pagination"

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
  const [schedulePage, setSchedulePage] = React.useState(1)
  const [historyPage, setHistoryPage] = React.useState(1)
  const schedulePerPage = 10
  const historyPerPage = 5

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
      exportSharedItemToPDF(item, payments)
    }
  }

  // Calculate pagination for payment schedule (must be before early returns)
  const scheduleTotalPages = item?.payment_schedule 
    ? Math.ceil(item.payment_schedule.length / schedulePerPage)
    : 0
  const paginatedSchedule = React.useMemo(() => {
    if (!item?.payment_schedule) return []
    const startIndex = (schedulePage - 1) * schedulePerPage
    const endIndex = startIndex + schedulePerPage
    return item.payment_schedule.slice(startIndex, endIndex)
  }, [item?.payment_schedule, schedulePage, schedulePerPage])

  // Calculate pagination for payment history (must be before early returns)
  const historyTotalPages = Math.ceil(payments.length / historyPerPage)
  const paginatedPayments = React.useMemo(() => {
    const startIndex = (historyPage - 1) * historyPerPage
    const endIndex = startIndex + historyPerPage
    return payments.slice(startIndex, endIndex)
  }, [payments, historyPage, historyPerPage])

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

  // Simple calculations - overpay is separate and doesn't affect these
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
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/shared')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item?.title}</h1>
            <p className="text-muted-foreground">Shared expense details</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setPaymentDialogOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -4 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Amount</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-blue-500">
                {formatCurrency(item.total_amount)}
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -4 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:shadow-lg hover:shadow-green-500/20 transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-green-500">
                {formatCurrency(item.total_paid)}
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -4 }}
        >
          <Card className={`bg-gradient-to-br ${remaining > 0 ? 'from-orange-500/10 to-red-500/10 border-orange-500/20 hover:shadow-orange-500/20' : 'from-green-500/10 to-emerald-500/10 border-green-500/20 hover:shadow-green-500/20'} hover:shadow-lg transition-shadow`}>
            <CardHeader className="pb-2">
              <CardDescription>Remaining</CardDescription>
              <CardTitle className={`text-xl sm:text-2xl ${remaining > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {formatCurrency(remaining)}
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
        
        {/* Overpayment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -4 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/20 transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Overpay</CardDescription>
              <CardTitle className="text-xl sm:text-2xl text-orange-500">
                {(() => {
                  // Sum all overpayments from each period (no deductions)
                  let totalOverpay = 0
                  if (item.payment_schedule && item.payment_schedule.length > 0) {
                    item.payment_schedule.forEach(period => {
                      const periodPayments = payments.filter(p => p.period_id === period.month)
                      const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0)
                      const periodTotal = period.principal + period.interest
                      const overpayment = Math.max(0, totalPaid - periodTotal)
                      totalOverpay += overpayment
                    })
                  }
                  return formatCurrency(totalOverpay)
                })()}
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        {item.principal_amount && item.interest_amount && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/20 transition-shadow">
                <CardHeader className="pb-2">
                  <CardDescription>Principal Left</CardDescription>
                  <CardTitle className="text-xl sm:text-2xl text-indigo-500">
                    {(() => {
                      const breakdown = calculateTotals(payments, item.principal_amount!, item.interest_amount!)
                      return formatCurrency(item.principal_amount - breakdown.totalPrincipalPaid)
                    })()}
                  </CardTitle>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20 transition-shadow">
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
            </motion.div>
          </>
        )}
      </div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
            <CardDescription>{progress.toFixed(1)}% completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">Overpay</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchedule.map((period) => {
                    const periodPayments = payments.filter(p => p.period_id === period.month)
                    const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0)
                    const periodTotal = period.principal + period.interest
                    const overpayment = Math.max(0, totalPaid - periodTotal)
                    const isComplete = totalPaid >= periodTotal

                    return (
                      <motion.tr 
                        key={period.month} 
                        className="border-t hover:bg-muted/20"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: period.month * 0.05 }}
                        whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
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
                        <td className="px-4 py-3 text-right font-medium text-blue-600 dark:text-blue-400">
                          {formatCurrency(totalPaid)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {overpayment > 0 ? (
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              +{formatCurrency(overpayment)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Complete
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Remaining: {formatCurrency(periodTotal - totalPaid)}
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
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {item.payment_schedule && item.payment_schedule.length > 0 && (
              <Pagination
                currentPage={schedulePage}
                totalPages={scheduleTotalPages}
                onPageChange={setSchedulePage}
                itemsPerPage={schedulePerPage}
                totalItems={item.payment_schedule.length}
              />
            )}
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
            <>
              <div className="space-y-4">
                {paginatedPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate" title={payment.user_email || 'Unknown User'}>
                          {payment.user_email || 'Unknown User'}
                        </p>
                        {payment.description && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">{payment.description}</p>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {new Date(payment.paid_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {payment.receipt_url && (
                          <button
                            onClick={() => setViewingImage(payment.receipt_url)}
                            className="text-xs text-blue-500 hover:underline mt-1 flex items-center gap-1"
                          >
                            📎 View Receipt
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-lg sm:text-xl font-bold text-green-500 whitespace-nowrap">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {payments.length > 0 && (
                <Pagination
                  currentPage={historyPage}
                  totalPages={historyTotalPages}
                  onPageChange={setHistoryPage}
                  itemsPerPage={historyPerPage}
                  totalItems={payments.length}
                />
              )}
            </>
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
