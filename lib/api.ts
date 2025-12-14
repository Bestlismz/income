import { createClient } from './supabase/client'
import { Transaction, SharedItem, Category, SavingsGoal, Budget, RecurringTransaction } from '@/types'

function getClient() {
    return createClient()
}

// Transactions
export async function getTransactions() {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Transaction[]
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'user_id'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data as Transaction
}

export async function updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'created_at' | 'user_id'>>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) throw error
    return data as Transaction
}

export async function deleteTransaction(id: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw error
}

export async function uploadReceipt(file: File) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

    return publicUrl
}

// Shared Items
export async function getSharedItems() {
    const supabase = getClient()
    const { data, error } = await supabase
        .from('shared_items')
        .select(`
      *,
      shared_payments (
        amount,
        user_id
      )
    `)
        .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((item: any) => ({
        ...item,
        total_paid: item.shared_payments.reduce((acc: number, curr: any) => acc + curr.amount, 0)
    })) as (SharedItem & { total_paid: number })[]
}

export async function createSharedItem(item: Omit<SharedItem, 'id' | 'created_by' | 'created_at'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('shared_items')
        .insert({
            ...item,
            created_by: user.id
        })
        .select()
        .single()

    if (error) throw error
    return data as SharedItem
}

export async function addPaymentToSharedItem(
    itemId: string,
    amount: number,
    itemTitle: string,
    description?: string,
    periodId?: number,
    receiptFile?: File
) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Upload receipt if provided
    let receiptUrl: string | undefined
    if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile)
    }

    // 1. Add payment record
    const { data: payment, error: paymentError } = await supabase
        .from('shared_payments')
        .insert({
            item_id: itemId,
            user_id: user.id,
            amount,
            description: description || null,
            period_id: periodId || null,
            paid_at: new Date().toISOString()
        })
        .select()
        .single()

    if (paymentError) throw paymentError

    // 2. Create corresponding transaction
    const transactionDescription = description
        ? `${itemTitle}: ${description}`
        : `Payment for: ${itemTitle}`

    const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
            user_id: user.id,
            amount: -Math.abs(amount), // Negative for expense
            type: 'expense',
            category: 'Shared Expense',
            description: transactionDescription,
            date: new Date().toISOString().split('T')[0],
            receipt_url: receiptUrl,
            period_id: periodId || null,
            created_at: new Date().toISOString()
        })

    if (transactionError) {
        // Rollback payment if transaction fails
        await supabase.from('shared_payments').delete().eq('id', payment.id)
        throw transactionError
    }

    return payment
}

export async function getSharedItemDetails(itemId: string) {
    const supabase = getClient()

    // Get payments with user emails
    const { data: payments, error: paymentsError } = await supabase
        .from('shared_payments')
        .select('*')
        .eq('item_id', itemId)
        .order('paid_at', { ascending: false })

    if (paymentsError) throw paymentsError

    // Get user emails and avatars
    const userIds = [...new Set(payments.map(p => p.user_id))]
    const { data: users } = await supabase
        .from('profiles')
        .select('id, email, avatar_url')
        .in('id', userIds)

    // Get receipt URLs from transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('user_id, receipt_url, created_at, period_id')
        .eq('category', 'Shared Expense')
        .in('user_id', userIds)

    // If profiles don't exist, get from auth.users
    if (!users || users.length === 0) {
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const userMap = new Map(authUsers.users.map(u => [u.id, { email: u.email, avatar_url: null }]))

        return payments.map(p => {
            // Find matching transaction by user_id, period_id, and approximate time
            const matchingTx = transactions?.find(tx =>
                tx.user_id === p.user_id &&
                tx.period_id === p.period_id &&
                Math.abs(new Date(tx.created_at).getTime() - new Date(p.paid_at).getTime()) < 5000 // within 5 seconds
            )

            return {
                ...p,
                user_email: userMap.get(p.user_id)?.email || 'Unknown',
                user_avatar: null,
                receipt_url: matchingTx?.receipt_url || null
            }
        })
    }

    const userMap = new Map(users.map(u => [u.id, { email: u.email, avatar_url: u.avatar_url }]))

    return payments.map(p => {
        // Find matching transaction by user_id, period_id, and approximate time
        const matchingTx = transactions?.find(tx =>
            tx.user_id === p.user_id &&
            tx.period_id === p.period_id &&
            Math.abs(new Date(tx.created_at).getTime() - new Date(p.paid_at).getTime()) < 5000 // within 5 seconds
        )

        return {
            ...p,
            user_email: userMap.get(p.user_id)?.email || 'Unknown',
            user_avatar: userMap.get(p.user_id)?.avatar_url || null,
            receipt_url: matchingTx?.receipt_url || null
        }
    })
}

export async function updateSharedItem(id: string, updates: Partial<SharedItem>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('shared_items')
        .update(updates)
        .eq('id', id)
        .eq('created_by', user.id)
        .select()
        .single()

    if (error) throw error
    return data as SharedItem
}

export async function deleteSharedItem(id: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Delete all payments first
    await supabase
        .from('shared_payments')
        .delete()
        .eq('item_id', id)

    // Delete the item
    const { error } = await supabase
        .from('shared_items')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id)

    if (error) throw error
}

// Categories
export async function getCategories() {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order('name')

    if (error) throw error
    return data as Category[]
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at' | 'user_id' | 'is_default'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user.id, is_default: false })
        .select()
        .single()

    if (error) throw error
    return data as Category
}

export async function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'created_at' | 'user_id' | 'is_default'>>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) throw error
    return data as Category
}

export async function deleteCategory(id: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Can only delete own categories

    if (error) throw error
}

export async function deleteCategories(ids: string[]) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('categories')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id) // Can only delete own categories

    if (error) throw error
}

// Savings Goals
export async function getSavingsGoals() {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as SavingsGoal[]
}

export async function createSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'user_id'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...goal, user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data as SavingsGoal
}

export async function updateSavingsGoal(id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'created_at' | 'user_id'>>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) throw error
    return data as SavingsGoal
}

export async function deleteSavingsGoal(id: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw error
}

// Budgets
export async function getBudgets() {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })

    if (error) throw error
    return data as Budget[]
}

export async function createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'user_id'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('budgets')
        .insert({ ...budget, user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data as Budget
}

export async function updateBudget(id: string, updates: Partial<Omit<Budget, 'id' | 'created_at' | 'user_id'>>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) throw error
    return data as Budget
}

export async function deleteBudget(id: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw error
}

// Recurring Transactions  
export async function getRecurringTransactions() {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as RecurringTransaction[]
}

export async function createRecurringTransaction(transaction: Omit<RecurringTransaction, 'id' | 'created_at' | 'user_id'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single()

    if (error) throw error
    return data as RecurringTransaction
}

export async function updateRecurringTransaction(id: string, updates: Partial<Omit<RecurringTransaction, 'id' | 'created_at' | 'user_id'>>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) throw error
    return data as RecurringTransaction
}

export async function deleteRecurringTransaction(id: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw error
}

