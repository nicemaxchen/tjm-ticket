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
    return Promise.reject(new Error(message));
  }
);

export default api;

// API方法
export const ticketApi = {
  // 取得活動列表
  getEvents: () => api.get('/tickets/events'),
  
  // 取得活動詳情
  getEvent: (id) => api.get(`/tickets/events/${id}`),
  
  // 取得票券類別
  getCategories: () => api.get('/tickets/categories')
};

export const registrationApi = {
  // 查詢報名資料
  queryRegistration: (phone) => api.post('/registrations/query', { phone }),
  
  // 登記報名資料
  register: (data) => api.post('/registrations/register', data),
  
  // 取得票券詳情
  getTicket: (tokenId) => api.get(`/registrations/ticket/${tokenId}`),
  
  // 報到
  checkin: (data) => api.post('/registrations/checkin', data)
};

export const authApi = {
  // 發送簡訊驗證碼
  sendSMS: (phone) => api.post('/auth/sms/send', { phone }),
  
  // 驗證簡訊驗證碼
  verifySMS: (phone, code) => api.post('/auth/sms/verify', { phone, code })
};