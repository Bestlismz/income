// Calculate how payment is allocated between interest and principal
export function calculatePaymentAllocation(
    payment: number,
    remainingInterest: number,
    remainingPrincipal: number
) {
    let toInterest = 0
    let toPrincipal = 0

    if (remainingInterest > 0) {
        // Pay interest first
        toInterest = Math.min(payment, remainingInterest)
        const leftover = payment - toInterest

        if (leftover > 0 && remainingPrincipal > 0) {
            // Pay principal with leftover
            toPrincipal = Math.min(leftover, remainingPrincipal)
        }
    } else {
        // No interest remaining, pay principal
        toPrincipal = Math.min(payment, remainingPrincipal)
    }

    return { toInterest, toPrincipal }
}

// Calculate total paid to interest and principal
export function calculateTotals(
    payments: Array<{ amount: number }>,
    principalAmount: number,
    interestAmount: number
) {
    let remainingInterest = interestAmount
    let remainingPrincipal = principalAmount
    let totalInterestPaid = 0
    let totalPrincipalPaid = 0

    payments.forEach(payment => {
        const { toInterest, toPrincipal } = calculatePaymentAllocation(
            payment.amount,
            remainingInterest,
            remainingPrincipal
        )

        totalInterestPaid += toInterest
        totalPrincipalPaid += toPrincipal
        remainingInterest -= toInterest
        remainingPrincipal -= toPrincipal
    })

    return {
        totalInterestPaid,
        totalPrincipalPaid,
        remainingInterest,
        remainingPrincipal
    }
}
