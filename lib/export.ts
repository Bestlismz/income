import ExcelJS from 'exceljs'
import { Transaction } from '@/types'

export async function exportToExcel(transactions: Transaction[]) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Transactions')

    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Amount', key: 'amount', width: 15 },
    ]

    transactions.forEach((t) => {
        worksheet.addRow(t)
    })

    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(url)
}
