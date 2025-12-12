import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { SharedItem } from '@/types'

export function exportSharedItemToPDF(
    item: SharedItem & { total_paid: number },
    payments: any[]
) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const remaining = item.total_amount - item.total_paid
    const progress = (item.total_paid / item.total_amount) * 100

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(item.title.toUpperCase(), 105, 15, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Shared Expense Report', 105, 22, { align: 'center' })

    // Date
    doc.setFontSize(10)
    const today = new Date()
    const dateStr = `Generated: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
    doc.text(dateStr, 105, 28, { align: 'center' })

    // Summary Section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, 38)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    doc.text(`Total Amount:`, 14, 46)
    doc.setTextColor(59, 130, 246) // blue
    doc.text(`${item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`, 60, 46)

    doc.setTextColor(0, 0, 0)
    doc.text(`Total Paid:`, 14, 53)
    doc.setTextColor(34, 197, 94) // green
    doc.text(`${item.total_paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`, 60, 53)

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text(`Remaining:`, 14, 60)
    doc.setTextColor(remaining > 0 ? 239 : 34, remaining > 0 ? 68 : 197, remaining > 0 ? 68 : 94)
    doc.text(`${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`, 60, 60)

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(`Progress:`, 14, 67)
    doc.text(`${progress.toFixed(1)}%`, 60, 67)

    if (item.due_date) {
        const dueDate = new Date(item.due_date)
        doc.text(`Due Date:`, 14, 74)
        doc.text(`${dueDate.getDate()}/${dueDate.getMonth() + 1}/${dueDate.getFullYear()}`, 60, 74)
    }

    let startY = item.due_date ? 82 : 75

    // Payment Schedule Table (if available)
    if (item.payment_schedule && item.payment_schedule.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Payment Schedule', 14, startY)

        const scheduleData = item.payment_schedule.map(period => {
            const dueDate = new Date(period.due_date)
            const dateStr = `${dueDate.getDate()}/${dueDate.getMonth() + 1}/${dueDate.getFullYear()}`
            return [
                period.month.toString(),
                dateStr,
                `${period.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`,
                `${period.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`,
                `${(period.principal + period.interest).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`
            ]
        })

        autoTable(doc, {
            startY: startY + 5,
            head: [['Period', 'Due Date', 'Principal', 'Interest', 'Total']],
            body: scheduleData,
            theme: 'striped',
            headStyles: {
                fillColor: [99, 102, 241], // indigo
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 10
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                font: 'helvetica'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                1: { halign: 'center', cellWidth: 35 },
                2: { halign: 'right', cellWidth: 35 },
                3: { halign: 'right', cellWidth: 35 },
                4: { halign: 'right', cellWidth: 35 }
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        })

        startY = (doc as any).lastAutoTable.finalY + 10
    }

    // Payment History Table
    if (payments.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Payment History', 14, startY)

        const paymentData = payments.map(payment => {
            const paidDate = new Date(payment.paid_at)
            const dateStr = `${paidDate.getDate()}/${paidDate.getMonth() + 1}/${paidDate.getFullYear()}`
            return [
                dateStr,
                payment.user_email || 'Unknown',
                `${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`,
                payment.description || '-'
            ]
        })

        autoTable(doc, {
            startY: startY + 5,
            head: [['Date', 'User', 'Amount', 'Description']],
            body: paymentData,
            theme: 'striped',
            headStyles: {
                fillColor: [34, 197, 94], // green
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 10
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                font: 'helvetica',
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 35 },
                1: { halign: 'left', cellWidth: 50 },
                2: { halign: 'right', cellWidth: 30, textColor: [34, 197, 94], fontStyle: 'bold' },
                3: { halign: 'left', cellWidth: 60 }
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            }
        })
    } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(128, 128, 128)
        doc.text('No payments recorded yet', 14, startY + 5)
    }

    // Save PDF
    const filename = `${item.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}
