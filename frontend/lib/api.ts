import { supabase } from './supabase';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://maxx-app.onrender.com';

export async function apiCall(
  endpoint: string,
  method: string = 'POST',
  body?: object
): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(`${API}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('Request timed out');
    throw error;
  }
}
export async function auditProfile(platform: string, bio: string) {
  return apiCall('/api/profile-audit', 'POST', { platform, bio });
}

export async function moderatePost(content: string) {
  return apiCall('/api/moderate-post', 'POST', { content });
}

export async function getSupplementStack(goals: string[]) {
  return apiCall('/api/supplement-stack', 'POST', { goals });
}

export async function getConversationReply(scenario: string, messages: any[], userMessage: string) {
  return apiCall('/api/conversation', 'POST', { scenario, messages, user_message: userMessage });
}
