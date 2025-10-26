export interface User {
  user_id: number;
  username: string;
  role: string;
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
}

export interface Tag {
  tag_id: number;
  tag_name: string;
  category_id: number;
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
