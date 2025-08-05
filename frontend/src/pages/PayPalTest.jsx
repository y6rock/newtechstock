import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import './PayPalTest.css';

const PayPalTest = () => {
    const [amount, setAmount] = useState('10.00');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [paymentDetails, setPaymentDetails] = useState(null);

    const handlePaymentSuccess = (details) => {
        setPaymentStatus('Payment Successful!');
        setPaymentDetails(details);
        console.log('Payment completed successfully:', details);
    };

    const handlePaymentError = (err) => {
        setPaymentStatus('Payment Failed!');
        console.error('PayPal payment error:', err);
    };

    const handlePaymentCancel = () => {
        setPaymentStatus('Payment Cancelled!');
        console.log('Payment was cancelled by user');
    };

    return (
        <div className="paypal-test-container">
            <div className="paypal-test-header">
                <h1>🔄 PayPal Sandbox Test</h1>
                <p>Test your PayPal integration with sandbox credentials</p>
            </div>

            <div className="paypal-test-content">
                <div className="test-info">
                    <h2>Test Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <strong>Environment:</strong> Sandbox
                        </div>
                        <div className="info-item">
                            <strong>Currency:</strong> USD (US Dollar)
                        </div>
                        <div className="info-item">
                            <strong>Test Account:</strong> sb-1234567890@business.example.com
                        </div>
                        <div className="info-item">
                            <strong>Password:</strong> test123
                        </div>
                    </div>
                </div>

                <div className="amount-selector">
                    <label htmlFor="amount">Test Amount (USD):</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        className="amount-input"
                    />
                </div>

                <div className="payment-section">
                    <h3>Test Payment</h3>
                    <div className="paypal-button-container">
                        <PayPalButtons
                            createOrder={(data, actions) => {
                                return actions.order.create({
                                    purchase_units: [
                                        {
                                            amount: {
                                                value: amount,
                                                currency_code: "USD"
                                            },
                                            description: `TechStock Test Payment - ${amount} USD`
                                        }
                                    ]
                                });
                            }}
                            onApprove={(data, actions) => {
                                return actions.order.capture().then((details) => {
                                    handlePaymentSuccess(details);
                                });
                            }}
                            onError={(err) => {
                                handlePaymentError(err);
                            }}
                            onCancel={() => {
                                handlePaymentCancel();
                            }}
                        />
                    </div>
                </div>

                {paymentStatus && (
                    <div className={`payment-status ${paymentStatus.includes('Successful') ? 'success' : paymentStatus.includes('Failed') ? 'error' : 'warning'}`}>
                        <h3>Payment Status</h3>
                        <p>{paymentStatus}</p>
                        {paymentDetails && (
                            <div className="payment-details">
                                <h4>Payment Details:</h4>
                                <pre>{JSON.stringify(paymentDetails, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                )}

                <div className="sandbox-notes">
                    <h3>📝 Sandbox Testing Notes</h3>
                    <ul>
                        <li>Use the test account credentials above to log in</li>
                        <li>No real money will be charged</li>
                        <li>All transactions are simulated</li>
                        <li>Check the browser console for detailed logs</li>
                        <li>Payment details will be displayed after successful payment</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PayPalTest; 