import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || '請求失敗';
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export default api;

// API方法
export const adminApi = {
  // 登入
  login: (username, password) => api.post('/auth/admin/login', { username, password }),
  
  // 活動管理
  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
  
  // 票券類別
  getCategories: (eventId) => api.get('/admin/categories', { params: eventId ? { event_id: eventId } : {} }),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // 待審核名單
  getPendingList: () => api.get('/admin/pending-list'),
  approvePending: (id, data) => api.post(`/admin/pending-list/${id}/approve`, data),
  rejectPending: (id, data) => api.post(`/admin/pending-list/${id}/reject`, data),
  
  // 統計
  getStatistics: (eventId) => api.get('/admin/statistics', { params: { event_id: eventId } }),
  getStatisticsByEvents: () => api.get('/admin/statistics/by-events')
};