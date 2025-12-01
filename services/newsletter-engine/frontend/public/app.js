// ------------------------------------------------------
// CONFIGURATION - Environment-based
// ------------------------------------------------------

// Load configuration from environment or use defaults
// For production: Use Firebase Hosting reserved URLs
// For development: Set window.ENV before loading this script
const getFirebaseConfig = () => {
    // Check if running on Firebase Hosting (production)
    if (window.location.hostname.includes('firebaseapp.com') ||
        window.location.hostname.includes('web.app')) {
        // Firebase Hosting automatically provides config at this URL
        return fetch('/__/firebase/init.json')
            .then(response => response.json());
    }

    // Development: Use environment variables or defaults
    return Promise.resolve({
        apiKey: window.ENV?.FIREBASE_API_KEY || "AIzaSyCoTXMQfMjhfGyhbG296Jc08cv8AwoI-00",
        authDomain: window.ENV?.FIREBASE_AUTH_DOMAIN || "newsletter-engine-9988.firebaseapp.com",
        projectId: window.ENV?.FIREBASE_PROJECT_ID || "newsletter-engine-9988",
        storageBucket: window.ENV?.FIREBASE_STORAGE_BUCKET || "newsletter-engine-9988.firebasestorage.app",
        messagingSenderId: window.ENV?.FIREBASE_MESSAGING_SENDER_ID || "99727052460",
        appId: window.ENV?.FIREBASE_APP_ID || "1:99727052460:web:2bde35c737279a3a4d1909",
        measurementId: window.ENV?.FIREBASE_MEASUREMENT_ID || "G-ZJ8J4YF5GP"
    });
};

// API Endpoints Configuration
const API_CONFIG = {
    INGEST_URL: window.ENV?.API_GATEWAY_URL || 'https://newsletter-gateway-19tawu5o.nw.gateway.dev/v1/ingest',
    N8N_WEBHOOK_URL: window.ENV?.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/submit-feedback'
};

// Initialize Firebase
let db, auth;
getFirebaseConfig().then(config => {
    firebase.initializeApp(config);
    db = firebase.firestore();
    auth = firebase.auth();

    // Set up auth state listener after initialization
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            loadDrafts(user.uid);
        }
    });
}).catch(error => {
    console.error("Firebase initialization failed:", error);
    alert("Failed to initialize app. Please check your configuration.");
});

// ------------------------------------------------------
// 1. AUTHENTICATION (Google)
// ------------------------------------------------------
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        console.log("User logged in:", result.user.email);
        loadDrafts(result.user.uid);
    }).catch(error => {
        console.error("Login failed", error);
        alert("Login failed: " + error.message);
    });
}

// ------------------------------------------------------
// 2. INGESTION LOGIC (Quick Add)
// ------------------------------------------------------
function submitAdhoc() {
    const content = document.getElementById('adhoc-content').value;
    const url = document.getElementById('adhoc-url').value;
    const type = document.getElementById('content-type').value;

    if (!content && !url) {
        alert("Please enter some text or a URL.");
        return;
    }

    const btn = document.querySelector('button.action-btn');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    // Use environment-based API URL
    fetch(API_CONFIG.INGEST_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.currentUser.accessToken}`
        },
        body: JSON.stringify({
            client_id: auth.currentUser.uid,
            content: content,
            url: url,
            source_type: type,
            ingested_via: 'dashboard_manual',
            organization_id: auth.currentUser.uid
        })
    }).then(res => {
        if (res.ok) {
            alert('✅ Content Ingested! The Brain is updating.');
            document.getElementById('adhoc-content').value = '';
            document.getElementById('adhoc-url').value = '';
        } else {
            alert('Error ingesting content. Check console.');
        }
    }).catch(err => console.error(err))
        .finally(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        });
}

// ------------------------------------------------------
// 3. DRAFT LOADING & RENDERING
// ------------------------------------------------------
function loadDrafts(uid) {
    db.collection('drafts')
        .where('client_id', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get()
        .then(snap => {
            if (!snap.empty) {
                const doc = snap.docs[0];
                const data = doc.data();
                document.getElementById('draft-content').innerHTML = data.email_html || data.content;
                window.currentDraftId = doc.id;
            } else {
                document.getElementById('draft-content').innerHTML = "<p>No drafts found. Add content to generate one!</p>";
            }
        });
}

// ------------------------------------------------------
// 4. GENERATIVE UI (Context Menu Interaction)
// ------------------------------------------------------
document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const menu = document.getElementById('quick-actions-menu');
    const contentArea = document.getElementById('draft-content');

    if (selection.toString().trim().length > 0 && contentArea.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0).getBoundingClientRect();
        menu.style.display = 'block';
        menu.style.top = `${window.scrollY + range.bottom + 10}px`;
        menu.style.left = `${window.scrollX + range.left}px`;
        window.currentSelection = selection.toString();
    } else {
        if (!menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    }
});

function triggerAction(actionType) {
    const menu = document.getElementById('quick-actions-menu');
    const originalHTML = menu.innerHTML;
    menu.innerHTML = '<div style="padding:8px; color:#666;">🤖 AI Thinking...</div>';

    // Use environment-based webhook URL
    fetch(API_CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: auth.currentUser.uid,
            draft_id: window.currentDraftId,
            comment: window.currentSelection,
            action_type: actionType
        })
    }).then(res => {
        menu.style.display = 'none';
        menu.innerHTML = originalHTML;
        if (res.ok) {
            alert("✅ AI is revising this section. The draft will update shortly.");
        } else {
            alert("Error sending feedback. Check n8n logs.");
        }
    }).catch(err => {
        console.error("Fetch failed:", err);
        alert("Failed to connect to n8n. Is Docker running?");
    }).finally(() => {
        menu.innerHTML = originalHTML;
    });
}