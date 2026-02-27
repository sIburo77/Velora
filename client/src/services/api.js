const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('velora_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('velora_token', token);
    } else {
      localStorage.removeItem('velora_token');
    }
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  get(path) {
    return this.request(path);
  }

  post(path, data) {
    return this.request(path, { method: 'POST', body: JSON.stringify(data) });
  }

  patch(path, data) {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(data) });
  }

  put(path, data) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }

  // Auth
  register(data) { return this.post('/auth/register', data); }
  login(data) { return this.post('/auth/login', data); }

  // User
  getProfile() { return this.get('/users/me'); }
  updateProfile(data) { return this.patch('/users/me', data); }
  deleteAccount() { return this.delete('/users/me'); }

  // Workspaces
  getWorkspaces() { return this.get('/workspaces'); }
  createWorkspace(data) { return this.post('/workspaces', data); }
  updateWorkspace(id, data) { return this.patch(`/workspaces/${id}`, data); }
  deleteWorkspace(id) { return this.delete(`/workspaces/${id}`); }
  getMembers(wsId) { return this.get(`/workspaces/${wsId}/members`); }
  removeMember(wsId, userId) { return this.delete(`/workspaces/${wsId}/members/${userId}`); }

  // Invitations
  createInvitation(wsId, data) { return this.post(`/invitations/workspace/${wsId}`, data); }
  acceptInvitation(data) { return this.post('/invitations/accept', data); }
  declineInvitation(data) { return this.post('/invitations/decline', data); }
  getInvitations(wsId) { return this.get(`/invitations/workspace/${wsId}`); }
  getMyInvitations() { return this.get('/invitations/my'); }

  // Board
  getBoard(wsId) { return this.get(`/workspaces/${wsId}/board`); }

  // Columns
  createColumn(wsId, data) { return this.post(`/workspaces/${wsId}/board/columns`, data); }
  updateColumn(wsId, colId, data) { return this.patch(`/workspaces/${wsId}/board/columns/${colId}`, data); }
  deleteColumn(wsId, colId) { return this.delete(`/workspaces/${wsId}/board/columns/${colId}`); }
  reorderColumns(wsId, ids) { return this.put(`/workspaces/${wsId}/board/columns/reorder`, ids); }

  // Tasks
  createTask(wsId, colId, data) { return this.post(`/workspaces/${wsId}/board/columns/${colId}/tasks`, data); }
  updateTask(wsId, taskId, data) { return this.patch(`/workspaces/${wsId}/board/tasks/${taskId}`, data); }
  deleteTask(wsId, taskId) { return this.delete(`/workspaces/${wsId}/board/tasks/${taskId}`); }
  moveTask(wsId, taskId, data) { return this.put(`/workspaces/${wsId}/board/tasks/${taskId}/move`, data); }
  searchTasks(wsId, params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, v); });
    return this.get(`/workspaces/${wsId}/board/tasks/search?${qs}`);
  }

  // Analytics
  getAnalytics(wsId) { return this.get(`/workspaces/${wsId}/board/analytics`); }
}

export const api = new ApiService();
export default api;
