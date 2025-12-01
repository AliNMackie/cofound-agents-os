const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');
const twilio = require('twilio');

const firestore = new Firestore();

// Initialize Twilio client lazily or if env vars are present
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const processContract = async (cloudEvent) => {
    const firestoreEvent = cloudEvent.data;
    const resourceName = firestoreEvent.value.name; // e.g., projects/.../databases/(default)/documents/users/{userId}/contracts/{contractId}
    
    // Extract userId and contractId from resource name
    // Format: projects/{project}/databases/{database}/documents/users/{userId}/contracts/{contractId}
    const matches = resourceName.match(/users\/([^/]+)\/contracts\/([^/]+)/);
    
    if (!matches) {
        console.error(`Invalid resource name format: ${resourceName}`);
        return;
    }

    const userId = matches[1];
    const contractId = matches[2];
    
    // Get fields from the event payload (Proto format) or fetch document if needed.
    // The payload usually contains 'fields'.
    // firestoreEvent.value.fields.gcsPath.stringValue
    const fields = firestoreEvent.value.fields;
    const gcsPath = fields && fields.gcsPath ? fields.gcsPath.stringValue : null;

    if (!gcsPath) {
        console.error(`No gcsPath found in document ${resourceName}`);
        await updateContractStatus(userId, contractId, 'error', 'Missing gcsPath');
        return;
    }

    try {
        // Call Internal ContractAgent
        const contractAgentUrl = process.env.CONTRACT_AGENT_URL;
        if (!contractAgentUrl) {
            throw new Error('CONTRACT_AGENT_URL env var not set');
        }

        console.log(`Calling ContractAgent for user ${userId}, contract ${contractId}`);
        
        // Assuming ContractAgent expects JSON payload
        const response = await axios.post(contractAgentUrl, {
            userId,
            contractId,
            gcsPath
        });

        if (response.status !== 200 && response.status !== 201) {
            throw new Error(`ContractAgent returned status ${response.status}`);
        }

        // Success: Update Firestore
        await updateFirestoreSuccess(userId, contractId);

        // Notify User via SMS
        await sendSmsNotification(userId);

    } catch (error) {
        console.error(`Error processing contract ${contractId} for user ${userId}:`, error);
        await updateContractStatus(userId, contractId, 'error', error.message);
    }
};

functions.cloudEvent('processContract', processContract);

async function updateContractStatus(userId, contractId, status, errorMsg = null) {
    // Note: In tests, we must ensure mocks support this chain.
    const userRef = firestore.collection('users').doc(userId);
    const contractsCol = userRef.collection('contracts');
    const contractRef = contractsCol.doc(contractId);
    
    const updateData = { status: status };
    if (errorMsg) updateData.error = errorMsg;
    await contractRef.set(updateData, { merge: true });
}

async function updateFirestoreSuccess(userId, contractId) {
    const batch = firestore.batch();
    
    const userRef = firestore.collection('users').doc(userId);
    
    // Explicitly call firestore.collection().doc().collection().doc() to match mock structure better if needed,
    // but userRef.collection() should work if userRef is the mock object returned by doc(userId).
    // The issue in test is likely that `batch.set(contractRef)` requires `contractRef` to be a valid ref.
    // In the test, `userRef` is `userDocRefMock`.
    // `userRef.collection('contracts')` returns `subCollectionRefMock`.
    // `subCollectionRefMock.doc(contractId)` returns `subDocRefMock`.
    
    const contractRef = userRef.collection('contracts').doc(contractId);

    // Update Contract Status
    batch.set(contractRef, { status: 'report_ready' }, { merge: true });

    // Update User Status and Metadata
    batch.set(userRef, {
        activationStatus: 'report_ready',
        firstReportReadyAt: Firestore.Timestamp.now()
    }, { merge: true });

    await batch.commit();
    console.log(`Firestore updated for user ${userId} (Success)`);
}

async function sendSmsNotification(userId) {
    // Need user's phone number. Fetch from user doc.
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.phoneNumber) {
        console.warn(`No phone number found for user ${userId}. Skipping SMS.`);
        return;
    }

    if (!twilioClient) {
        console.warn('Twilio client not initialized. Skipping SMS.');
        return;
    }

    try {
        await twilioClient.messages.create({
            body: 'Your Verified Report is ready.',
            from: process.env.TWILIO_FROM_NUMBER,
            to: userData.phoneNumber
        });
        console.log(`SMS sent to user ${userId}`);
    } catch (error) {
        console.error(`Failed to send SMS to user ${userId}:`, error);
        // We don't fail the whole process if SMS fails, just log it.
    }
}

module.exports = { 
    processContract,
    updateContractStatus,
    updateFirestoreSuccess,
    sendSmsNotification
};
