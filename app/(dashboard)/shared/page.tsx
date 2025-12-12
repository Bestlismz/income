"use client"

import * as React from "react"
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
import { getSharedItems, createSharedItem, addPaymentToSharedItem } from "@/lib/api"
import { SharedItem } from "@/types"
import { Plus, Loader2, Wallet, Users } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function SharedPage() {
  const [items, setItems] = React.useState<(SharedItem & { total_paid: number })[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null)

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
    
    try {
      await createSharedItem({
        title: formData.get('title') as string,
        total_amount: Number(formData.get('total_amount')),
        due_date: (formData.get('due_date') as string) || undefined,
      })
      setCreateDialogOpen(false)
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
    
    try {
      await addPaymentToSharedItem(
        selectedItem,
        Number(formData.get('amount')),
        item.title,
        formData.get('description') as string || undefined
      )
      setPaymentDialogOpen(false)
      setSelectedItem(null)
      loadItems()
    } catch (error: any) {
      alert(`Failed to add payment: ${error.message}`)
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
          <DialogContent>
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
          {items.map((item) => {
            const remaining = item.total_amount - item.total_paid
            const progress = (item.total_paid / item.total_amount) * 100

            return (
              <Card 
                key={item.id} 
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => window.location.href = `/shared/${item.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    {item.title}
                  </CardTitle>
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
