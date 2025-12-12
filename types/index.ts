export interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense'
    category: string
    description: string
    date: string
    receipt_url?: string
    created_at: string
    user_id: string
}

export interface SharedItem {
    id: string
    title: string
    total_amount: number
    due_date?: string
    created_by: string
    created_at: string
}

export interface SharedPayment {
    id: string
    item_id: string
    user_id: string
    amount: number
    paid_at: string
}
