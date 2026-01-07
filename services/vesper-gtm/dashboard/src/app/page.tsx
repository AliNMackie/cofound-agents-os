'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

// Define types locally since we are in a separate app context
type LeadPlatform = 'linkedin' | 'reddit';
type LeadStatus = 'new' | 'review' | 'queued' | 'active' | 'archived';

interface LeadProfile {
  name: string;
  bio: string;
  role: string;
}

interface LeadScores {
  icp_fit: number;
  intent: number;
}

interface LeadEvent {
  type: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface Lead {
  id: string;
  platform: LeadPlatform;
  profileData: LeadProfile;
  status: LeadStatus;
  scores: LeadScores;
  history: LeadEvent[];
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      const q = query(collection(db, 'leads'), where('status', '==', 'review'));
      const querySnapshot = await getDocs(q);
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        // We assume the data matches the interface.
        // In a real app, use a converter or validation.
        leadsData.push({ id: doc.id, ...doc.data() } as Lead);
      });
      setLeads(leadsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      console.warn('Firebase API Key missing. Dashboard will remain in offline mode.');
      setLoading(false);
      return;
    }
    fetchLeads();
  }, []);

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    try {
      const leadRef = doc(db, 'leads', id);
      await updateDoc(leadRef, { status: newStatus });
      // Remove from local state
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Vesper Dashboard (Antigravity)</h1>

      {leads.length === 0 ? (
        <div className="text-xl text-gray-400">No leads pending review.</div>
      ) : (
        <div className="w-full max-w-5xl space-y-4">
          {leads.map((lead) => {
            // Extract the latest draft message
            const draftEvent = [...lead.history]
              .reverse()
              .find((e) => e.type === 'DRAFT_CREATED');
            const draftMessage = draftEvent?.details?.draft || 'No draft available.';

            return (
              <div key={lead.id} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{lead.profileData.name}</h2>
                    <p className="text-gray-400 text-sm">{lead.profileData.role}</p>
                    <p className="text-gray-500 text-xs mt-1">{lead.profileData.bio}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase mr-2 ${lead.platform === 'linkedin' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                      {lead.platform}
                    </span>
                    <div className="mt-2 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <span>ICP: <span className="text-green-400">{lead.scores.icp_fit}</span></span>
                        <span>Intent: <span className="text-yellow-400">{lead.scores.intent}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Draft Message</h3>
                  <p className="text-gray-300 font-mono text-sm whitespace-pre-wrap">{draftMessage}</p>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => updateStatus(lead.id, 'archived')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus(lead.id, 'queued')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
