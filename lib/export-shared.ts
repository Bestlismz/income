import ExcelJS from 'exceljs'
import { SharedItem } from '@/types'

export async function exportSharedItemToExcel(
    item: SharedItem & { total_paid: number },
    payments: any[]
) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Shared Expense Details')

    // Title
    worksheet.mergeCells('A1:D1')
    worksheet.getCell('A1').value = item.title
    worksheet.getCell('A1').font = { bold: true, size: 16 }
    worksheet.getCell('A1').alignment = { horizontal: 'center' }

    // Summary
    worksheet.getCell('A3').value = 'Total Amount:'
    worksheet.getCell('B3').value = item.total_amount
    worksheet.getCell('B3').numFmt = '฿#,##0.00'

    worksheet.getCell('A4').value = 'Total Paid:'
    worksheet.getCell('B4').value = item.total_paid
    worksheet.getCell('B4').numFmt = '฿#,##0.00'

    worksheet.getCell('A5').value = 'Remaining:'
    worksheet.getCell('B5').value = item.total_amount - item.total_paid
    worksheet.getCell('B5').numFmt = '฿#,##0.00'
    worksheet.getCell('B5').font = { bold: true }

    if (item.due_date) {
        worksheet.getCell('A6').value = 'Due Date:'
        worksheet.getCell('B6').value = new Date(item.due_date).toLocaleDateString('th-TH')
    }

    // Payment History Header
    worksheet.getCell('A8').value = 'Payment History'
    worksheet.getCell('A8').font = { bold: true, size: 14 }

    // Table Headers
    worksheet.getRow(10).values = ['Date', 'User', 'Amount', 'Description']
    worksheet.getRow(10).font = { bold: true }
    worksheet.getRow(10).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    }

    // Payment Data
    let row = 11
    payments.forEach((payment) => {
        worksheet.getCell(`A${row}`).value = new Date(payment.paid_at).toLocaleDateString('th-TH')
        worksheet.getCell(`B${row}`).value = payment.user_email || 'Unknown'
        worksheet.getCell(`C${row}`).value = payment.amount
        worksheet.getCell(`C${row}`).numFmt = '฿#,##0.00'
        if (payment.description) {
            worksheet.getCell(`D${row}`).value = payment.description
        }
        row++
    })

    // Column widths
    worksheet.getColumn(1).width = 15
    worksheet.getColumn(2).width = 30
    worksheet.getColumn(3).width = 15
    worksheet.getColumn(4).width = 30

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${item.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(url)
}
