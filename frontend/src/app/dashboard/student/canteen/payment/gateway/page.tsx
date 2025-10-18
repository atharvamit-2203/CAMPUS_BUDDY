"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { CreditCard, Smartphone, Building, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { config } from '@/config';

const API = config.apiUrl;

const downloadQRAsPDF = async (qrUrl: string, orderId: number) => {
  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();

    // Fetch the image
    const response = await fetch(qrUrl);
    const blob = await response.blob();

    const reader = new FileReader();
    reader.onload = () => {
      const imgData = reader.result as string;
      pdf.addImage(imgData, 'PNG', 20, 20, 160, 160);
      pdf.text('Canteen Pickup QR Code', 20, 190);
      pdf.text(`Order ID: ${orderId}`, 20, 200);
      pdf.text('Show this QR code at the canteen counter for pickup.', 20, 210);
      pdf.save(`canteen_pickup_${orderId}.pdf`);
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to PNG download
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `canteen_pickup_${orderId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Component that uses useSearchParams needs to be wrapped in Suspense
function PaymentGatewayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderToken] = useState(searchParams.get('order_token') || '');
  const [amount] = useState(Number(searchParams.get('amount')) || 0);
  const [selectedMethod, setSelectedMethod] = useState<string>('credit_card');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
    order_id: number;
    transaction_id: string;
    qr_url: string;
    pickup_instructions: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: '',
    upiId: '',
    bankAccount: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const processPayment = async () => {
    if (!orderToken || amount <= 0) {
      alert('Invalid order details');
      return;
    }

    setProcessing(true);
    try {
      const paymentDetails = {
        method: selectedMethod,
        ...(selectedMethod === 'credit_card' && {
          card_number: formData.cardNumber.replace(/\s/g, ''),
          expiry_date: formData.expiryDate,
          cvv: formData.cvv,
          card_holder_name: formData.cardHolderName
        }),
        ...(selectedMethod === 'upi' && {
          upi_id: formData.upiId
        }),
        ...(selectedMethod === 'net_banking' && {
          bank_account: formData.bankAccount
        })
      };

      const resp = await fetch(`${API}/canteen/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`
        },
        body: JSON.stringify({
          order_token: orderToken,
          payment_method_type: selectedMethod,
          payment_details: paymentDetails
        })
      });

      if (!resp.ok) throw new Error('Payment processing failed');
      const result = await resp.json();

      if (result.success) {
        setPaymentResult(result);
        setPaymentSuccess(true);

        // Auto-download QR code as PDF
        downloadQRAsPDF(result.qr_url, result.order_id);
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert((error as Error).message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'credit_card':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
              <input
                type="text"
                value={formData.cardHolderName}
                onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                placeholder="John Doe"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );
      case 'upi':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => handleInputChange('upiId', e.target.value)}
              placeholder="username@paytm"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      case 'net_banking':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
            <select
              value={formData.bankAccount}
              onChange={(e) => handleInputChange('bankAccount', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Select your bank"
            >
              <option value="">Select Your Bank</option>
              <option value="sbi">State Bank of India</option>
              <option value="hdfc">HDFC Bank</option>
              <option value="icici">ICICI Bank</option>
              <option value="axis">Axis Bank</option>
              <option value="pnb">Punjab National Bank</option>
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  if (paymentSuccess && paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <RoleBasedNavigation currentPage="canteen" />
        <div className="flex-1 p-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">Your order has been paid successfully.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Transaction ID:</p>
              <p className="font-mono text-sm font-bold">{paymentResult.transaction_id}</p>
            </div>

            <div className="mb-6">
              <div className="w-48 h-48 mx-auto border rounded-lg overflow-hidden">
                <Image 
                  src={paymentResult.qr_url} 
                  alt="Pickup QR Code" 
                  width={192}
                  height={192}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{paymentResult.pickup_instructions}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => downloadQRAsPDF(paymentResult.qr_url, paymentResult.order_id)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download QR Code (PDF)
              </button>
              <button
                onClick={() => router.push('/dashboard/student/canteen')}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Canteen
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RoleBasedNavigation currentPage="canteen" />
      <div className="flex-1 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.back()}
                className="mr-3 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Secure Payment</h1>
              <Lock className="w-5 h-5 text-green-600 ml-auto" />
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-1">Order Summary</h3>
              <p className="text-blue-600">Amount to Pay: <span className="font-bold">₹{amount.toFixed(2)}</span></p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Select Payment Method</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedMethod('credit_card')}
                  className={`w-full p-4 border rounded-lg flex items-center transition-colors ${
                    selectedMethod === 'credit_card'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  Credit/Debit Card
                </button>
                <button
                  onClick={() => setSelectedMethod('upi')}
                  className={`w-full p-4 border rounded-lg flex items-center transition-colors ${
                    selectedMethod === 'upi'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mr-3" />
                  UPI
                </button>
                <button
                  onClick={() => setSelectedMethod('net_banking')}
                  className={`w-full p-4 border rounded-lg flex items-center transition-colors ${
                    selectedMethod === 'net_banking'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Building className="w-5 h-5 mr-3" />
                  Net Banking
                </button>
              </div>
            </div>

            <div className="mb-6">
              {renderPaymentForm()}
            </div>

            <button
              onClick={processPayment}
              disabled={processing || !orderToken}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing Payment...' : `Pay ₹${amount.toFixed(2)}`}
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                <Lock className="w-3 h-3 inline mr-1" />
                Your payment information is encrypted and secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function PaymentGatewayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment gateway...</p>
        </div>
      </div>
    }>
      <PaymentGatewayContent />
    </Suspense>
  );
}