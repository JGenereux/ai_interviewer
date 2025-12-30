interface BillingHistory {
    id: string | null
    stripeId: string
    userId: string
    amount: number
    description: string
    createdAt: Date
    type: 'subscription' | 'payment'
}

export type { BillingHistory }