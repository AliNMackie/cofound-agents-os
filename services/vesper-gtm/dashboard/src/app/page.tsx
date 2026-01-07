'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { MorningPulse } from '@/components/MorningPulse';

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
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-secondary mb-2">Command Centre</p>
        <h1 className="text-4xl font-bold tracking-tighter text-black dark:text-white">Pipeline Control</h1>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Morning Pulse (8 cols) */}
        <div className="lg:col-span-8">
          <MorningPulse />
        </div>

        {/* Right Column: Stats & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 dark:bg-black dark:border-neutral-800">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-brand-text-secondary">Pending Review</p>
            <p className="text-5xl font-bold text-black dark:text-white">{leads.length}</p>
          </div>
          <div className="card p-6 opacity-50 dark:bg-black dark:border-neutral-800">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-brand-text-secondary">In Queue</p>
            <p className="text-5xl font-bold text-black dark:text-white">0</p>
          </div>
          <div className="card p-6 opacity-50 dark:bg-black dark:border-neutral-800">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-brand-text-secondary">Conversion</p>
            <p className="text-5xl font-bold text-black dark:text-white">--</p>
          </div>
        </div>
      </div>

      {/* Lead Inbox Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold dark:text-white">Lead Review Queue</h2>
        <div className="flex items-center gap-2">
          <button className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-brand-border rounded hover:bg-brand-background transition-colors dark:border-neutral-700">Filter</button>
          <button className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-brand-border rounded hover:bg-brand-background transition-colors dark:border-neutral-700">Export</button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-brand-text-secondary uppercase text-xs font-bold tracking-widest">No leads pending review.</p>
          <p className="mt-2 text-sm">All entries have been processed or moved to missions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {leads.map((lead) => {
            const draftEvent = [...lead.history]
              .reverse()
              .find((e) => e.type === 'DRAFT_CREATED');
            const draftMessage = draftEvent?.details?.draft || 'No draft available.';

            return (
              <div key={lead.id} className="card p-8 flex flex-col md:flex-row gap-8 items-start hover:border-black transition-colors duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-white ${lead.platform === 'linkedin' ? 'bg-[#0077b5]' : 'bg-[#ff4500]'}`}>
                      {lead.platform}
                    </span>
                    <span className="text-xs font-bold text-green-600 uppercase tracking-widest">
                      Match: {lead.scores.icp_fit}%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-1">{lead.profileData.name}</h3>
                  <p className="text-sm font-semibold text-brand-text-primary mb-2 italic">{lead.profileData.role}</p>
                  <p className="text-sm text-brand-text-secondary line-clamp-2 mb-6">{lead.profileData.bio}</p>

                  <div className="bg-brand-background p-6 rounded-lg border border-brand-border font-mono text-[13px] leading-relaxed relative group">
                    <div className="absolute top-4 right-4 text-[10px] font-bold uppercase text-brand-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">AI Draft</div>
                    {draftMessage}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-32">
                  <button
                    onClick={() => updateStatus(lead.id, 'queued')}
                    className="btn-primary w-full py-2.5 text-xs uppercase tracking-[0.15em]"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(lead.id, 'archived')}
                    className="btn-secondary w-full py-2.5 text-xs uppercase tracking-[0.15em]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
