export interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense'
    category: string
    description: string
    date: string
    receipt_url?: string
    period_id?: number
    created_at: string
    user_id: string
}

export interface PaymentScheduleItem {
    month: number
    due_date: string
    principal: number
    interest: number
}

export interface SharedItem {
    id: string
    title: string
    total_amount: number
    principal_amount?: number
    interest_amount?: number
    payment_schedule?: PaymentScheduleItem[]
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
