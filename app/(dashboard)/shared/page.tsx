"use client"

import * as React from "react"
import { motion } from "framer-motion"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { getSharedItems, createSharedItem, addPaymentToSharedItem, updateSharedItem, deleteSharedItem } from "@/lib/api"
import { exportToExcel } from "@/lib/export"
import { SharedItem, PaymentScheduleItem } from "@/types"
import { Plus, Loader2, Wallet, Users, Pencil, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PaymentScheduleTable } from "@/components/shared/payment-schedule-table"
import { EditSharedItemDialog } from "@/components/shared/edit-shared-item-dialog"
import { ImageViewerDialog } from "@/components/shared/image-viewer-dialog"

export default function SharedPage() {
  const [items, setItems] = React.useState<(SharedItem & { total_paid: number })[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null)
  const [paymentSchedule, setPaymentSchedule] = React.useState<PaymentScheduleItem[]>([])
  const [editingItem, setEditingItem] = React.useState<SharedItem | null>(null)
  const [viewingImage, setViewingImage] = React.useState<string | null>(null)
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)
  const [itemPayments, setItemPayments] = React.useState<any[]>([])

  const loadItems = React.useCallback(async () => {
    try {
      const data = await getSharedItems()
      setItems(data)
    } catch (error) {
      console.error("Failed to load shared items:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Calculate totals from schedule
    const scheduleTotals = paymentSchedule.reduce(
      (acc, item) => ({
        principal: acc.principal + item.principal,
        interest: acc.interest + item.interest,
        total: acc.total + item.principal + item.interest
      }),
      { principal: 0, interest: 0, total: 0 }
    )
    
    // Use schedule total if exists, otherwise use manual input
    const totalAmount = paymentSchedule.length > 0 
      ? scheduleTotals.total 
      : Number(formData.get('total_amount'))
    
    try {
      await createSharedItem({
        title: formData.get('title') as string,
        total_amount: totalAmount,
        principal_amount: scheduleTotals.principal > 0 ? scheduleTotals.principal : undefined,
        interest_amount: scheduleTotals.interest > 0 ? scheduleTotals.interest : undefined,
        payment_schedule: paymentSchedule.length > 0 ? paymentSchedule : undefined,
        due_date: (formData.get('due_date') as string) || undefined,
      })
      setCreateDialogOpen(false)
      setPaymentSchedule([])
      loadItems()
    } catch (error: any) {
      alert(`Failed to create: ${error.message}`)
    }
  }

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) return
    
    const formData = new FormData(e.currentTarget)
    const item = items.find(i => i.id === selectedItem)
    if (!item) return
    
    const periodValue = formData.get('period') as string
    const periodId = periodValue ? Number(periodValue) : undefined
    
    try {
      await addPaymentToSharedItem(
        selectedItem,
        Number(formData.get('amount')),
        item.title,
        formData.get('description') as string || undefined,
        periodId,
        receiptFile || undefined
      )
      setPaymentDialogOpen(false)
      setSelectedItem(null)
      setReceiptFile(null)
      loadItems()
    } catch (error: any) {
      alert(`Failed to add payment: ${error.message}`)
    }
  }

  const handleUpdate = async (updates: Partial<SharedItem>) => {
    if (!editingItem) return
    
    try {
      await updateSharedItem(editingItem.id, updates)
      setEditingItem(null)
      loadItems()
    } catch (error: any) {
      alert(`Failed to update: ${error.message}`)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all associated payments.`)) {
      return
    }

    try {
      await deleteSharedItem(id)
      loadItems()
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Expenses</h1>
          <p className="text-muted-foreground">
            Track shared payments and balances
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New Shared Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateItem}>
              <DialogHeader>
                <DialogTitle>Create Shared Item</DialogTitle>
                <DialogDescription>
                  Create a new shared expense to track
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Condo Payment"
                    required
                  />
                </div>
                
                {paymentSchedule.length === 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Total Amount (฿)</Label>
                    <Input
                      id="total_amount"
                      name="total_amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Total Amount (Auto-calculated)</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        paymentSchedule.reduce((sum, item) => sum + item.principal + item.interest, 0)
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Calculated from payment schedule
                    </p>
                  </div>
                )}
                
                <PaymentScheduleTable 
                  schedule={paymentSchedule}
                  onChange={setPaymentSchedule}
                />

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
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload payment slip or receipt
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Shared Items</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first shared expense to start tracking
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Shared Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const remaining = item.total_amount - item.total_paid
            const progress = (item.total_paid / item.total_amount) * 100

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
              >
                <Card 
                  className="h-full hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary/20"
                  onClick={() => window.location.href = `/shared/${item.id}`}
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      {item.title}
                    </CardTitle>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingItem(item)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id, item.title)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {item.due_date && (
                    <CardDescription>
                      Due: {new Date(item.due_date).toLocaleDateString('th-TH')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Paid</span>
                      <span className="font-semibold text-green-500">
                        {formatCurrency(item.total_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Remaining</span>
                      <span className={`font-bold ${remaining > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* Add Payment Button */}
                  <Button
                    className="w-full"
                    variant={remaining > 0 ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItem(item.id)
                      setPaymentDialogOpen(true)
                    }}
                    disabled={remaining <= 0}
                  >
                    {remaining > 0 ? "Add Payment" : "Fully Paid"}
                  </Button>
                </CardContent>
              </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAddPayment}>
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
              <DialogDescription>
                Record a payment for this shared item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {(() => {
                const item = items.find(i => i.id === selectedItem)
                const hasSchedule = item?.payment_schedule && item.payment_schedule.length > 0
                
                // Load payments for this item when dialog opens
                React.useEffect(() => {
                  if (selectedItem && paymentDialogOpen) {
                    import('@/lib/api').then(({ getSharedItemDetails }) => {
                      getSharedItemDetails(selectedItem).then(setItemPayments).catch(console.error)
                    })
                  }
                }, [selectedItem, paymentDialogOpen])
                
                return hasSchedule ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="period">Select Period</Label>
                      <select
                        id="period"
                        name="period"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                        onChange={(e) => {
                          const periodNum = Number(e.target.value)
                          const period = item.payment_schedule?.find(p => p.month === periodNum)
                          if (period) {
                            const amountInput = document.getElementById('amount') as HTMLInputElement
                            if (amountInput) {
                              amountInput.value = (period.principal + period.interest).toString()
                            }
                          }
                        }}
                      >
                        <option value="">Choose a period...</option>
                        {item.payment_schedule
                          ?.filter((period) => {
                            // Only show periods that haven't been fully paid
                            const periodPayments = itemPayments.filter(p => p.period_id === period.month)
                            const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0)
                            const periodTotal = period.principal + period.interest
                            return totalPaid < periodTotal
                          })
                          .map((period) => (
                            <option key={period.month} value={period.month}>
                              Period {period.month} - {new Date(period.due_date).toLocaleDateString('th-TH')} 
                              ({formatCurrency(period.principal + period.interest)})
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Only unpaid periods are shown
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (฿)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        placeholder="Select a period first"
                        required
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">
                        Amount is set based on selected period
                      </p>
                    </div>
                  </>
                ) : (
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
                  </div>
                )
              })()}
              <div className="space-y-2">
                <Label htmlFor="payment-description">Description (Optional)</Label>
                <Input
                  id="payment-description"
                  name="description"
                  placeholder="e.g., Monthly payment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-receipt">Receipt (Optional)</Label>
                <Input
                  id="payment-receipt"
                  name="receipt"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
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
                setReceiptFile(null)
              }}>
                Cancel
              </Button>
              <Button type="submit">Add Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingItem && (
        <EditSharedItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Image Viewer */}
      <ImageViewerDialog
        imageUrl={viewingImage}
        open={!!viewingImage}
        onOpenChange={(open) => !open && setViewingImage(null)}
      />
    </div>
  )
}
