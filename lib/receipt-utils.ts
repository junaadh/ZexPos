// =============================================================================
// RECEIPT GENERATION UTILITIES
// =============================================================================
// Utilities for generating, formatting, and printing receipts

import type { Order, Receipt, ReceiptData, ReceiptTemplate } from '@/lib/types'
import { jsPDF } from 'jspdf'

// =============================================================================
// RECEIPT GENERATION
// =============================================================================

export function generateReceiptNumber(): string {
    const now = new Date()
    const timestamp = now.getTime()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `RCP${timestamp}${random}`
}

export function generateReceiptData(
    order: Order,
    restaurant: {
        name: string
        address: string
        phone?: string
        email?: string
        logo_url?: string
    },
    paymentDetails: {
        method: "cash" | "card" | "digital_wallet"
        amount_tendered?: number
        change_amount?: number
        payment_reference?: string
    }
): ReceiptData {
    return {
        restaurant: {
            name: restaurant.name,
            address: restaurant.address,
            phone: restaurant.phone,
            email: restaurant.email,
            logo_url: restaurant.logo_url,
        },
        order: {
            order_number: order.order_number,
            table_number: order.restaurant_tables?.table_number?.toString(),
            table_name: order.restaurant_tables?.table_name,
            server_name: order.staff?.full_name,
            order_type: order.order_type,
            created_at: order.created_at,
            completed_at: new Date().toISOString(),
        },
        customer: order.customer_name ? {
            name: order.customer_name,
            phone: order.customer_phone,
        } : undefined,
        items: order.order_items?.map(item => ({
            name: item.menu_items?.name || 'Unknown Item',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            special_instructions: item.special_instructions,
        })) || [],
        summary: {
            subtotal: order.subtotal,
            tax_amount: order.tax_amount,
            discount_amount: order.discount_amount,
            total_amount: order.total_amount,
        },
        payment: paymentDetails,
        footer: {
            thank_you_message: "Thank you for dining with us!",
            return_policy: "No returns on food items. Please speak to a manager for any concerns.",
        },
    }
}

// =============================================================================
// RECEIPT FORMATTING
// =============================================================================

export function formatReceiptForPrint(
    receiptData: ReceiptData,
    template?: ReceiptTemplate
): string {
    // Use standard receipt width for better formatting
    const width = template?.width || 40
    const separator = '='.repeat(width)
    const dashes = '-'.repeat(width)

    let receipt = ''

    // Header - Restaurant Name (centered, uppercase)
    if (template?.header_config.show_restaurant_name !== false) {
        receipt += centerText(receiptData.restaurant.name.toUpperCase(), width) + '\n'
    }

    // Address (centered)
    if (template?.header_config.show_address !== false) {
        receipt += centerText(receiptData.restaurant.address, width) + '\n'
    }

    // Contact info (centered)
    if (template?.header_config.show_contact !== false) {
        if (receiptData.restaurant.phone) {
            receipt += centerText(`Tel: ${receiptData.restaurant.phone}`, width) + '\n'
        }
    }

    receipt += separator + '\n'

    // Order Info
    receipt += `Receipt: ${receiptData.order.order_number}\n`
    receipt += `Date: ${formatDateTime(receiptData.order.completed_at)}\n`

    if (receiptData.order.server_name) {
        receipt += `Server: ${receiptData.order.server_name}\n`
    }

    if (receiptData.order.table_number) {
        receipt += `Table: ${receiptData.order.table_number}\n`
    }

    receipt += `Type: ${formatOrderType(receiptData.order.order_type)}\n`

    receipt += dashes + '\n'

    // Items - same line format like in the good preview
    receiptData.items.forEach(item => {
        const itemLine = `${item.quantity}x ${item.name}`
        const priceText = formatCurrency(item.total_price)
        receipt += formatItemLine(itemLine, priceText, width) + '\n'

        // Special instructions if any
        if (item.special_instructions) {
            receipt += `   Note: ${item.special_instructions}\n`
        }
    })

    receipt += dashes + '\n'

    // Summary - using proper alignment like the good preview
    receipt += formatSummaryLine('Subtotal:', receiptData.summary.subtotal, width) + '\n'
    receipt += formatSummaryLine('Tax:', receiptData.summary.tax_amount, width) + '\n'

    if (receiptData.summary.discount_amount > 0) {
        receipt += formatSummaryLine('Discount:', -receiptData.summary.discount_amount, width) + '\n'
    }

    receipt += dashes + '\n'
    receipt += formatSummaryLine('TOTAL:', receiptData.summary.total_amount, width, true) + '\n'
    receipt += separator + '\n'

    // Payment Info
    receipt += `Payment: ${formatPaymentMethod(receiptData.payment.method)}\n`

    if (receiptData.payment.amount_tendered) {
        receipt += formatSummaryLine('Tendered:', receiptData.payment.amount_tendered, width) + '\n'
    }

    if (receiptData.payment.change_amount && receiptData.payment.change_amount > 0) {
        receipt += formatSummaryLine('Change:', receiptData.payment.change_amount, width) + '\n'
    }

    receipt += dashes + '\n'
    receipt += '\n'

    // Footer (centered)
    receipt += centerText('Thank you for your business!', width) + '\n'
    receipt += centerText('Please come again', width) + '\n'
    receipt += '\n'
    receipt += centerText('[QR Code for Digital Receipt]', width) + '\n'

    return receipt
}

// Helper function for compact date formatting
function formatCompactDateTime(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

// Helper function for thermal printer summary lines
function formatThermalSummaryLine(label: string, amount: number, width: number, bold?: boolean): string {
    const amountText = formatCurrency(amount)
    const spaces = width - label.length - amountText.length
    const line = label + ' '.repeat(Math.max(1, spaces)) + amountText
    return bold ? line.toUpperCase() : line
}

// =============================================================================
// RECEIPT PRINTING
// =============================================================================

export function printReceipt(receiptContent: string): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600')

    if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup blockers.')
    }

    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        @media print {
          @page {
            margin: 5mm;
            size: 80mm auto; /* Standard receipt printer width */
          }
          .no-print {
            display: none !important;
          }
          body {
            font-size: 10px !important;
            line-height: 1.2 !important;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
          margin: 0;
          padding: 0;
          background: white;
          color: black;
          width: 100%;
          max-width: 58mm;
        }
        
        .print-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 6px 6px 0 0;
          margin-bottom: 0;
        }
        
        .print-header h1 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: bold;
        }
        
        .print-header p {
          margin: 0;
          opacity: 0.9;
        }
        
        .receipt-content {
          background: white;
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 0 0 6px 6px;
          white-space: pre-line;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.3;
          max-width: 400px;
          margin: 0 auto;
          word-wrap: break-word;
        }
        
        .button-container {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .btn {
          display: inline-block;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          text-decoration: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin: 0 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #545b62;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .container {
          max-width: 300px;
          margin: 10px auto;
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        @media screen {
          body {
            background: #f0f2f5;
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="print-header no-print">
          <h1>Receipt Preview</h1>
          <p>Review your receipt before printing</p>
        </div>
        
        <div class="button-container no-print">
          <button onclick="window.print()" class="btn btn-primary">
            🖨️ Print Receipt
          </button>
          <button onclick="window.close()" class="btn btn-secondary">
            ✕ Close
          </button>
        </div>
        
        <div class="receipt-content">
${receiptContent}
        </div>
      </div>
      
      <script>
        // Auto-print on load for thermal printers if requested
        if (window.location.search.includes('autoprint=true')) {
          setTimeout(() => {
            window.print();
          }, 1000);
        }
        
        // Close window after printing if auto-print was used
        window.addEventListener('afterprint', () => {
          if (window.location.search.includes('autoprint=true')) {
            setTimeout(() => {
              window.close();
            }, 500);
          }
        });
      </script>
    </body>
    </html>
  `

    printWindow.document.write(printContent)
    printWindow.document.close()
}

export function downloadReceiptAsPDF(receiptContent: string, receiptNumber: string): void {
    try {
        // Split content into lines first to calculate needed height
        const lines = receiptContent.split('\n');

        // Calculate estimated height needed (with some padding)
        const lineHeight = 3.5; // mm per line
        const estimatedHeight = Math.max(200, (lines.length * lineHeight) + 40); // minimum 200mm

        // Create a new PDF document with dynamic height
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, estimatedHeight] // 80mm width (standard receipt width), dynamic height
        });

        // Set font for receipt
        pdf.setFont('courier');
        pdf.setFontSize(10);

        let yPosition = 10; // Start from top
        const leftMargin = 5;
        const rightMargin = 5;
        const maxWidth = 80 - leftMargin - rightMargin; // 70mm usable width
        const charWidth = 1.5; // Approximate character width in mm for courier 10pt
        const maxCharsPerLine = Math.floor(maxWidth / charWidth); // About 46 characters

        lines.forEach((line, index) => {
            // Check if we need a new page
            if (yPosition > estimatedHeight - 20) {
                pdf.addPage();
                yPosition = 8;
            }

            if (line.trim() === '') {
                // Empty line - just add space
                yPosition += lineHeight;
                return;
            }

            // Handle long lines by proper text wrapping
            if (line.length > maxCharsPerLine) {
                // Use jsPDF's built-in text wrapping
                const wrappedLines = pdf.splitTextToSize(line, maxWidth);
                wrappedLines.forEach((wrappedLine: string) => {
                    if (yPosition > estimatedHeight - 20) {
                        pdf.addPage();
                        yPosition = 8;
                    }
                    pdf.text(wrappedLine, leftMargin, yPosition);
                    yPosition += lineHeight;
                });
            } else {
                // Regular line - add as is
                pdf.text(line, leftMargin, yPosition);
                yPosition += lineHeight;
            }
        });

        // If the content ended up being longer than estimated, extend the page
        if (yPosition > estimatedHeight - 10) {
            const newHeight = yPosition + 20;
            // Note: jsPDF doesn't allow resizing, but our initial calculation should handle most cases
        }

        // Download the PDF
        pdf.save(`receipt-${receiptNumber}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback to text file if PDF generation fails
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${receiptNumber}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function centerText(text: string, width: number): string {
    if (text.length >= width) return text
    const padding = Math.floor((width - text.length) / 2)
    return ' '.repeat(padding) + text
}

function formatItemLine(itemText: string, priceText: string, width: number): string {
    // Simple and reliable approach: pad with dots
    const maxItemWidth = width - priceText.length - 2; // Leave space for dots and price

    let truncatedItem = itemText;
    if (itemText.length > maxItemWidth) {
        truncatedItem = itemText.substring(0, maxItemWidth - 3) + '...';
    }

    // Calculate dots needed
    const dotsNeeded = width - truncatedItem.length - priceText.length;
    const dots = '.'.repeat(Math.max(1, dotsNeeded));

    return truncatedItem + dots + priceText;
}

function formatSummaryLine(label: string, amount: number, width: number, bold?: boolean): string {
    const amountText = formatCurrency(amount);
    const spacesNeeded = width - label.length - amountText.length;
    const spaces = ' '.repeat(Math.max(1, spacesNeeded));
    const line = label + spaces + amountText;
    return bold ? line.toUpperCase() : line;
}

function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
}

function formatDateTime(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

function formatOrderType(orderType: string): string {
    switch (orderType) {
        case 'dine_in': return 'Dine In'
        case 'takeaway': return 'Takeaway'
        case 'delivery': return 'Delivery'
        default: return orderType
    }
}

function formatPaymentMethod(method: string): string {
    switch (method) {
        case 'cash': return 'Cash'
        case 'card': return 'Card'
        case 'digital_wallet': return 'Digital Wallet'
        default: return method
    }
}

function wrapText(text: string, width: number): string {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach(word => {
        if ((currentLine + word).length > width) {
            if (currentLine.trim()) {
                lines.push(currentLine.trim())
                currentLine = word + ' '
            } else {
                lines.push(word)
                currentLine = ''
            }
        } else {
            currentLine += word + ' '
        }
    })

    if (currentLine.trim()) {
        lines.push(currentLine.trim())
    }

    return lines.join('\n')
}
