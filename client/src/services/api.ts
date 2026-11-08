const DEFAULT_BACKEND_URL = 'https://ecotrack-portal-1.onrender.com';

export function getApiBase(): string {
  const envBase = (import.meta as any).env?.VITE_API_URL || '';
  if (envBase) {
    return envBase.endsWith('/api') ? envBase : `${envBase.replace(/\/$/, '')}/api`;
  }
  // When running on Vercel or any live host, route automatically to our live Render backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `${DEFAULT_BACKEND_URL}/api`;
  }
  return '/api';
}

export function getAssetUrl(assetPath: string): string {
  if (!assetPath) return '';
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('data:')) {
    return assetPath;
  }
  const envBase = (import.meta as any).env?.VITE_API_URL || '';
  const base =
    envBase ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? DEFAULT_BACKEND_URL
      : '');
  return `${base.replace(/\/api\/?$/, '').replace(/\/$/, '')}${assetPath.startsWith('/') ? '' : '/'}${assetPath}`;
}

export class ApiError extends Error {
  status: number;
  errors?: any[];

  constructor(message: string, status: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ecotrack_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const apiBase = getApiBase();
  let res: Response;

  try {
    res = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      throw new ApiError(
        'Unable to reach backend server. If Render is waking up from sleep, please wait 30 seconds and try again.',
        0
      );
    }
    throw err;
  }

  if (res.status === 204) {
    return {} as T;
  }

  // Handle CSV or file downloads
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const text = await res.text();
    return text as unknown as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.message || 'Request failed', res.status, data.errors);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: any) => request<{ success: boolean; user: any; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (data: any) => request<{ success: boolean; user: any; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),

  // Complaints
  getComplaints: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString();
    return request<any>(`/complaints${qs ? `?${qs}` : ''}`);
  },

  getComplaint: (id: string | number) => request<any>(`/complaints/${id}`),

  createComplaint: (formData: FormData) => request<any>('/complaints', {
    method: 'POST',
    body: formData,
  }),

  editComplaint: (id: number, data: any) => request<any>(`/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  updateStatus: (id: number, status: string, note?: string) => request<any>(`/complaints/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, note }),
  }),

  assignWorker: (id: number, workerId: number, notes?: string) => request<any>(`/complaints/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ workerId, notes }),
  }),

  resolveComplaint: (id: number, formData: FormData) => request<any>(`/complaints/${id}/resolve`, {
    method: 'POST',
    body: formData,
  }),

  reopenComplaint: (id: number, note?: string) => request<any>(`/complaints/${id}/reopen`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  }),

  deleteComplaint: (id: number, reason?: string) => request<any>(`/complaints/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  }),

  checkDuplicates: (data: any) => request<{ success: boolean; matches: any[] }>('/complaints/check-duplicates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return request<{ success: boolean; url: string; filename: string }>('/complaints/upload-image', {
      method: 'POST',
      body: formData,
    });
  },

  // Admin
  getAdminOverview: () => request<any>('/admin/overview'),

  getAdminAnalytics: (days: number = 30) => request<any>(`/admin/analytics?days=${days}`),

  getAdminWorkers: () => request<{ success: boolean; workers: any[] }>('/admin/workers'),

  createWorker: (data: any) => request<any>('/admin/workers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateWorkerStatus: (id: number, active: boolean) => request<any>(`/admin/workers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }),

  getDuplicates: (status: string = 'suspected') => request<{ success: boolean; duplicates: any[] }>(`/admin/duplicates?status=${status}`),

  confirmDuplicate: (duplicateId: number, primaryId: number) => request<any>('/admin/duplicates/confirm', {
    method: 'POST',
    body: JSON.stringify({ duplicateId, primaryId }),
  }),

  rejectDuplicate: (duplicateId: number, primaryId: number) => request<any>('/admin/duplicates/reject', {
    method: 'POST',
    body: JSON.stringify({ duplicateId, primaryId }),
  }),

  getActivityLogs: (page: number = 1, limit: number = 20) => request<any>(`/admin/activity-logs?page=${page}&limit=${limit}`),

  // Worker
  getWorkerTasks: () => request<{ success: boolean; tasks: any[] }>('/worker/tasks'),

  getWorkerHistory: () => request<{ success: boolean; history: any[] }>('/worker/history'),

  markTaskInProgress: (id: number, note?: string) => request<any>(`/worker/tasks/${id}/in-progress`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  }),

  resolveTask: (id: number, formData: FormData) => request<any>(`/worker/tasks/${id}/resolve`, {
    method: 'POST',
    body: formData,
  }),

  // Notifications
  getNotifications: (unreadOnly: boolean = false) => request<{ success: boolean; notifications: any[]; unreadCount: number }>(`/notifications?unread=${unreadOnly}`),

  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),

  // Map
  getMapPoints: (filters: Record<string, string> = {}) => {
    const qs = new URLSearchParams(filters).toString();
    return request<{ success: boolean; count: number; points: any[] }>(`/map/points${qs ? `?${qs}` : ''}`);
  },

  // Health & Integrations
  getMongoHealth: () => request<any>('/health/mongo'),
  getIntegrationsStatus: () => request<any>('/integrations/status'),
};
