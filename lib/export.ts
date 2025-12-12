import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Transaction } from '@/types'

export function exportToPDF(transactions: Transaction[]) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    // Calculate summary
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const balance = income - expenses

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('TRANSACTIONS REPORT', 105, 15, { align: 'center' })

    // Date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const today = new Date()
    const dateStr = `Date: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
    doc.text(dateStr, 105, 22, { align: 'center' })

    // Summary Section
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, 32)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Income:`, 14, 40)
    doc.setTextColor(34, 197, 94) // green
    doc.text(`${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`, 60, 40)

    doc.setTextColor(0, 0, 0)
    doc.text(`Total Expenses:`, 14, 47)
    doc.setTextColor(239, 68, 68) // red
    doc.text(`${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`, 60, 47)

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text(`Balance:`, 14, 54)
    doc.setTextColor(balance >= 0 ? 34 : 239, balance >= 0 ? 197 : 68, balance >= 0 ? 94 : 68)
    doc.text(`${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`, 60, 54)

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')

    // Transactions Table
    const tableData = transactions.map(t => {
        const date = new Date(t.date)
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`

        // For Thai text, we'll use a placeholder or transliteration
        // This is a workaround since jsPDF doesn't support Thai fonts well
        const description = t.description || '-'
        const category = t.category || '-'

        return [
            dateStr,
            description,
            category,
            t.type === 'income' ? 'Income' : 'Expense',
            `${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`
        ]
    })

    autoTable(doc, {
        startY: 62,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [59, 130, 246], // blue
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 10
        },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            font: 'helvetica',
            // Add overflow handling for Thai text
            overflow: 'linebreak',
            cellWidth: 'wrap'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 30 },
            1: { halign: 'left', cellWidth: 60 },
            2: { halign: 'left', cellWidth: 35 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'right', cellWidth: 35 }
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        },
        didParseCell: function (data) {
            // Color code the type column
            if (data.column.index === 3 && data.section === 'body') {
                const type = transactions[data.row.index].type
                if (type === 'income') {
                    data.cell.styles.textColor = [34, 197, 94] // green
                } else {
                    data.cell.styles.textColor = [239, 68, 68] // red
                }
            }
            // Color code the amount column
            if (data.column.index === 4 && data.section === 'body') {
                const type = transactions[data.row.index].type
                if (type === 'income') {
                    data.cell.styles.textColor = [34, 197, 94] // green
                    data.cell.styles.fontStyle = 'bold'
                } else {
                    data.cell.styles.textColor = [239, 68, 68] // red
                    data.cell.styles.fontStyle = 'bold'
                }
            }
        }
    })

    // Save PDF
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
}
