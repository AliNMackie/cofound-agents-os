import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        // Aggressive cleaning for PEM formatting
        // This handles: surrounding quotes, double-escaped newlines (\\n), 
        // and literal newlines.
        let cleanedKey = privateKey
            .trim()
            .replace(/^["']|["']$/g, '')
            .replace(/\\n/g, '\n');

        // Final safety check: if it still doesn't look like it has real newlines in the body,
        // it might be entirely single-line with literal \n strings still present
        if (!cleanedKey.includes('\n', cleanedKey.indexOf('-----BEGIN PRIVATE KEY-----') + 25)) {
            cleanedKey = cleanedKey.replace(/\\n/g, '\n');
        }

        console.log(`Firebase Admin: Initializing for project ${projectId}`);
        console.log(`Cleaned key length: ${cleanedKey.length}`);

        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: cleanedKey,
                }),
            });
            console.log("Firebase Admin: Successfully initialized.");
        } catch (initError: any) {
            console.error("Firebase Admin: Initialization failed:", initError.message);
            throw initError;
        }
    } else {
        console.warn("Firebase Admin: Missing credentials. Skipping initialization (expected during build).");
    }
}

// Export db as a proxy to handle cases where it's accessed before initialization
// or when initialization is skipped (e.g. during a static build)
const db = new Proxy({} as admin.firestore.Firestore, {
    get: (target, prop) => {
        if (!admin.apps.length) {
            console.warn(`Firestore access attempt for '${String(prop)}' without initialization.`);
            // Return a dummy object that chain-fails gracefully or returns empty snapshots
            return () => ({
                collection: () => ({
                    get: () => Promise.resolve({ docs: [] }),
                    add: () => Promise.resolve({ id: 'mock-id' }),
                    doc: () => ({ get: () => Promise.resolve({ exists: false }) }),
                    where: () => ({ orderBy: () => ({ limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) }) }),
                    orderBy: () => ({ limit: () => ({ get: () => Promise.resolve({ docs: [] }) }) }),
                })
            });
        }
        return (admin.firestore() as any)[prop];
    }
});

export { db };
