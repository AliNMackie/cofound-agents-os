const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const twilio = require('twilio');

const firestore = new Firestore();

let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

functions.http('smartNudge', async (req, res) => {
    try {
        await checkAndNudgeUsers();
        res.status(200).send('Smart Nudge check completed.');
    } catch (error) {
        console.error('Error in smartNudge:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

async function checkAndNudgeUsers() {
    const now = new Date();
    const usersRef = firestore.collection('users');

    // Query users who are signed up but not activated
    // Limit to 500 for batching
    const snapshot = await usersRef
        .where('activationStatus', '==', 'signed_up')
        .limit(500)
        .get();

    if (snapshot.empty) {
        console.log('No users found to process.');
        return;
    }

    const promises = [];

    snapshot.forEach(doc => {
        promises.push(processUser(doc, now));
    });

    await Promise.all(promises);
}

async function processUser(doc, now) {
    const userData = doc.data();
    const userId = doc.id;

    // Check if signupDate exists
    if (!userData.signupDate) return;

    // Handle Firestore Timestamp or ISO String
    let signupDate;
    if (userData.signupDate.toDate) {
        signupDate = userData.signupDate.toDate();
    } else {
        signupDate = new Date(userData.signupDate);
    }

    const diffMs = now - signupDate;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Retrieve past nudges
    // Optimally, store 'lastNudge' in user doc to avoid subcollection read,
    // but requirements say "Update activity_log". We should probably check if we already sent it.
    // For efficiency, let's assume we store a flag in user doc: `nudgeStatus: 'nudge_A'` etc.
    // If not, we have to query the subcollection which is expensive (N+1 reads).
    // Let's assume we maintain `nudgeStatus` on the user doc as per previous Python implementation logic.

    const nudgeStatus = userData.nudgeStatus || 'none';

    try {
        const thresholdA = parseInt(process.env.NUDGE_A_THRESHOLD_HOURS || '24');
        const thresholdB = parseInt(process.env.NUDGE_B_THRESHOLD_HOURS || '72');

        if (diffHours >= thresholdA && diffHours < thresholdB) {
            // Trigger A
            if (nudgeStatus === 'none') {
                await sendNudge(userId, userData, 'nudge_A', "Hey, I noticed you haven't uploaded a contract. Reply with your PDF.");
            }
        } else if (diffHours >= thresholdB) {
            // Trigger B
            // Only send B if A was sent (or if we skipped A because we missed the window, but logically we go sequentially).
            // Logic: If time > 72h, send B. If A wasn't sent, should we send A? Usually B supersedes.
            // Requirement: "Trigger B (72h Inactive)"
            if (nudgeStatus === 'nudge_A' || nudgeStatus === 'none') {
                // If status is none (missed A window?), maybe send B directly.
                // But let's check if we already sent B.
                if (nudgeStatus !== 'nudge_B') {
                    await sendNudge(userId, userData, 'nudge_B', "Is there an issue? Click here to book a 5-min fix call.");
                }
            }
        }
    } catch (e) {
        console.error(`Failed to process user ${userId}:`, e);
    }
}

async function sendNudge(userId, userData, nudgeType, message) {
    console.log(`Sending ${nudgeType} to ${userId}`);

    if (!userData.phoneNumber) {
        console.log(`User ${userId} has no phone number. Skipping.`);
        return;
    }

    if (twilioClient) {
        try {
            await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_FROM_NUMBER,
                to: userData.phoneNumber
            });
        } catch (e) {
            console.error(`Twilio error for ${userId}:`, e);
            // We might want to continue to update DB even if SMS fails to avoid retry loop? 
            // Or fail. Let's fail log but update status to avoid spamming if it's a permanent error?
            // Safer to not update status so we retry.
            throw e;
        }
    } else {
        console.log('Twilio client not configured, skipping send.');
    }

    // Update User Status
    const userRef = firestore.collection('users').doc(userId);
    await userRef.update({
        nudgeStatus: nudgeType
    });

    // Log to activity_log
    await userRef.collection('activity_log').add({
        type: nudgeType,
        sentAt: Firestore.Timestamp.now(),
        channel: 'sms',
        context: message
    });
}

module.exports = {
    checkAndNudgeUsers, // For testing
    processUser // For testing
};
