const { processUser } = require('./index.js');
const { Firestore } = require('@google-cloud/firestore');
const twilio = require('twilio');

// Mock dependencies
jest.mock('@google-cloud/firestore');
jest.mock('twilio');

describe('Smart Nudge Worker', () => {
    let mockFirestore;
    let mockTwilioClient;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockFirestore = new Firestore();
        mockTwilioClient = {
            messages: {
                create: jest.fn().mockResolvedValue({})
            }
        };
        twilio.mockReturnValue(mockTwilioClient);
    });

    test('should send Trigger A after 24h', async () => {
        const now = new Date('2023-10-02T10:00:00Z');
        const signupDate = new Date('2023-10-01T09:00:00Z'); // 25 hours ago
        
        const updateMock = jest.fn();
        const addMock = jest.fn();
        
        const doc = {
            id: 'user1',
            data: () => ({
                signupDate: signupDate,
                nudgeStatus: 'none',
                phoneNumber: '+123'
            })
        };

        // Mock Firestore calls for update
        const userRefMock = {
            update: updateMock,
            collection: jest.fn().mockReturnValue({
                add: addMock
            })
        };
        
        mockFirestore.collection.mockReturnValue({
            doc: jest.fn().mockReturnValue(userRefMock)
        });

        // Setup Env
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'token';
        process.env.TWILIO_FROM_NUMBER = '+1000';
        
        // Reload module to pick up env vars and init twilio
        jest.isolateModules(async () => {
            const { processUser } = require('./index.js');
            await processUser(doc, now);
        });

        // Verification needs to happen on the mocks used inside isolated module
        // But since we mock 'twilio' and '@google-cloud/firestore' globally, 
        // the instances created inside should use our mocks.
        
        // Wait for async operations? processUser is async.
        // We need to re-require to test properly with environment variables affecting module scope init.
    });

    // Let's rewrite test to simply call the function with mocked dependencies
    // without isolation complexity if possible, assuming client is initialized or we mock it.
    
    test('Trigger A Logic', async () => {
        // We must ensure the env vars are present BEFORE require if possible, 
        // or ensure the module reads them dynamically or we mock twilio client creation.
        // In the implementation, twilioClient is init at top level.
        // Since we mock 'twilio', we control what it returns.
        
        // Issue: The module is already required in the first test (implicit or explicit).
        // If we want to verify twilio calls, we must ensure twilioClient is "truthy" in the module.
        // In the module: `if (process.env... && ...) twilioClient = ...`
        
        // Set env vars
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'token';
        process.env.TWILIO_FROM_NUMBER = '+1000';
        
        // We need to re-require to execute top-level init again
        jest.resetModules();
        jest.mock('@google-cloud/firestore');
        jest.mock('twilio', () => jest.fn(() => mockTwilioClient));
        
        // Re-setup mockFirestore for this isolation
        const { Firestore } = require('@google-cloud/firestore');
        Firestore.mockImplementation(() => mockFirestore);

        const { processUser } = require('./index.js'); 

        const now = new Date('2023-10-02T10:00:00Z');
        const signupDate = new Date('2023-10-01T09:00:00Z'); // 25 hours ago
        
        const updateMock = jest.fn();
        const addMock = jest.fn();
        
        const doc = {
            id: 'user1',
            data: () => ({
                signupDate: signupDate,
                nudgeStatus: 'none',
                phoneNumber: '+123'
            })
        };
        
        const userRefMock = {
            update: updateMock,
            collection: jest.fn().mockReturnValue({
                add: addMock
            })
        };

        mockFirestore.collection.mockReturnValue({
            doc: jest.fn().mockReturnValue(userRefMock)
        });
        
        await processUser(doc, now);
        
        // Verify Twilio called
        expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({
            body: expect.stringContaining("haven't uploaded a contract")
        }));
        
        // Verify Update
        expect(updateMock).toHaveBeenCalledWith({ nudgeStatus: 'nudge_A' });
    });

    test('Trigger B Logic', async () => {
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'token';
        process.env.TWILIO_FROM_NUMBER = '+1000';
        
        jest.resetModules();
        jest.mock('@google-cloud/firestore');
        jest.mock('twilio', () => jest.fn(() => mockTwilioClient));
        
        const { Firestore } = require('@google-cloud/firestore');
        Firestore.mockImplementation(() => mockFirestore);

        const { processUser } = require('./index.js');

        const now = new Date('2023-10-05T10:00:00Z');
        const signupDate = new Date('2023-10-01T09:00:00Z'); // > 72h
        
        const updateMock = jest.fn();
        const addMock = jest.fn();
        
        const doc = {
            id: 'user1',
            data: () => ({
                signupDate: signupDate,
                nudgeStatus: 'nudge_A',
                phoneNumber: '+123'
            })
        };
        
        const userRefMock = {
            update: updateMock,
            collection: jest.fn().mockReturnValue({
                add: addMock
            })
        };

        mockFirestore.collection.mockReturnValue({
            doc: jest.fn().mockReturnValue(userRefMock)
        });
        
        await processUser(doc, now);
        
        expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({
            body: expect.stringContaining("Is there an issue")
        }));
        
        expect(updateMock).toHaveBeenCalledWith({ nudgeStatus: 'nudge_B' });
    });
});
