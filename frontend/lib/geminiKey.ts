import AsyncStorage from '@react-native-async-storage/async-storage';

export const GEMINI_KEY_STORAGE = 'maxx_gemini_key';
const GEMINI_REST_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const GeminiKeyService = {
  /** Retrieve stored key (null if never set) */
  async get(): Promise<string | null> {
    return AsyncStorage.getItem(GEMINI_KEY_STORAGE);
  },

  /** Persist key to AsyncStorage */
  async save(key: string): Promise<void> {
    await AsyncStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  },

  /** Remove stored key */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(GEMINI_KEY_STORAGE);
  },

  /**
   * Validate key by sending a test prompt.
   * Returns { valid: true } or { valid: false, error: string }
   */
  async validate(key: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch(`${GEMINI_REST_URL}?key=${key.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with one word: ready' }] }],
        }),
      });

      if (res.ok) return { valid: true };

      const body = await res.json().catch(() => ({}));
      const msg = (body as any)?.error?.message || '';
      if (res.status === 400 && msg.toLowerCase().includes('api key')) {
        return { valid: false, error: 'Invalid API key — check and try again' };
      }
      if (res.status === 403) {
        return { valid: false, error: 'API key not authorized for Gemini' };
      }
      if (res.status === 429) {
        return { valid: false, error: 'Rate limit hit — key is valid, try again soon' };
      }
      return { valid: false, error: `API error (${res.status})` };
    } catch (_) {
      return { valid: false, error: 'Network error — check your connection' };
    }
  },

  /**
   * Direct Gemini REST call (for frontend use).
   * Returns the model's text response.
   */
  async generate(prompt: string, key: string): Promise<string> {
    const res = await fetch(`${GEMINI_REST_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.9 },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },
};
