const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');
const twilio = require('twilio');

// Mock dependencies
jest.mock('@google-cloud/firestore');
jest.mock('axios');
jest.mock('twilio');

describe('Contract Processor', () => {
    let mockFirestore;
    let mockTwilioClient;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockFirestore = new Firestore();
        // Setup Twilio mock
        mockTwilioClient = {
            messages: {
                create: jest.fn().mockResolvedValue({})
            }
        };
        twilio.mockReturnValue(mockTwilioClient);
    });

    test('should process contract successfully', async () => {
        const { processContract } = require('./index.js');
        
        process.env.CONTRACT_AGENT_URL = 'http://contract-agent';
        process.env.TWILIO_ACCOUNT_SID = 'AC123';
        process.env.TWILIO_AUTH_TOKEN = 'token';
        process.env.TWILIO_FROM_NUMBER = '+1000';
        
        axios.post.mockResolvedValue({ status: 200 });
        
        // Mock Firestore calls
        const batchMock = {
            set: jest.fn(),
            commit: jest.fn().mockResolvedValue()
        };
        mockFirestore.batch.mockReturnValue(batchMock);

        // Define the leaf node (Contract Document)
        const contractDocRef = {
            set: jest.fn().mockResolvedValue()
        };
        
        // Define the Contracts Collection
        const contractsCollectionRef = {
            doc: jest.fn().mockReturnValue(contractDocRef)
        };
        
        // Define the User Document
        const userDocRef = {
            collection: jest.fn().mockImplementation((name) => {
                if (name === 'contracts') return contractsCollectionRef;
                return { doc: jest.fn() };
            }),
            get: jest.fn().mockResolvedValue({
                 data: jest.fn().mockReturnValue({ phoneNumber: '+1234567890' })
            }),
            set: jest.fn().mockResolvedValue()
        };
        
        // Define the Users Collection
        const usersCollectionRef = {
            doc: jest.fn().mockReturnValue(userDocRef)
        };
        
        // Define the Firestore instance behavior
        mockFirestore.collection.mockImplementation((name) => {
             if (name === 'users') return usersCollectionRef;
             return { doc: jest.fn() };
        });

        const cloudEvent = {
            data: {
                value: {
                    name: 'projects/my-project/databases/(default)/documents/users/user123/contracts/contract456',
                    fields: {
                        gcsPath: { stringValue: 'gs://bucket/contract.pdf' }
                    }
                }
            }
        };

        await processContract(cloudEvent);

        expect(axios.post).toHaveBeenCalledWith('http://contract-agent', {
            userId: 'user123',
            contractId: 'contract456',
            gcsPath: 'gs://bucket/contract.pdf'
        });
        
        expect(batchMock.commit).toHaveBeenCalled();
        expect(mockTwilioClient.messages.create).toHaveBeenCalled();
    });
});
