import axios from 'axios';
import type { LoginRequest, LoginResponse, ChatMessage, ChatResponse, Category, Tag, Model, Role, Permission } from '@/types';

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

export const modelAPI = {
  getModels: async (): Promise<Model[]> => {
    const response = await api.get<Model[]>('/api/models');
    return response.data;
  },
  getAllModels: async (): Promise<Model[]> => {
    const response = await api.get<Model[]>('/api/admin/models');
    return response.data;
  },
};

export const chatAPI = {
  sendMessage: async (data: ChatMessage): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/api/chat', data);
    return response.data;
  },
};

export const adminAPI = {
  // カテゴリ管理
  addCategory: async (category_name: string, description: string, color: string) => {
    const response = await api.post('/api/admin/categories', null, {
      params: { category_name, description, color },
    });
    return response.data;
  },

  updateCategory: async (category_id: number, category_name: string, description: string, color: string) => {
    const response = await api.put(`/api/admin/categories/${category_id}`, null, {
      params: { category_name, description, color },
    });
    return response.data;
  },

  deleteCategory: async (category_id: number) => {
    const response = await api.delete(`/api/admin/categories/${category_id}`);
    return response.data;
  },

  deleteMultipleCategories: async (category_ids: number[]) => {
    const response = await api.post('/api/admin/categories/delete-multiple', { category_ids });
    return response.data;
  },

  // タグ管理
  addTag: async (tag_name: string, category_id: number) => {
    const response = await api.post('/api/admin/tags', null, {
      params: { tag_name, category_id },
    });
    return response.data;
  },

  updateTag: async (tag_id: number, tag_name: string, category_id: number) => {
    const response = await api.put(`/api/admin/tags/${tag_id}`, null, {
      params: { tag_name, category_id },
    });
    return response.data;
  },

  deleteTag: async (tag_id: number) => {
    const response = await api.delete(`/api/admin/tags/${tag_id}`);
    return response.data;
  },

  deleteMultipleTags: async (tag_ids: number[]) => {
    const response = await api.post('/api/admin/tags/delete-multiple', { tag_ids });
    return response.data;
  },

  // 文書管理
  uploadDocument: async (file_name: string, category_id: number, tag_ids: number[]) => {
    const response = await api.post('/api/admin/documents', null, {
      params: { file_name, category_id, tag_ids },
    });
    return response.data;
  },

  getDocuments: async () => {
    const response = await api.get('/api/admin/documents');
    return response.data;
  },

  updateDocument: async (doc_id: number, title: string, category_id: number, tag_ids: number[]) => {
    const response = await api.put(`/api/admin/documents/${doc_id}`, null, {
      params: { title, category_id, tag_ids },
    });
    return response.data;
  },

  deleteDocument: async (doc_id: number) => {
    const response = await api.delete(`/api/admin/documents/${doc_id}`);
    return response.data;
  },

  deleteMultipleDocuments: async (doc_ids: number[]) => {
    const response = await api.post('/api/admin/documents/delete-multiple', { doc_ids });
    return response.data;
  },

  // モデル管理
  uploadModel: async (model_name: string, file_size_mb: number) => {
    const response = await api.post('/api/admin/models', null, {
      params: { model_name, file_size_mb },
    });
    return response.data;
  },

  updateModel: async (model_id: number, model_name: string, file_size_mb: number, description: string) => {
    const response = await api.put(`/api/admin/models/${model_id}`, null, {
      params: { model_name, file_size_mb, description },
    });
    return response.data;
  },

  deleteModel: async (model_id: number) => {
    const response = await api.delete(`/api/admin/models/${model_id}`);
    return response.data;
  },

  deleteMultipleModels: async (model_ids: number[]) => {
    const response = await api.post('/api/admin/models/delete-multiple', { model_ids });
    return response.data;
  },

  archiveModel: async (model_id: number) => {
    const response = await api.post(`/api/admin/models/${model_id}/archive`);
    return response.data;
  },

  unarchiveModel: async (model_id: number) => {
    const response = await api.post(`/api/admin/models/${model_id}/unarchive`);
    return response.data;
  },

  archiveMultipleModels: async (model_ids: number[]) => {
    const response = await api.post('/api/admin/models/archive-multiple', { model_ids });
    return response.data;
  },

  // ユーザー管理
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  addUser: async (username: string, password: string, role: string) => {
    const response = await api.post('/api/admin/users', null, {
      params: { username, password, role },
    });
    return response.data;
  },

  updateUser: async (user_id: number, username?: string, password?: string, role?: string) => {
    const response = await api.put(`/api/admin/users/${user_id}`, null, {
      params: { username, password, role },
    });
    return response.data;
  },

  deleteUser: async (user_id: number) => {
    const response = await api.delete(`/api/admin/users/${user_id}`);
    return response.data;
  },

  deleteMultipleUsers: async (user_ids: number[]) => {
    const response = await api.post('/api/admin/users/delete-multiple', { user_ids });
    return response.data;
  },

  // 権限管理
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/api/admin/roles');
    return response.data;
  },

  getRole: async (role_id: number): Promise<Role> => {
    const response = await api.get<Role>(`/api/admin/roles/${role_id}`);
    return response.data;
  },

  addRole: async (role_name: string, description: string, permissions: Permission[]) => {
    const response = await api.post('/api/admin/roles', { permissions }, {
      params: { role_name, description },
    });
    return response.data;
  },

  updateRole: async (role_id: number, role_name?: string, description?: string, permissions?: Permission[]) => {
    const response = await api.put(`/api/admin/roles/${role_id}`, { permissions }, {
      params: { role_name, description },
    });
    return response.data;
  },

  deleteRole: async (role_id: number) => {
    const response = await api.delete(`/api/admin/roles/${role_id}`);
    return response.data;
  },

  deleteMultipleRoles: async (role_ids: number[]) => {
    const response = await api.post('/api/admin/roles/delete-multiple', { role_ids });
    return response.data;
  },
};

export default api;
