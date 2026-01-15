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
  // 3 'High Intent' leads (Status: 'review' - Ready for Action)
  {
    id: 'lead-high-1',
    platform: 'linkedin',
    profileData: {
      name: 'Michael Chen',
      bio: 'CTO at FinScale. Scaling our engineering team.',
      role: 'Chief Technology Officer',
    },
    status: 'review',
    scores: { icp_fit: 95, intent: 88 },
    history: [],
  },
  {
    id: 'lead-high-2',
    platform: 'reddit',
    profileData: {
      name: 'u/infra_architect',
      bio: 'Looking for enterprise orchestration tools for Kubernetes.',
      role: 'Senior DevOps Engineer',
    },
    status: 'review',
    scores: { icp_fit: 92, intent: 85 },
    history: [],
  },
  {
    id: 'lead-high-3',
    platform: 'linkedin',
    profileData: {
      name: 'Sarah Miller',
      bio: 'VP Engineering at DataFlow. Hiring backend devs.',
      role: 'VP Engineering',
    },
    status: 'review',
    scores: { icp_fit: 89, intent: 91 },
    history: [],
  },

  // 2 'Queued' leads (Already processed)
  {
    id: 'lead-queued-1',
    platform: 'linkedin',
    profileData: {
      name: 'David Wilson',
      bio: 'Head of Product. New startup mode.',
      role: 'Head of Product',
    },
    status: 'queued',
    scores: { icp_fit: 85, intent: 70 },
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
