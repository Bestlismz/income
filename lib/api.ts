import { createClient } from './supabase/client'
import { Transaction, SharedItem } from '@/types'

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

export async function createSharedItem(item: Omit<SharedItem, 'id' | 'created_at' | 'created_by'>) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('shared_items')
        .insert({ ...item, created_by: user.id })
        .select()
        .single()

    if (error) throw error
    return data as SharedItem
}

export async function addPaymentToSharedItem(itemId: string, amount: number, itemTitle: string, description?: string) {
    const supabase = getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 1. Add payment record
    const { data: payment, error: paymentError } = await supabase
        .from('shared_payments')
        .insert({
            item_id: itemId,
            user_id: user.id,
            amount,
            description: description || null,
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

    // Get user emails
    const userIds = [...new Set(payments.map(p => p.user_id))]
    const { data: users } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

    // If profiles don't exist, get from auth.users
    if (!users || users.length === 0) {
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const userMap = new Map(authUsers.users.map(u => [u.id, u.email]))
        return payments.map(p => ({
            ...p,
            user_email: userMap.get(p.user_id) || 'Unknown'
        }))
    }

    const userMap = new Map(users.map(u => [u.id, u.email]))
    return payments.map(p => ({
        ...p,
        user_email: userMap.get(p.user_id) || 'Unknown'
    }))
}

