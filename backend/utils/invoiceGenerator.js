const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const dbSingleton = require('../dbSingleton.js');
const { convertFromILS } = require('./exchangeRate');

class InvoiceGenerator {
    constructor() {
        this.doc = new PDFDocument({ margin: 50 });
        this.db = dbSingleton.getConnection();
    }

        async getVatRate() {
        try {
            const [settings] = await this.db.query('SELECT taxRate FROM settings LIMIT 1');
            if (settings.length > 0 && settings[0].taxRate !== null) {
                return parseFloat(settings[0].taxRate) || 0;
            }
        } catch (err) {
            console.error('Error fetching VAT rate:', err);
        }
        return 0; // Default to 0 if no settings found
    }

    async getCurrencySymbol() {
        try {
            const [rows] = await this.db.query('SELECT currency FROM settings LIMIT 1');
            if (rows.length > 0 && rows[0].currency) {
                const currency = rows[0].currency;
                const currencySymbols = {
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£',
                    'ILS': '₪'
                };
                return currencySymbols[currency] || currency;
            }
        } catch (err) {
            console.error('Error fetching currency:', err);
        }
        return '₪'; // Default to ILS if no settings found
    }

    async generateInvoice(orderData, userData) {
        const { order_id, order_date, total_amount, shipping_address, payment_method, items, promotion, discount_amount } = orderData;
        const { name, email } = userData;
        
        // Get the current currency symbol and VAT rate
        const currencySymbol = await this.getCurrencySymbol();
        const vatRate = await this.getVatRate();
        
        // Get currency code for conversion
        let currencyCode = 'ILS';
        try {
            const [rows] = await this.db.query('SELECT currency FROM settings LIMIT 1');
            if (rows.length > 0 && rows[0].currency) {
                currencyCode = rows[0].currency;
            }
        } catch (err) {
            console.error('Error fetching currency code:', err);
        }

        // Create the PDF
        const fileName = `invoice_${order_id}_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, '../uploads/invoices', fileName);
        
        // Ensure invoices directory exists
        const invoicesDir = path.dirname(filePath);
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        this.doc.pipe(stream);

        // Enhanced Header with better styling
        this.doc
            .fontSize(28)
            .fillColor('#2563eb')
            .text('TechStock', { align: 'center' })
            .fontSize(16)
            .fillColor('#374151')
            .text('Your Trusted Tech Partner', { align: 'center' })
            .moveDown(0.5);

        // Draw header line
        this.doc
            .strokeColor('#e5e7eb')
            .lineWidth(1)
            .moveTo(50, this.doc.y)
            .lineTo(545, this.doc.y)
            .stroke()
            .moveDown();

        // Invoice title and number section
        this.doc
            .fontSize(20)
            .fillColor('#1f2937')
            .text('INVOICE', 50, this.doc.y, { align: 'left' })
            .fontSize(14)
            .fillColor('#6b7280')
            .text(`#${String(order_id).padStart(6, '0')}`, 450, this.doc.y - 20, { align: 'right' })
            .moveDown();

        // Invoice and customer details in two columns
        const leftColumnX = 50;
        const rightColumnX = 300;
        const detailsStartY = this.doc.y;

        // Left column - Invoice details
        this.doc
            .fontSize(12)
            .fillColor('#374151')
            .text('Invoice Date:', leftColumnX, detailsStartY, { continued: false })
            .fillColor('#1f2937')
            .text(`${new Date(order_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, leftColumnX, this.doc.y)
            .moveDown(0.3)
            .fillColor('#374151')
            .text('Payment Method:', leftColumnX, this.doc.y)
            .fillColor('#1f2937')
            .text(`${payment_method.charAt(0).toUpperCase() + payment_method.slice(1)}`, leftColumnX, this.doc.y);

        // Right column - Customer details
        this.doc
            .fontSize(12)
            .fillColor('#374151')
            .text('Bill To:', rightColumnX, detailsStartY)
            .fontSize(14)
            .fillColor('#1f2937')
            .text(`${name}`, rightColumnX, this.doc.y)
            .fontSize(12)
            .fillColor('#6b7280')
            .text(`${email}`, rightColumnX, this.doc.y)
            .moveDown(0.3)
            .fillColor('#374151')
            .text('Shipping Address:', rightColumnX, this.doc.y)
            .fillColor('#6b7280')
            .text(`${shipping_address}`, rightColumnX, this.doc.y, { width: 245 });

        // Move to next section
        this.doc.y = Math.max(this.doc.y, detailsStartY + 100);
        this.doc.moveDown();

        // Items section with better table design
        this.doc
            .fontSize(16)
            .fillColor('#1f2937')
            .text('Order Items', 50, this.doc.y)
            .moveDown(0.5);

        // Draw table header background
        const tableHeaderY = this.doc.y;
        this.doc
            .rect(50, tableHeaderY, 495, 25)
            .fillColor('#f3f4f6')
            .fill()
            .strokeColor('#e5e7eb')
            .lineWidth(0.5)
            .stroke();

        // Table headers
        this.doc
            .fontSize(12)
            .fillColor('#374151')
            .text('Product', 60, tableHeaderY + 8)
            .text('Qty', 280, tableHeaderY + 8, { width: 40, align: 'center' })
            .text('Unit Price', 340, tableHeaderY + 8, { width: 80, align: 'right' })
            .text('Total', 440, tableHeaderY + 8, { width: 95, align: 'right' });

        let yPosition = tableHeaderY + 25;

        // Convert all item prices from ILS to target currency before rendering
        const convertedItems = await Promise.all(items.map(async (item) => {
            const priceInILS = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            const convertedPrice = await convertFromILS(priceInILS, currencyCode);
            const convertedTotal = convertedPrice * quantity;
            return {
                ...item,
                price: convertedPrice,
                total: convertedTotal,
                quantity
            };
        }));

        // Items with alternating row colors
        convertedItems.forEach((item, index) => {
            const price = item.price;
            const quantity = item.quantity;
            const total = item.total;

            // Alternating row background
            if (index % 2 === 0) {
                this.doc
                    .rect(50, yPosition, 495, 25)
                    .fillColor('#f9fafb')
                    .fill();
            }

            // Row border
            this.doc
                .rect(50, yPosition, 495, 25)
                .strokeColor('#e5e7eb')
                .lineWidth(0.5)
                .stroke();

            this.doc
                .fontSize(11)
                .fillColor('#1f2937')
                .text(item.product_name || 'Product', 60, yPosition + 8, { width: 200 })
                .text(quantity.toString(), 280, yPosition + 8, { width: 40, align: 'center' })
                .text(`${currencySymbol}${price.toFixed(2)}`, 340, yPosition + 8, { width: 80, align: 'right' })
                .text(`${currencySymbol}${total.toFixed(2)}`, 440, yPosition + 8, { width: 95, align: 'right' });
            
            yPosition += 25;
        });

        // Calculate subtotal (using converted prices)
        const subtotal = convertedItems.reduce((sum, item) => sum + item.total, 0);
        const convertedDiscountAmount = await convertFromILS(discount_amount || 0, currencyCode);
        const subtotalAfterDiscount = subtotal - convertedDiscountAmount;
        const netAmount = subtotalAfterDiscount;
        const vatAmount = netAmount * (vatRate / 100);

        // Summary section
        this.doc.y = yPosition + 20;
        const summaryX = 350;
        
        // Subtotal
        this.doc
            .fontSize(12)
            .fillColor('#6b7280')
            .text('Subtotal:', summaryX, this.doc.y)
            .fillColor('#1f2937')
            .text(`${currencySymbol}${subtotal.toFixed(2)}`, summaryX + 100, this.doc.y, { align: 'right' });

        // Show discount if applicable
        if (promotion && convertedDiscountAmount > 0) {
            this.doc
                .moveDown(0.3)
                .fillColor('#6b7280')
                .text(`Discount (${promotion.name}):`, summaryX, this.doc.y)
                .fillColor('#dc2626')
                .text(`-${currencySymbol}${convertedDiscountAmount.toFixed(2)}`, summaryX + 100, this.doc.y, { align: 'right' })
                .moveDown(0.3)
                .fillColor('#6b7280')
                .text('Subtotal after discount:', summaryX, this.doc.y)
                .fillColor('#1f2937')
                .text(`${currencySymbol}${subtotalAfterDiscount.toFixed(2)}`, summaryX + 100, this.doc.y, { align: 'right' });
        }

        // Net Amount (excluding VAT)
        this.doc
            .moveDown(0.3)
            .fillColor('#6b7280')
            .text('Net Amount (excluding VAT):', summaryX, this.doc.y)
            .fillColor('#1f2937')
            .text(`${currencySymbol}${netAmount.toFixed(2)}`, summaryX + 100, this.doc.y, { align: 'right' });

        // VAT
        if (vatRate > 0) {
            this.doc
                .moveDown(0.3)
                .fillColor('#6b7280')
                .text(`VAT (${vatRate}%):`, summaryX, this.doc.y)
                .fillColor('#1f2937')
                .text(`${currencySymbol}${vatAmount.toFixed(2)}`, summaryX + 100, this.doc.y, { align: 'right' });
        }

        // Draw line above total
        this.doc
            .moveDown(0.3)
            .strokeColor('#d1d5db')
            .lineWidth(1)
            .moveTo(summaryX, this.doc.y)
            .lineTo(545, this.doc.y)
            .stroke()
            .moveDown(0.3);

        // Total amount (convert from ILS)
        const convertedTotalAmount = await convertFromILS(parseFloat(total_amount || 0), currencyCode);
        const finalTotal = netAmount + vatAmount; // Use calculated total for consistency
        this.doc
            .fontSize(16)
            .fillColor('#1f2937')
            .text('Total Amount:', summaryX, this.doc.y)
            .fontSize(18)
            .fillColor('#059669')
            .text(`${currencySymbol}${finalTotal.toFixed(2)}`, summaryX + 100, this.doc.y, { align: 'right' });

        // Footer section
        this.doc
            .moveDown(2)
            .strokeColor('#e5e7eb')
            .lineWidth(1)
            .moveTo(50, this.doc.y)
            .lineTo(545, this.doc.y)
            .stroke()
            .moveDown();

        this.doc
            .fontSize(14)
            .fillColor('#2563eb')
            .text('Thank you for your purchase!', { align: 'center' })
            .fontSize(10)
            .fillColor('#6b7280')
            .text('Questions? Contact us at support@techstock.com', { align: 'center' })
            .text('TechStock - Your Trusted Tech Partner', { align: 'center' });

        this.doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve(filePath);
            });
            stream.on('error', reject);
        });
    }
}

module.exports = InvoiceGenerator; 