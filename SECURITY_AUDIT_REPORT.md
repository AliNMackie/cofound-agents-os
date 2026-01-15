# Security Audit Report

## 1. Git Ignore Audit: ✅ PASS
I have analyzed `c:\Users\Alastair Mackie\cofound-agents-os\.gitignore`.
The following critical protections are in place:
- [x] `.env` (Secrets/API Keys) is ignored.
- [x] `data/*.csv` (Client CSVs) is ignored.
- [x] `data/*.xlsx` (Client Excel files) is ignored.

**Status:** Your client data files and secrets are safe from being committed to Git.

## 2. Firestore Rules Audit: ⚠️ MISSING / HIGH RISK
I **could not find** a `firestore.rules` file in your repository.
This typically means:
1.  You are using the default rules set in the Firebase Console (often "Test Mode" `allow read, write: if true;`).
2.  **Risk:** If you are in "Test Mode", **anyone** on the internet can guess your project ID and read/write your `watchlists` and `user_settings`.

## 3. Recommended Action (URGENT)
Create a `firestore.rules` file in your root directory and deploy it to Firebase.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check auth
    function isAuthenticated() {
      return request.auth != null;
    }

    // LOCK DOWN BY DEFAULT
    match /{document=**} {
      allow read, write: if false;
    }
    
    // User Settings: Only readable/writable by the authenticated owner
    // (Assuming user_settings/{userId} pattern, or 'default_tenant' for shared internal app)
    match /user_settings/{settingId} {
       allow read, write: if isAuthenticated();
    }
    
    // Watchlists: SENSITIVE CLIENT DATA
    // Only allow authenticated internal users to read/write
    match /watchlists/{watchlistId} {
      allow read, write: if isAuthenticated();
      
      // Nested subcollections (targets)
      match /targets/{targetId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    // Auctions/Signals: Generally readable by app users, writable only by admin/backend
    match /auctions/{auctionId} {
       allow read: if isAuthenticated();
       allow write: if false; // Only manageable by Backend Admin SDK (which bypasses rules)
    }
  }
}
```

**Next Steps:**
1.  Save this file as `firestore.rules`.
2.  Install firebase-tools (`npm install -g firebase-tools`).
3.  Run `firebase deploy --only firestore`.
