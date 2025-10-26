import axios from 'axios';
import type { LoginRequest, LoginResponse, ChatMessage, ChatResponse, Category, Tag } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター：トークンを自動付与
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },
};

export const categoryAPI = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/api/categories');
    return response.data;
  },
  getTags: async (categoryId?: number): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/api/tags', {
      params: categoryId ? { category_id: categoryId } : {},
    });
    return response.data;
  },
};

export const chatAPI = {
  sendMessage: async (data: ChatMessage): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/api/chat', data);
    return response.data;
  },
};

export default api;
