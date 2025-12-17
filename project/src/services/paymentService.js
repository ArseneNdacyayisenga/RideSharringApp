// Mock payment service for frontend demo
// In a real application, this would make API calls to the Spring Boot backend

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock payment methods
const mockPaymentMethods = [
  {
    id: 'card1',
    type: 'CARD',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'card2',
    type: 'CARD',
    brand: 'Mastercard',
    last4: '5678',
    expiryMonth: 9,
    expiryYear: 2024,
    isDefault: false,
  },
  {
    id: 'mobile1',
    type: 'MOBILE_MONEY',
    provider: 'MTN',
    phoneNumber: '+250788123456',
    isDefault: false,
  }
];

// Mock transactions
const mockTransactions = [
  {
    id: 'tx1',
    amount: 3500,
    currency: 'RWF',
    type: 'PAYMENT',
    status: 'COMPLETED',
    date: '2023-09-15T14:35:00',
    description: 'Ride payment - Kigali Heights to Kigali Airport',
    paymentMethod: {
      id: 'mobile1',
      type: 'MOBILE_MONEY',
      provider: 'MTN',
    },
    rideId: 'ride1',
  },
  {
    id: 'tx2',
    amount: 2200,
    currency: 'RWF',
    type: 'PAYMENT',
    status: 'COMPLETED',
    date: '2023-09-10T09:20:00',
    description: 'Ride payment - Nyarutarama to Kimihurura',
    paymentMethod: {
      id: 'card1',
      type: 'CARD',
      brand: 'Visa',
      last4: '4242',
    },
    rideId: 'ride2',
  },
  {
    id: 'tx3',
    amount: 5000,
    currency: 'RWF',
    type: 'TOP_UP',
    status: 'COMPLETED',
    date: '2023-09-08T10:15:00',
    description: 'Wallet top-up',
    paymentMethod: {
      id: 'card1',
      type: 'CARD',
      brand: 'Visa',
      last4: '4242',
    },
  },
  {
    id: 'tx4',
    amount: 10000,
    currency: 'RWF',
    type: 'TOP_UP',
    status: 'COMPLETED',
    date: '2023-09-01T16:30:00',
    description: 'Wallet top-up',
    paymentMethod: {
      id: 'mobile1',
      type: 'MOBILE_MONEY',
      provider: 'MTN',
    },
  },
];

export const paymentService = {
  getPaymentMethods: async () => {
    await delay(1000);
    return mockPaymentMethods;
  },
  
  addPaymentMethod: async (paymentMethod) => {
    await delay(1500);
    
    const newPaymentMethod = {
      id: 'new-' + Date.now(),
      ...paymentMethod,
      isDefault: false,
    };
    
    return { success: true, paymentMethod: newPaymentMethod };
  },
  
  removePaymentMethod: async (paymentMethodId) => {
    await delay(1000);
    return { success: true, message: 'Payment method removed successfully' };
  },
  
  setDefaultPaymentMethod: async (paymentMethodId) => {
    await delay(800);
    return { success: true, message: 'Default payment method updated' };
  },
  
  getTransactions: async (page = 0, size = 10) => {
    await delay(1000);
    
    return {
      content: mockTransactions,
      totalElements: mockTransactions.length,
      totalPages: Math.ceil(mockTransactions.length / size),
      size,
      number: page,
    };
  },
  
  getWalletBalance: async () => {
    await delay(500);
    return {
      balance: 15000,
      currency: 'RWF',
    };
  },
  
  topUpWallet: async (amount, paymentMethodId) => {
    await delay(2000);
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    return {
      success: true,
      transaction: {
        id: 'top-up-' + Date.now(),
        amount,
        currency: 'RWF',
        type: 'TOP_UP',
        status: 'COMPLETED',
        date: new Date().toISOString(),
        description: 'Wallet top-up',
      },
      newBalance: 15000 + amount,
    };
  },
  
  withdrawFromWallet: async (amount, paymentMethodId) => {
    await delay(2000);
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (amount > 15000) {
      throw new Error('Insufficient funds');
    }
    
    return {
      success: true,
      transaction: {
        id: 'withdraw-' + Date.now(),
        amount,
        currency: 'RWF',
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        date: new Date().toISOString(),
        description: 'Wallet withdrawal',
      },
      newBalance: 15000 - amount,
    };
  },
};