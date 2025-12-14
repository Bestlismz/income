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

export interface Category {
    id: string
    name: string
    color: string
    icon?: string
    type: 'income' | 'expense'
    is_default: boolean
    user_id?: string
}

export interface SavingsGoal {
    id: string
    name: string
    target_amount: number
    current_amount: number
    deadline?: string
    color: string
    icon?: string
    user_id: string
    created_at: string
}

export interface Budget {
    id: string
    user_id: string
    category: string
    amount: number
    month: string // First day of month as ISO string
    created_at: string
}

export interface RecurringTransaction {
    id: string
    user_id: string
    amount: number
    type: 'income' | 'expense'
    category: string
    description: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    start_date: string
    end_date?: string
    last_generated?: string
    is_active: boolean
    created_at: string
}
