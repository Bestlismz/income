import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Transaction } from '@/types'

export async function exportToPDF(transactions: Transaction[]) {
  // Calculate summary
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const balance = income - expenses

  // Create a temporary container for HTML content
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '800px'
  container.style.padding = '20px'
  container.style.backgroundColor = 'white'
  container.style.color = 'black'
  container.style.fontFamily = 'Arial, sans-serif'
  // Force light theme for PDF export
  container.setAttribute('data-theme', 'light')
  container.className = 'light'

  const today = new Date()
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="font-size: 24px; margin: 0 0 5px 0;">TRANSACTIONS REPORT</h1>
      <p style="margin: 0; font-size: 12px;">Date: ${dateStr}</p>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
      <h2 style="font-size: 16px; margin: 0 0 10px 0;">Summary</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Total Income:</span>
        <span style="color: #22c55e; font-weight: bold;">${income.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Total Expenses:</span>
        <span style="color: #ef4444; font-weight: bold;">${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 5px; border-top: 1px solid #ddd;">
        <span style="font-weight: bold;">Balance:</span>
        <span style="color: ${balance >= 0 ? '#22c55e' : '#ef4444'}; font-weight: bold;">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
      </div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr style="background: #3b82f6; color: white;">
          <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Date</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Category</th>
          <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Type</th>
          <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((t, index) => {
    const date = new Date(t.date)
    const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    const isIncome = t.type === 'income'
    const bgColor = index % 2 === 0 ? '#f5f7fa' : 'white'

    return `
            <tr style="background: ${bgColor};">
              <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${dateStr}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${t.description}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${t.category}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: ${isIncome ? '#22c55e' : '#ef4444'};">${isIncome ? 'Income' : 'Expense'}</td>
              <td style="padding: 8px; text-align: right; border: 1px solid #ddd; color: ${isIncome ? '#22c55e' : '#ef4444'}; font-weight: bold;">${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
            </tr>
          `
  }).join('')}
      </tbody>
    </table>
  `

  document.body.appendChild(container)

  try {
    // Wait a bit for fonts to load
    await new Promise(resolve => setTimeout(resolve, 100))

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      windowHeight: container.scrollHeight
    })

    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297 // A4 height in mm

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
    }

    // Save PDF
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}
