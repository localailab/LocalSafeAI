export interface User {
  user_id: number;
  username: string;
  role: string;
  created_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user_id: number;
  username: string;
  token: string;
  role: string;
}

export interface ChatMessage {
  query: string;
  use_rag?: boolean;
  category_ids?: number[];
  tag_ids?: number[];
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string;
  color: string;
}

export interface Tag {
  tag_id: number;
  tag_name: string;
  category_id: number;
}

export interface Model {
  model_id: number;
  model_name: string;
  file_size_mb: number;
  description: string;
  archived?: boolean;
}

export interface SearchResult {
  doc_id: number;
  chunk_index: number;
  score: number;
  text_chunk: string;
  doc_title: string;
}

export interface ChatResponse {
  query: string;
  answer: string;
  search_results: SearchResult[];
  processing_time: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  searchResults?: SearchResult[];
  timestamp: Date;
  processingTime?: number;
}

export interface ChatHistory {
  chat_id: string;
  title: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  resource: 'category' | 'tag' | 'document' | 'model' | 'user' | 'role';
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface Role {
  role_id: number;
  role_name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
}
