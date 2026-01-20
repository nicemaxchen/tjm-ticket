import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export default api;

// API方法
export const ticketApi = {
  // 获取活动列表
  getEvents: () => api.get('/tickets/events'),
  
  // 获取活动详情
  getEvent: (id) => api.get(`/tickets/events/${id}`),
  
  // 获取票券类别
  getCategories: () => api.get('/tickets/categories')
};

export const registrationApi = {
  // 查询报名资料
  queryRegistration: (phone) => api.post('/registrations/query', { phone }),
  
  // 登记报名资料
  register: (data) => api.post('/registrations/register', data),
  
  // 获取票券详情
  getTicket: (tokenId) => api.get(`/registrations/ticket/${tokenId}`),
  
  // 报到
  checkin: (data) => api.post('/registrations/checkin', data)
};

export const authApi = {
  // 发送短信验证码
  sendSMS: (phone) => api.post('/auth/sms/send', { phone }),
  
  // 验证短信验证码
  verifySMS: (phone, code) => api.post('/auth/sms/verify', { phone, code })
};