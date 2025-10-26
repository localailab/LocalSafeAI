'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { chatAPI, categoryAPI } from '@/lib/api';
import type { Message, Category, Tag } from '@/types';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // カテゴリ・タグ関連
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    if (!token) {
      router.push('/login');
    } else {
      setUsername(storedUsername || 'ゲスト');
      loadCategories();
    }
  }, [router]);

  const loadCategories = async () => {
    try {
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTags = async (categoryId: number) => {
    try {
      const data = await categoryAPI.getTags(categoryId);
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleCategoryChange = (categoryId: number) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
      setTags([]);
      setSelectedTagIds([]);
    } else {
      setSelectedCategoryId(categoryId);
      setSelectedTagIds([]);
      loadTags(categoryId);
    }
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        query: input,
        use_rag: true,
        category_ids: selectedCategoryId ? [selectedCategoryId] : [],
        tag_ids: selectedTagIds,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        searchResults: response.search_results,
        timestamp: new Date(),
        processingTime: response.processing_time,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const suggestedQuestions = [
    '授業計画の立て方を教えてください',
    '生徒指導で大切なことは何ですか？',
    '評価方法について知りたいです',
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LocalSafeAI</h1>
                <p className="text-xs text-gray-500">ローカル文書RAG</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{username}</p>
                <p className="text-xs text-gray-500">ログイン中</p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-md hover:shadow-lg"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col px-4 py-6">
          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto space-y-6 mb-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-fade-in">
                <div className="mb-8">
                  <div className="h-20 w-20 mx-auto bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl flex items-center justify-center mb-4">
                    <svg
                      className="h-10 w-10 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    何でもお聞きください
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    登録された文書の内容に基づいて、AI が検索・要約・質問応答を行います
                  </p>
                </div>

                <div className="w-full max-w-2xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">質問例</p>
                  <div className="grid gap-3">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(question)}
                        className="text-left px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm hover:shadow-md group"
                      >
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-gray-400 group-hover:text-primary-500 mr-3 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-gray-700 group-hover:text-gray-900">
                            {question}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    } animate-slide-up`}
                  >
                    <div
                      className={`max-w-3xl ${
                        message.role === 'user' ? 'order-2' : 'order-1'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </div>
                        )}

                        <div className="flex-1">
                          <div
                            className={`rounded-2xl px-5 py-4 shadow-md ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-100'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <div className="markdown prose max-w-none">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* 検索結果の表示 */}
                          {message.searchResults && message.searchResults.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-medium text-gray-600 px-2">
                                参照した文書
                              </p>
                              {message.searchResults.map((result, idx) => (
                                <div
                                  key={idx}
                                  className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:bg-blue-100 transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-blue-900">
                                      {result.doc_title}
                                    </h4>
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                      {Math.round(result.score * 100)}%
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {result.text_chunk}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {message.processingTime && (
                            <p className="text-xs text-gray-500 mt-2 px-2">
                              処理時間: {message.processingTime}秒
                            </p>
                          )}
                        </div>

                        {message.role === 'user' && (
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="bg-white rounded-2xl px-5 py-4 shadow-md border border-gray-100">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* カテゴリ・タグフィルター */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-medium text-gray-900">検索対象を絞り込む</span>
                {(selectedCategoryId || selectedTagIds.length > 0) && (
                  <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                    {selectedTagIds.length > 0 ? `${selectedTagIds.length}件` : '1カテゴリ'}
                  </span>
                )}
              </div>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showFilters && (
              <div className="mt-4 space-y-4 animate-slide-up">
                {/* カテゴリ選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.category_id}
                        onClick={() => handleCategoryChange(category.category_id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCategoryId === category.category_id
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.category_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* タグ選択 */}
                {selectedCategoryId && tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タグ（複数選択可）
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.tag_id}
                          onClick={() => handleTagToggle(tag.tag_id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedTagIds.includes(tag.tag_id)
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          {tag.tag_name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* クリアボタン */}
                {(selectedCategoryId || selectedTagIds.length > 0) && (
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setSelectedTagIds([]);
                      setTags([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    絞り込みをクリア
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 入力フォーム */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="質問を入力してください..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
