import * as admin from 'firebase-admin';
import { Lead, LeadStatus, LeadPlatform } from '../types';

// Initialize Firebase Admin (assumes credentials are set via env or default)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const LEADS_COLLECTION = 'leads';

async function wipeLeads() {
  console.log(`Wiping '${LEADS_COLLECTION}' collection...`);
  const collectionRef = db.collection(LEADS_COLLECTION);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log('Collection is already empty.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${snapshot.size} documents.`);
}

const DUMMY_LEADS: Lead[] = [
  // 2 'High Intent' leads (Status: 'new', ICP Score: 3, Intent: 3)
  {
    id: 'lead-high-1',
    platform: 'linkedin',
    profileData: {
      name: 'Alice Johnson',
      bio: 'VP of Engineering at TechCorp. Scaling teams.',
      role: 'VP Engineering',
    },
    status: 'new',
    scores: { icp_fit: 3, intent: 3 },
    history: [],
  },
  {
    id: 'lead-high-2',
    platform: 'reddit',
    profileData: {
      name: 'u/dev_guru_99',
      bio: 'Looking for enterprise automation tools.',
      role: 'Software Architect',
    },
    status: 'new',
    scores: { icp_fit: 3, intent: 3 },
    history: [],
  },
  // 3 'Low Intent' leads (Status: 'new', ICP Score: 1, Intent: 1)
  {
    id: 'lead-low-1',
    platform: 'linkedin',
    profileData: {
      name: 'Bob Smith',
      bio: 'Student at University. Learning coding.',
      role: 'Student',
    },
    status: 'new',
    scores: { icp_fit: 1, intent: 1 },
    history: [],
  },
  {
    id: 'lead-low-2',
    platform: 'reddit',
    profileData: {
      name: 'u/random_poster',
      bio: 'Just hanging out.',
      role: 'Unknown',
    },
    status: 'new',
    scores: { icp_fit: 1, intent: 1 },
    history: [],
  },
  {
    id: 'lead-low-3',
    platform: 'linkedin',
    profileData: {
      name: 'Charlie Brown',
      bio: 'Marketing intern.',
      role: 'Intern',
    },
    status: 'new',
    scores: { icp_fit: 1, intent: 1 },
    history: [],
  },
];

async function seedDB() {
  try {
    await wipeLeads();

    console.log('Seeding database...');
    const batch = db.batch();

    DUMMY_LEADS.forEach((lead) => {
      const docRef = db.collection(LEADS_COLLECTION).doc(lead.id);
      
      // Initialize history with a creation event
      const leadWithHistory: Lead = {
        ...lead,
        history: [
          {
            type: 'CREATED',
            timestamp: new Date().toISOString(),
            details: { source: 'seed-script' },
          },
        ],
      };

      batch.set(docRef, leadWithHistory);
    });

    await batch.commit();
    console.log(`Successfully seeded ${DUMMY_LEADS.length} leads.`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Execute
seedDB();
