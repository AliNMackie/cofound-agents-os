export type LeadPlatform = 'linkedin' | 'reddit';
export type LeadStatus = 'new' | 'review' | 'queued' | 'active' | 'archived' | 'paused_for_human_input';

export interface LeadProfile {
  name: string;
  bio: string;
  role: string;
}

export interface LeadScores {
  icp_fit: number;
  intent: number;
}

export interface LeadEvent {
  type: string;
  timestamp: string; // ISO string
  details?: Record<string, any>;
}

export interface Lead {
  id: string;
  platform: LeadPlatform;
  profileData: LeadProfile;
  status: LeadStatus;
  scores: LeadScores;
  history: LeadEvent[];
}
