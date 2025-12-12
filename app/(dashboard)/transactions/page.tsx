"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog"
import { getTransactions, deleteTransaction } from "@/lib/api"
import { exportToExcel } from "@/lib/export"
import { Transaction } from "@/types"
import { FileDown, Loader2, ExternalLink, Pencil, Trash2, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ImageViewerDialog } from "@/components/shared/image-viewer-dialog"

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const [viewingImage, setViewingImage] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const loadTransactions = React.useCallback(async () => {
    try {
      setError(null)
      const data = await getTransactions()
      setTransactions(data)
    } catch (error: any) {
      console.error("Failed to load transactions:", error)
      setError(error.message || "Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return
    
    setDeletingId(id)
    try {
      await deleteTransaction(id)
      loadTransactions()
    } catch (error: any) {
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = () => {
    exportToExcel(transactions)
  }

  // Calculate summary
  const summary = React.useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { income, expenses, balance: income - expenses }
  }, [transactions])

  if (error && error.includes('relation "transactions" does not exist')) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
            <CardDescription>
              Please run the SQL schema in Supabase SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              I've run the SQL - Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <AddTransactionDialog onSuccess={loadTransactions} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 transition-shadow hover:shadow-lg hover:shadow-green-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Total Income</CardDescription>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <CardTitle className="text-2xl text-green-500">
                  {formatCurrency(summary.income)}
                </CardTitle>
              </motion.div>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 transition-shadow hover:shadow-lg hover:shadow-red-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Total Expenses</CardDescription>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <CardTitle className="text-2xl text-red-500">
                  {formatCurrency(summary.expenses)}
                </CardTitle>
              </motion.div>
            </CardHeader>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -4 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 transition-shadow hover:shadow-lg hover:shadow-blue-500/20">
            <CardHeader className="pb-2">
              <CardDescription>Balance</CardDescription>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <CardTitle className={`text-2xl ${summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  {formatCurrency(summary.balance)}
                </CardTitle>
              </motion.div>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No transactions yet. Add your first transaction to get started!
              </div>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-center">Receipt</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <motion.tr 
                        key={transaction.id} 
                        className="border-b hover:bg-muted/30 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, backgroundColor: "rgba(0,0,0,0.02)" }}
                      >
                        <td className="px-6 py-4">
                          {new Date(transaction.date).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 font-medium">{transaction.description}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-secondary">
                            {transaction.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {transaction.receipt_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingImage(transaction.receipt_url!)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTransaction(transaction)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(transaction.id)}
                              disabled={deletingId === transaction.id}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              {deletingId === transaction.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(null)}
          onSuccess={loadTransactions}
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
