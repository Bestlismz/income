import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { SharedItem } from '@/types'

export async function exportSharedItemToPDF(
    item: SharedItem & { total_paid: number },
    payments: any[]
) {
    const remaining = item.total_amount - item.total_paid
    const progress = (item.total_paid / item.total_amount) * 100

    const today = new Date()
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

    // Create temporary container
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '800px'
    container.style.padding = '20px'
    container.style.backgroundColor = 'white'
    container.style.fontFamily = 'Arial, sans-serif'

    let htmlContent = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="font-size: 24px; margin: 0 0 5px 0;">${item.title.toUpperCase()}</h1>
      <p style="margin: 0; font-size: 14px;">Shared Expense Report</p>
      <p style="margin: 5px 0 0 0; font-size: 11px;">Generated: ${todayStr}</p>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 8px;">
      <h2 style="font-size: 16px; margin: 0 0 10px 0;">Summary</h2>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Total Amount:</span>
        <span style="color: #3b82f6; font-weight: bold;">${item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>Total Paid:</span>
        <span style="color: #22c55e; font-weight: bold;">${item.total_paid.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="font-weight: bold;">Remaining:</span>
        <span style="color: ${remaining > 0 ? '#ef4444' : '#22c55e'}; font-weight: bold;">${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Progress:</span>
        <span>${progress.toFixed(1)}%</span>
      </div>
      ${item.due_date ? `
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
          <span>Due Date:</span>
          <span>${new Date(item.due_date).getDate()}/${new Date(item.due_date).getMonth() + 1}/${new Date(item.due_date).getFullYear()}</span>
        </div>
      ` : ''}
    </div>
  `

    // Payment Schedule
    if (item.payment_schedule && item.payment_schedule.length > 0) {
        htmlContent += `
      <h2 style="font-size: 16px; margin: 20px 0 10px 0;">Payment Schedule</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #6366f1; color: white;">
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Period</th>
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Due Date</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Principal</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Interest</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${item.payment_schedule.map((period, index) => {
            const dueDate = new Date(period.due_date)
            const dateStr = `${dueDate.getDate()}/${dueDate.getMonth() + 1}/${dueDate.getFullYear()}`
            const bgColor = index % 2 === 0 ? '#f5f7fa' : 'white'
            return `
              <tr style="background: ${bgColor};">
                <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${period.month}</td>
                <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${dateStr}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${period.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${period.interest.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${(period.principal + period.interest).toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
              </tr>
            `
        }).join('')}
        </tbody>
      </table>
    `
    }

    // Payment History
    if (payments.length > 0) {
        htmlContent += `
      <h2 style="font-size: 16px; margin: 20px 0 10px 0;">Payment History</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background: #22c55e; color: white;">
            <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Date</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">User</th>
            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Amount</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Description</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map((payment, index) => {
            const paidDate = new Date(payment.paid_at)
            const dateStr = `${paidDate.getDate()}/${paidDate.getMonth() + 1}/${paidDate.getFullYear()}`
            const bgColor = index % 2 === 0 ? '#f5f7fa' : 'white'
            return `
              <tr style="background: ${bgColor};">
                <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${dateStr}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${payment.user_email || 'Unknown'}</td>
                <td style="padding: 6px; text-align: right; border: 1px solid #ddd; color: #22c55e; font-weight: bold;">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${payment.description || '-'}</td>
              </tr>
            `
        }).join('')}
        </tbody>
      </table>
    `
    } else {
        htmlContent += `
      <h2 style="font-size: 16px; margin: 20px 0 10px 0;">Payment History</h2>
      <p style="font-style: italic; color: #6b7280;">No payments recorded yet</p>
    `
    }

    container.innerHTML = htmlContent
    document.body.appendChild(container)

    try {
        // Convert HTML to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
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
        const filename = `${item.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(filename)
    } finally {
        // Clean up
        document.body.removeChild(container)
    }
}
