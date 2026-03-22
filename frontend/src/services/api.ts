const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async get(path: string) {
    const res = await fetch(`${BACKEND_URL}${path}`, { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err?.error || err?.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async post(path: string, body: any) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: 'Parse error' }));
    if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
    return data;
  }

  async put(path: string, body: any) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: 'Parse error' }));
    if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
    return data;
  }

  async delete(path: string) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err?.error || err?.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }
}

export const api = new ApiService();
