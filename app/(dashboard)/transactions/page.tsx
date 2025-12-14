"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog"
import { getTransactions, deleteTransaction } from "@/lib/api"
import { exportToPDF } from "@/lib/export"
import { Transaction } from "@/types"
import { FileDown, Loader2, ExternalLink, Pencil, Trash2, AlertCircle, Filter } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { ImageViewerDialog } from "@/components/shared/image-viewer-dialog"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"

export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)
  const [viewingImage, setViewingImage] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showFilters, setShowFilters] = React.useState(false)
  const [filterType, setFilterType] = React.useState<"all" | "income" | "expense">("all")
  const [filterCategories, setFilterCategories] = React.useState<string[]>([])
  const [minAmount, setMinAmount] = React.useState("")
  const [maxAmount, setMaxAmount] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  const loadTransactions = React.useCallback(async () => {
    try {
      setError(null)
      const data = await getTransactions()
      setTransactions(data)
    } catch (error: any) {
      console.error("Failed to load transactions:", error)
      console.error("Error specifics:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint
      })
      toast.error("Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const confirmDelete = async () => {
    if (!transactionToDelete) return
    
    setDeletingId(transactionToDelete)
    try {
      await deleteTransaction(transactionToDelete)
      toast.success("Transaction deleted successfully")
      loadTransactions()
    } catch (error: any) {
      toast.error(`Failed to delete: ${error.message}`)
    } finally {
      setDeletingId(null)
      setTransactionToDelete(null)
    }
  }

  const handleExport = () => {
    exportToPDF(filteredTransactions)
  }

  // Get available months from transactions
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>()
    transactions.forEach(t => {
      const date = new Date(t.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.add(monthKey)
    })
    return Array.from(months).sort().reverse()
  }, [transactions])

  // Get unique categories
  const uniqueCategories = React.useMemo(() => {
    const cats = new Set<string>()
    transactions.forEach(t => cats.add(t.category))
    return Array.from(cats).sort()
  }, [transactions])

  // Filter transactions
  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions

    // Month filter
    if (selectedMonth !== "all") {
      filtered = filtered.filter(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return monthKey === selectedMonth
      })
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      )
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(t => t.type === filterType)
    }

    // Category filter
    if (filterCategories.length > 0) {
      filtered = filtered.filter(t => filterCategories.includes(t.category))
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= Number(minAmount))
    }
    if (maxAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= Number(maxAmount))
    }

    return filtered
  }, [transactions, selectedMonth, searchQuery, filterType, filterCategories, minAmount, maxAmount])

  // Calculate summary from filtered transactions
  const summary = React.useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { income, expenses, balance: income - expenses }
  }, [filteredTransactions])

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage, itemsPerPage])

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [selectedMonth])

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
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
            className="flex-1 sm:flex-none"
          >
            <FileDown className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <AddTransactionDialog onSuccess={loadTransactions} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ scale: 1.03, y: -4 }}
        >
          {isLoading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:shadow-lg hover:shadow-green-500/20 transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 rotate-180" />
                  Income
                </CardDescription>
                <CardTitle className="text-lg sm:text-2xl text-green-500 truncate" title={formatCurrency(summary.income)}>
                  {formatCurrency(summary.income)}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ scale: 1.03, y: -4 }}
        >
          {isLoading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:shadow-lg hover:shadow-red-500/20 transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Expenses
                </CardDescription>
                <CardTitle className="text-lg sm:text-2xl text-red-500 truncate" title={formatCurrency(summary.expenses)}>
                  {formatCurrency(summary.expenses)}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.03, y: -4 }}
          className="col-span-2 lg:col-span-2"
        >
          {isLoading ? (
            <Skeleton className="h-[104px] w-full rounded-xl" />
          ) : (
            <Card className={`bg-gradient-to-br ${summary.balance >= 0 ? 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:shadow-blue-500/20' : 'from-orange-500/10 to-red-500/10 border-orange-500/20 hover:shadow-orange-500/20'} hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Balance
                </CardDescription>
                <CardTitle className={`text-lg sm:text-2xl ${summary.balance >= 0 ? 'text-blue-500' : 'text-orange-500'} truncate`} title={formatCurrency(summary.balance)}>
                  {formatCurrency(summary.balance)}
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-4 sm:pt-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <Input
                  placeholder="Search description or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Month filter */}
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="all">All Time</option>
                      {availableMonths.map(month => {
                        const [year, monthNum] = month.split('-')
                        const date = new Date(parseInt(year), parseInt(monthNum) - 1)
                        const monthName = date.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
                        return <option key={month} value={month}>{monthName}</option>
                      })}
                    </select>
                  </div>

                  {/* Type filter */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="all">All Types</option>
                      <option value="income">Income Only</option>
                      <option value="expense">Expense Only</option>
                    </select>
                  </div>

                  {/* Min Amount */}
                  <div className="space-y-2">
                    <Label>Min Amount (฿)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                  </div>

                  {/* Max Amount */}
                  <div className="space-y-2">
                    <Label>Max Amount (฿)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Category multi-select */}
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setFilterCategories(prev =>
                            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                          )
                        }}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          filterCategories.includes(cat)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters button */}
                {(searchQuery || selectedMonth !== "all" || filterType !== "all" || filterCategories.length > 0 || minAmount || maxAmount) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedMonth("all")
                      setFilterType("all")
                      setFilterCategories([])
                      setMinAmount("")
                      setMaxAmount("")
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>



      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Transaction History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} recorded
              {selectedMonth !== "all" && " (filtered)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <Skeleton key={i} className="h-16 w-full rounded-lg" />
                 ))}
               </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                {selectedMonth === "all" 
                  ? "No transactions yet. Add your first transaction to get started!"
                  : "No transactions found for this month."}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-3">
                  {paginatedTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(transaction.date).toLocaleDateString('th-TH', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                            transaction.category === 'Savings' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-500/50' 
                              : 'bg-secondary'
                          }`}>
                            {transaction.category}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold whitespace-nowrap ${
                            transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t">
                        {transaction.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingImage(transaction.receipt_url!)}
                            className="flex-1 h-9"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTransaction(transaction)}
                          className="flex-1 h-9"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTransactionToDelete(transaction.id)}
                          disabled={deletingId === transaction.id}
                          className="flex-1 h-9 text-destructive hover:text-destructive"
                        >
                          {deletingId === transaction.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block relative overflow-x-auto">
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
                      {paginatedTransactions.map((transaction, index) => (
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
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              transaction.category === 'Savings' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-500/50' 
                                : 'bg-secondary'
                            }`}>
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
                                onClick={() => setTransactionToDelete(transaction.id)}
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
              </>
            )}

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredTransactions.length}
              />
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
          onSuccess={() => {
            loadTransactions()
            toast.success("Transaction updated successfully")
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer */}
      <ImageViewerDialog
        imageUrl={viewingImage}
        open={!!viewingImage}
        onOpenChange={(open) => !open && setViewingImage(null)}
      />
    </div>
  )
}
