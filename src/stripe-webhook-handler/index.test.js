const { handleCheckoutSession } = require('./index.js');
const { Firestore } = require('@google-cloud/firestore');

// Mock Firestore
jest.mock('@google-cloud/firestore', () => {
    const mockDoc = {
        get: jest.fn(),
        set: jest.fn(),
        exists: false
    };
    const mockCollection = {
        doc: jest.fn(() => mockDoc)
    };
    const mockFirestore = {
        collection: jest.fn(() => mockCollection)
    };
    return {
        Firestore: jest.fn(() => mockFirestore),
        Timestamp: {
            now: jest.fn(() => 'ISO_NOW')
        }
    };
});

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn()
}));

// Mock Stripe (in main file it's initialized immediately, so we need to mock it before import or use logic separation)
// In this case, we are testing handleCheckoutSession which doesn't directly call Stripe, 
// but the file imports it. The require in the test file might trigger the real require.
// We can mock the module 'stripe'.

jest.mock('stripe', () => {
    return jest.fn(() => ({
        webhooks: {
            constructEvent: jest.fn()
        }
    }));
});

describe('Stripe Webhook Handler', () => {
    let mockFirestoreInstance;
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Get the mock instance
        mockFirestoreInstance = new Firestore();
    });

    test('should provision user if not exists', async () => {
        const session = {
            customer: 'cus_123',
            customer_details: { email: 'test@example.com' }
        };

        const userRef = mockFirestoreInstance.collection().doc();
        // Mock user not existing
        userRef.get.mockResolvedValue({ exists: false });

        await handleCheckoutSession(session);

        expect(mockFirestoreInstance.collection).toHaveBeenCalledWith('users');
        expect(mockFirestoreInstance.collection().doc).toHaveBeenCalledWith('cus_123');
        expect(userRef.set).toHaveBeenCalledWith(expect.objectContaining({
            activationStatus: 'signed_up',
            email: 'test@example.com'
        }));
    });

    test('should skip if user exists', async () => {
        const session = {
            customer: 'cus_123',
            customer_details: { email: 'test@example.com' }
        };

        const userRef = mockFirestoreInstance.collection().doc();
        // Mock user existing
        userRef.get.mockResolvedValue({ exists: true });

        await handleCheckoutSession(session);

        expect(userRef.set).not.toHaveBeenCalled();
    });
});
