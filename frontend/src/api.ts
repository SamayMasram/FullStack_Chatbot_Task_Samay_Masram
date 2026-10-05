export interface Enquiry { id: number; name: string; email: string; phone: string | null; interest: string; message: string; source: string; status: string; user_type: string; updated_at?: string; created_at: string; }
export const INTERESTS = ['drone_training', 'drone_services', 'content_media', 'other'];

async function req<T>(url: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.details?.map((d: any) => d.msg).join(', ') || data.error || 'Request failed');
  return data;
}
export const createEnquiry = (b: object) => req('/api/enquiries', { method: 'POST', body: JSON.stringify(b) }, sessionStorage.getItem('user_token') || undefined);
export const login = (email: string, password: string) => req<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const listEnquiries = (qs: string, t: string) => req<{ data: Enquiry[]; total: number }>(`/api/enquiries?${qs}`, {}, t);
export const updateEnquiry = (id: number, b: object, t: string) => req(`/api/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(b) }, t);
export const deleteEnquiry = (id: number, t: string) => req(`/api/enquiries/${id}`, { method: 'DELETE' }, t);

export const STATUSES = ['new', 'contacted', 'in_progress', 'closed'];
export const USER_TYPES = ['student', 'customer', 'other'];
export const label = (s: string) => s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase());
export const userAuth = (mode: 'login' | 'register', b: object) => req<{ token: string; name: string }>(`/api/users/${mode}`, { method: 'POST', body: JSON.stringify(b) });
export const myEnquiries = (t: string) => req<Enquiry[]>('/api/my/enquiries', {}, t);
