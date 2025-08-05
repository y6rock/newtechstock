const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const dbSingleton = require('../dbSingleton.js');

class InvoiceGenerator {
    constructor() {
        this.doc = new PDFDocument({ margin: 50 });
        this.db = dbSingleton.getConnection();
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
        
        // Get the current currency symbol
        const currencySymbol = await this.getCurrencySymbol();

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

        // Header
        this.doc
            .fontSize(20)
            .text('TechStock', { align: 'center' })
            .fontSize(12)
            .text('INVOICE', { align: 'center' })
            .moveDown();

        // Invoice details
        this.doc
            .fontSize(14)
            .text(`Invoice #: ${order_id}`)
            .text(`Date: ${new Date(order_date).toLocaleDateString()}`)
            .text(`Customer: ${name}`)
            .text(`Email: ${email}`)
            .text(`Shipping Address: ${shipping_address}`)
            .text(`Payment Method: ${payment_method.toUpperCase()}`)
            .moveDown();

        // Items table header
        this.doc
            .fontSize(12)
            .text('Items:', { underline: true })
            .moveDown();

        // Items
        let yPosition = this.doc.y;
        this.doc.text('Product', 50, yPosition);
        this.doc.text('Quantity', 250, yPosition);
        this.doc.text('Price', 350, yPosition);
        this.doc.text('Total', 450, yPosition);
        yPosition += 20;

        items.forEach(item => {
            // Ensure price is a number
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            
            this.doc.text(item.product_name || 'Product', 50, yPosition);
            this.doc.text(quantity.toString(), 250, yPosition);
            this.doc.text(`${currencySymbol}${price.toFixed(2)}`, 350, yPosition);
            this.doc.text(`${currencySymbol}${(price * quantity).toFixed(2)}`, 450, yPosition);
            yPosition += 20;
        });

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);

        // Show discount information if applicable
        if (promotion && discount_amount > 0) {
            this.doc
                .moveDown()
                .fontSize(12)
                .text(`Subtotal: ${currencySymbol}${subtotal.toFixed(2)}`, { align: 'right' })
                .text(`Discount (${promotion.name}): -${currencySymbol}${discount_amount.toFixed(2)}`, { align: 'right' })
                .text(`Total after discount: ${currencySymbol}${(subtotal - discount_amount).toFixed(2)}`, { align: 'right' });
        }

        // Total
        this.doc
            .moveDown()
            .fontSize(14)
            .text(`Total Amount: ${currencySymbol}${parseFloat(total_amount || 0).toFixed(2)}`, { align: 'right' })
            .moveDown();

        // Footer
        this.doc
            .fontSize(10)
            .text('Thank you for your purchase!', { align: 'center' })
            .text('TechStock - Your trusted tech partner', { align: 'center' });

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