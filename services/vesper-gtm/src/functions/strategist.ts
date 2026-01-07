import { Lead } from '../types';

/**
 * Core logic for the 'Strategist' worker.
 * 
 * This function processes a list of leads, generates drafts, and applies routing logic.
 * It is intended to be adapted for use within an n8n Code Node.
 */
export function processLeads(leads: Lead[]): Lead[] {
  return leads.map((lead) => {
    // Clone the lead to avoid mutating the original object directly if referenced elsewhere
    const updatedLead = { ...lead };

    // 1. Generate Mock AI Draft
    // In a real scenario, this would call an LLM.
    const firstName = updatedLead.profileData.name.split(' ')[0] || 'there';
    const draftMessage = `Hey ${firstName}, saw your post about ${updatedLead.profileData.role}... would love to chat.`;

    // Store draft in history or a new field?
    // The prompt just says "generate a mock AI draft message". 
    // It doesn't explicitly say where to put it in the Lead object.
    // The Lead interface defined previously doesn't have a 'draft' field.
    // I will add a 'DRAFT_CREATED' event to the history with the message content.
    
    updatedLead.history = [
      ...updatedLead.history,
      {
        type: 'DRAFT_CREATED',
        timestamp: new Date().toISOString(),
        details: {
          draft: draftMessage,
          source: 'Strategist (Mock AI)',
        },
      },
    ];

    // 2. Apply Routing Logic
    const { intent, icp_fit } = updatedLead.scores;

    if (intent === 3 && icp_fit === 3) {
      // Auto-queue high potential leads
      updatedLead.status = 'queued';
    } else {
      // Flag for human review otherwise
      updatedLead.status = 'review';
    }

    return updatedLead;
  });
}
