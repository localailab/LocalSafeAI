'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, categoryAPI, modelAPI } from '@/lib/api';
import type { Category, Tag, Model, User, Role, Permission } from '@/types';

type TabType = 'categories' | 'tags' | 'documents' | 'models' | 'users' | 'roles';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [role, setRole] = useState('');

  // カテゴリ関連
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('#3b82f6');

  // タグ関連
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedCategoryForTag, setSelectedCategoryForTag] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagCategory, setEditTagCategory] = useState<number | null>(null);

  // 文書関連
  const [documents, setDocuments] = useState<any[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [selectedCategoryForDoc, setSelectedCategoryForDoc] = useState<number | null>(null);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocCategory, setEditDocCategory] = useState<number | null>(null);
  const [editDocTagIds, setEditDocTagIds] = useState<number[]>([]);

  // モデル関連
  const [models, setModels] = useState<Model[]>([]);
  const [newModelName, setNewModelName] = useState('');
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);

  // ユーザー関連
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('user');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<string>('user');

  // 権限関連
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [editRolePermissions, setEditRolePermissions] = useState<Permission[]>([]);

  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
    } else if (userRole !== 'admin') {
      router.push('/chat');
    } else {
      setRole(userRole);
      loadCategories();
      loadTags();
      loadDocuments();
      loadModels();
      loadUsers();
      loadRoles();
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

  const loadTags = async () => {
    try {
      const data = await categoryAPI.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const data = await adminAPI.getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadModels = async () => {
    try {
      const data = await modelAPI.getAllModels();
      setModels(data);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await adminAPI.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.addCategory(newCategoryName, newCategoryDesc, newCategoryColor);
      setMessage('カテゴリを追加しました');
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryColor('#3b82f6');
      loadCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleCheckboxChange = (categoryId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedCategoryIds.length === 0) return;
    if (!confirm(`選択した${selectedCategoryIds.length}件のカテゴリを削除しますか？`)) return;

    try {
      await adminAPI.deleteMultipleCategories(selectedCategoryIds);
      setMessage(`${selectedCategoryIds.length}件のカテゴリを削除しました`);
      setSelectedCategoryIds([]);
      loadCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategoryId(category.category_id);
    setEditCategoryName(category.category_name);
    setEditCategoryDesc(category.description);
    setEditCategoryColor(category.color);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditCategoryName('');
    setEditCategoryDesc('');
    setEditCategoryColor('#3b82f6');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;

    try {
      await adminAPI.updateCategory(editingCategoryId, editCategoryName, editCategoryDesc, editCategoryColor);
      setMessage('カテゴリを更新しました');
      handleCancelEdit();
      setSelectedCategoryIds([]);
      loadCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForTag) return;

    try {
      await adminAPI.addTag(newTagName, selectedCategoryForTag);
      setMessage('タグを追加しました');
      setNewTagName('');
      setSelectedCategoryForTag(null);
      loadTags();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleTagCheckboxChange = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleDeleteSelectedTags = async () => {
    if (selectedTagIds.length === 0) return;
    if (!confirm(`選択した${selectedTagIds.length}件のタグを削除しますか？`)) return;

    try {
      await adminAPI.deleteMultipleTags(selectedTagIds);
      setMessage(`${selectedTagIds.length}件のタグを削除しました`);
      setSelectedTagIds([]);
      loadTags();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleStartEditTag = (tag: Tag) => {
    setEditingTagId(tag.tag_id);
    setEditTagName(tag.tag_name);
    setEditTagCategory(tag.category_id);
  };

  const handleCancelEditTag = () => {
    setEditingTagId(null);
    setEditTagName('');
    setEditTagCategory(null);
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTagId || !editTagCategory) return;

    try {
      await adminAPI.updateTag(editingTagId, editTagName, editTagCategory);
      setMessage('タグを更新しました');
      handleCancelEditTag();
      setSelectedTagIds([]);
      loadTags();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedDocFile(file);
      setNewDocName(file.name);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForDoc || !selectedDocFile) return;

    try {
      await adminAPI.uploadDocument(selectedDocFile.name, selectedCategoryForDoc, []);
      setMessage(`文書「${selectedDocFile.name}」を追加しました（モック）`);
      setNewDocName('');
      setSelectedCategoryForDoc(null);
      setSelectedDocFile(null);
      loadDocuments();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleDocCheckboxChange = (docId: number) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleDeleteSelectedDocs = async () => {
    if (selectedDocIds.length === 0) return;
    if (!confirm(`選択した${selectedDocIds.length}件の文書を削除しますか？`)) return;

    try {
      await adminAPI.deleteMultipleDocuments(selectedDocIds);
      setMessage(`${selectedDocIds.length}件の文書を削除しました`);
      setSelectedDocIds([]);
      loadDocuments();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleStartEditDoc = (doc: any) => {
    setEditingDocId(doc.doc_id);
    setEditDocTitle(doc.title);
    setEditDocCategory(doc.category_id);
    setEditDocTagIds(doc.tag_ids || []);
  };

  const handleCancelEditDoc = () => {
    setEditingDocId(null);
    setEditDocTitle('');
    setEditDocCategory(null);
    setEditDocTagIds([]);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocId || !editDocCategory) return;

    try {
      await adminAPI.updateDocument(editingDocId, editDocTitle, editDocCategory, editDocTagIds);
      setMessage('文書を更新しました');
      handleCancelEditDoc();
      setSelectedDocIds([]);
      loadDocuments();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleTagToggle = (tagId: number) => {
    setEditDocTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // モデル管理ハンドラー
  const handleModelCheckboxChange = (modelId: number) => {
    setSelectedModelIds(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleDeleteSelectedModels = async () => {
    if (selectedModelIds.length === 0) return;
    if (!confirm(`選択した${selectedModelIds.length}件のモデルを削除しますか？`)) return;

    try {
      await adminAPI.deleteMultipleModels(selectedModelIds);
      setMessage(`${selectedModelIds.length}件のモデルを削除しました`);
      setSelectedModelIds([]);
      loadModels();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleArchiveSelectedModels = async () => {
    if (selectedModelIds.length === 0) return;
    const hasArchivedModels = models.some(m => selectedModelIds.includes(m.model_id) && m.archived);

    if (hasArchivedModels) {
      // アーカイブ解除
      if (!confirm(`選択した${selectedModelIds.length}件のモデルをアーカイブ解除しますか？`)) return;
      try {
        for (const id of selectedModelIds) {
          await adminAPI.unarchiveModel(id);
        }
        setMessage(`${selectedModelIds.length}件のモデルをアーカイブ解除しました`);
        setSelectedModelIds([]);
        loadModels();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('エラーが発生しました');
      }
    } else {
      // アーカイブ
      if (!confirm(`選択した${selectedModelIds.length}件のモデルをアーカイブしますか？アーカイブされたモデルはチャットで利用できなくなります。`)) return;
      try {
        await adminAPI.archiveMultipleModels(selectedModelIds);
        setMessage(`${selectedModelIds.length}件のモデルをアーカイブしました`);
        setSelectedModelIds([]);
        loadModels();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('エラーが発生しました');
      }
    }
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedModelFile(file);
      setNewModelName(file.name);
    }
  };

  const handleUploadModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelFile) return;

    const fileSizeMB = Math.round(selectedModelFile.size / (1024 * 1024));

    try {
      await adminAPI.uploadModel(selectedModelFile.name, fileSizeMB);
      setMessage(`モデル「${selectedModelFile.name}」を追加しました（モック）`);
      setNewModelName('');
      setSelectedModelFile(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  // ユーザー管理ハンドラー
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.addUser(newUsername, newPassword, newUserRole);
      setMessage(`ユーザー「${newUsername}」を追加しました`);
      setNewUsername('');
      setNewPassword('');
      setNewUserRole('user');
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleUserCheckboxChange = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`選択した${selectedUserIds.length}件のユーザーを削除しますか？`)) return;

    try {
      await adminAPI.deleteMultipleUsers(selectedUserIds);
      setMessage(`${selectedUserIds.length}件のユーザーを削除しました`);
      setSelectedUserIds([]);
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'エラーが発生しました');
    }
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.user_id);
    setEditUsername(user.username);
    setEditPassword('');
    setEditUserRole(user.role as 'user' | 'admin');
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
    setEditUsername('');
    setEditPassword('');
    setEditUserRole('user');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      await adminAPI.updateUser(
        editingUserId,
        editUsername,
        editPassword || undefined,
        editUserRole
      );
      setMessage('ユーザー情報を更新しました');
      handleCancelEditUser();
      setSelectedUserIds([]);
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'エラーが発生しました');
    }
  };

  // 権限管理ハンドラー
  const handleTogglePermission = (resource: Permission['resource'], action: Permission['actions'][0]) => {
    setNewRolePermissions(prev => {
      const existing = prev.find(p => p.resource === resource);
      if (existing) {
        if (existing.actions.includes(action)) {
          // アクションを削除
          const newActions = existing.actions.filter(a => a !== action);
          if (newActions.length === 0) {
            // アクションがなくなったらリソース自体を削除
            return prev.filter(p => p.resource !== resource);
          }
          return prev.map(p => p.resource === resource ? { ...p, actions: newActions } : p);
        } else {
          // アクションを追加
          return prev.map(p => p.resource === resource ? { ...p, actions: [...p.actions, action] } : p);
        }
      } else {
        // 新しいリソースを追加
        return [...prev, { resource, actions: [action] }];
      }
    });
  };

  const handleToggleEditPermission = (resource: Permission['resource'], action: Permission['actions'][0]) => {
    setEditRolePermissions(prev => {
      const existing = prev.find(p => p.resource === resource);
      if (existing) {
        if (existing.actions.includes(action)) {
          const newActions = existing.actions.filter(a => a !== action);
          if (newActions.length === 0) {
            return prev.filter(p => p.resource !== resource);
          }
          return prev.map(p => p.resource === resource ? { ...p, actions: newActions } : p);
        } else {
          return prev.map(p => p.resource === resource ? { ...p, actions: [...p.actions, action] } : p);
        }
      } else {
        return [...prev, { resource, actions: [action] }];
      }
    });
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.addRole(newRoleName, newRoleDesc, newRolePermissions);
      setMessage(`権限「${newRoleName}」を追加しました`);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePermissions([]);
      loadRoles();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('エラーが発生しました');
    }
  };

  const handleRoleCheckboxChange = (roleId: number) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleDeleteSelectedRoles = async () => {
    if (selectedRoleIds.length === 0) return;

    // システムロールが含まれているかチェック
    const systemRoles = roles.filter(r => selectedRoleIds.includes(r.role_id) && r.is_system);
    if (systemRoles.length > 0) {
      setMessage('システム権限は削除できません');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!confirm(`選択した${selectedRoleIds.length}件の権限を削除しますか？`)) return;

    try {
      await adminAPI.deleteMultipleRoles(selectedRoleIds);
      setMessage(`${selectedRoleIds.length}件の権限を削除しました`);
      setSelectedRoleIds([]);
      loadRoles();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'エラーが発生しました');
    }
  };

  const handleStartEditRole = (role: Role) => {
    if (role.is_system) {
      setMessage('システム権限は編集できません');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setEditingRoleId(role.role_id);
    setEditRoleName(role.role_name);
    setEditRoleDesc(role.description);
    setEditRolePermissions(role.permissions);
  };

  const handleCancelEditRole = () => {
    setEditingRoleId(null);
    setEditRoleName('');
    setEditRoleDesc('');
    setEditRolePermissions([]);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleId) return;

    try {
      await adminAPI.updateRole(editingRoleId, editRoleName, editRoleDesc, editRolePermissions);
      setMessage('権限を更新しました');
      handleCancelEditRole();
      setSelectedRoleIds([]);
      loadRoles();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'エラーが発生しました');
    }
  };

  const tabs = [
    { id: 'categories' as TabType, name: 'カテゴリ管理' },
    { id: 'tags' as TabType, name: 'タグ管理' },
    { id: 'documents' as TabType, name: '文書管理' },
    { id: 'models' as TabType, name: 'モデル管理' },
    { id: 'users' as TabType, name: 'ユーザー管理' },
    { id: 'roles' as TabType, name: '権限管理' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">管理画面</h1>
                <p className="text-xs text-gray-500">LocalSafeAI</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/chat')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            >
              チャット画面へ戻る
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メッセージ */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-fade-in">
            {message}
          </div>
        )}

        {/* タブ */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* カテゴリ管理 */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">カテゴリ管理</h2>

                {/* 追加フォーム */}
                <form onSubmit={handleAddCategory} className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリ名
                    </label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例: 技術文書"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      説明
                    </label>
                    <input
                      type="text"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="カテゴリの説明を入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カラー
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                        placeholder="#3b82f6"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-gray-300 shadow-sm"
                        style={{ backgroundColor: newCategoryColor }}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    カテゴリを追加
                  </button>
                </form>

                {/* 一覧 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">登録済みカテゴリ</h3>
                    {selectedCategoryIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedCategoryIds.length}件選択中
                        </span>
                        {selectedCategoryIds.length === 1 && (
                          <button
                            onClick={() => {
                              const category = categories.find(c => c.category_id === selectedCategoryIds[0]);
                              if (category) handleStartEdit(category);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            編集
                          </button>
                        )}
                        <button
                          onClick={handleDeleteSelected}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCategoryId && (
                    <form onSubmit={handleUpdateCategory} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">カテゴリ編集</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            カテゴリ名
                          </label>
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            説明
                          </label>
                          <input
                            type="text"
                            value={editCategoryDesc}
                            onChange={(e) => setEditCategoryDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            カラー
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={editCategoryColor}
                              onChange={(e) => setEditCategoryColor(e.target.value)}
                              className="h-10 w-20 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editCategoryColor}
                              onChange={(e) => setEditCategoryColor(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            更新
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="grid gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat.category_id}
                        className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                        style={{ borderColor: cat.color }}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(cat.category_id)}
                            onChange={() => handleCheckboxChange(cat.category_id)}
                            className="mt-1.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1 flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className="h-8 w-8 rounded-lg shadow-sm flex-shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">{cat.category_name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                              </div>
                            </div>
                            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                              ID: {cat.category_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* タグ管理 */}
            {activeTab === 'tags' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">タグ管理</h2>

                {/* 追加フォーム */}
                <form onSubmit={handleAddTag} className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリを選択
                    </label>
                    <select
                      required
                      value={selectedCategoryForTag || ''}
                      onChange={(e) => setSelectedCategoryForTag(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">カテゴリを選択してください</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      タグ名
                    </label>
                    <input
                      type="text"
                      required
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例: Python"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    タグを追加
                  </button>
                </form>

                {/* 一覧 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">登録済みタグ</h3>
                    {selectedTagIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedTagIds.length}件選択中
                        </span>
                        {selectedTagIds.length === 1 && (
                          <button
                            onClick={() => {
                              const tag = tags.find(t => t.tag_id === selectedTagIds[0]);
                              if (tag) handleStartEditTag(tag);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            編集
                          </button>
                        )}
                        <button
                          onClick={handleDeleteSelectedTags}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  {editingTagId && (
                    <form onSubmit={handleUpdateTag} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">タグ編集</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            タグ名
                          </label>
                          <input
                            type="text"
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            カテゴリ
                          </label>
                          <select
                            value={editTagCategory || ''}
                            onChange={(e) => setEditTagCategory(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">カテゴリを選択</option>
                            {categories.map((cat) => (
                              <option key={cat.category_id} value={cat.category_id}>
                                {cat.category_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            更新
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditTag}
                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="grid gap-4">
                    {tags.map((tag) => {
                      const category = categories.find((c) => c.category_id === tag.category_id);
                      return (
                        <div
                          key={tag.tag_id}
                          className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                          style={{ borderColor: category?.color || '#e5e7eb' }}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedTagIds.includes(tag.tag_id)}
                              onChange={() => handleTagCheckboxChange(tag.tag_id)}
                              className="mt-1.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="h-8 w-8 rounded-lg shadow-sm flex-shrink-0"
                                  style={{ backgroundColor: category?.color || '#e5e7eb' }}
                                />
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900">{tag.tag_name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{category?.category_name}</p>
                                </div>
                              </div>
                              <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                ID: {tag.tag_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 文書管理 */}
            {activeTab === 'documents' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">文書管理</h2>

                {/* アップロードフォーム（モック） */}
                <form onSubmit={handleUploadDocument} className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ファイルを選択
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors">
                          {selectedDocFile ? (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">{selectedDocFile.name}</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(selectedDocFile.size / 1024)} KB)
                              </span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg
                                className="mx-auto h-8 w-8 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              <p className="mt-1 text-sm text-gray-600">
                                クリックしてファイルを選択
                              </p>
                              <p className="text-xs text-gray-500">
                                PDF, DOCX, TXT, CSV など
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt,.csv"
                          onChange={handleDocFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリを選択
                    </label>
                    <select
                      required
                      value={selectedCategoryForDoc || ''}
                      onChange={(e) => setSelectedCategoryForDoc(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">カテゴリを選択してください</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <strong>MVP版:</strong> ファイル選択は可能ですが、実際のアップロード処理は未実装です。ファイル名のみ登録されます。
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedDocFile}
                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    文書を追加（モック）
                  </button>
                </form>

                {/* 一覧 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">登録済み文書</h3>
                    {selectedDocIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedDocIds.length}件選択中
                        </span>
                        {selectedDocIds.length === 1 && (
                          <button
                            onClick={() => {
                              const doc = documents.find(d => d.doc_id === selectedDocIds[0]);
                              if (doc) handleStartEditDoc(doc);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            編集
                          </button>
                        )}
                        <button
                          onClick={handleDeleteSelectedDocs}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  {editingDocId && (
                    <form onSubmit={handleUpdateDocument} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">文書編集</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            文書タイトル
                          </label>
                          <input
                            type="text"
                            value={editDocTitle}
                            onChange={(e) => setEditDocTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            カテゴリ
                          </label>
                          <select
                            value={editDocCategory || ''}
                            onChange={(e) => setEditDocCategory(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">カテゴリを選択</option>
                            {categories.map((cat) => (
                              <option key={cat.category_id} value={cat.category_id}>
                                {cat.category_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            タグ（複数選択可）
                          </label>
                          <div className="border border-gray-300 rounded-lg p-3 bg-white max-h-40 overflow-y-auto">
                            {tags
                              .filter(tag => tag.category_id === editDocCategory)
                              .map((tag) => (
                                <label key={tag.tag_id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={editDocTagIds.includes(tag.tag_id)}
                                    onChange={() => handleTagToggle(tag.tag_id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm">{tag.tag_name}</span>
                                </label>
                              ))}
                            {editDocCategory && tags.filter(tag => tag.category_id === editDocCategory).length === 0 && (
                              <p className="text-sm text-gray-500 text-center py-2">このカテゴリにはタグがありません</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            更新
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditDoc}
                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="grid gap-4">
                    {documents.map((doc) => {
                      const category = categories.find((c) => c.category_id === doc.category_id);
                      const docTags = tags.filter(t => doc.tag_ids?.includes(t.tag_id));
                      return (
                        <div
                          key={doc.doc_id}
                          className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
                          style={{ borderColor: category?.color || '#e5e7eb' }}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedDocIds.includes(doc.doc_id)}
                              onChange={() => handleDocCheckboxChange(doc.doc_id)}
                              className="mt-1.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1 flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div
                                  className="h-10 w-10 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: category?.color || '#e5e7eb' }}
                                >
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
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-medium text-gray-900">{doc.title}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{category?.category_name}</p>
                                  {docTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {docTags.map((tag) => {
                                        const tagCategory = categories.find(c => c.category_id === tag.category_id);
                                        return (
                                          <span
                                            key={tag.tag_id}
                                            className="text-xs px-2 py-1 rounded-full"
                                            style={{
                                              backgroundColor: `${tagCategory?.color}20`,
                                              color: tagCategory?.color || '#6b7280'
                                            }}
                                          >
                                            {tag.tag_name}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                ID: {doc.doc_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* モデル管理 */}
            {activeTab === 'models' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">LLMモデル管理</h2>

                {/* アップロードフォーム（モック） */}
                <form onSubmit={handleUploadModel} className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      モデルファイルを選択（.gguf）
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors">
                          {selectedModelFile ? (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="h-5 w-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm text-gray-700">{selectedModelFile.name}</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(selectedModelFile.size / (1024 * 1024))} MB)
                              </span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <svg
                                className="mx-auto h-8 w-8 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                              <p className="mt-1 text-sm text-gray-600">
                                クリックして .gguf ファイルを選択
                              </p>
                              <p className="text-xs text-gray-500">
                                llama.cpp 互換モデル
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".gguf"
                          onChange={handleModelFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                    <strong>MVP版:</strong> ファイル選択は可能ですが、実際のアップロード処理は未実装です。モデル情報のみ登録されます。
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedModelFile}
                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    モデルを追加（モック）
                  </button>
                </form>

                {/* モデルリスト */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">登録済みモデル</h3>
                    {selectedModelIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedModelIds.length}件選択中
                        </span>
                        <button
                          onClick={handleArchiveSelectedModels}
                          className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          {models.some(m => selectedModelIds.includes(m.model_id) && m.archived)
                            ? 'アーカイブ解除'
                            : 'アーカイブ'}
                        </button>
                        <button
                          onClick={handleDeleteSelectedModels}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  {/* モデル一覧 */}
                  <div className="grid gap-4">
                    {models.map((model) => (
                      <div
                        key={model.model_id}
                        className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                          model.archived ? 'border-gray-300 opacity-60' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedModelIds.includes(model.model_id)}
                            onChange={() => handleModelCheckboxChange(model.model_id)}
                            className="mt-1.5 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-lg font-semibold text-gray-900">{model.model_name}</h4>
                                {model.archived && (
                                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                                    アーカイブ済み
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-500">
                                  サイズ: {model.file_size_mb.toLocaleString()} MB
                                </span>
                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                                  ID: {model.model_id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ユーザー管理 */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>

                {/* 追加フォーム */}
                <form onSubmit={handleAddUser} className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ユーザー名
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例: john_doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      パスワード
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="パスワードを入力"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      権限
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {roles.map((role) => (
                        <option key={role.role_id} value={role.role_name}>
                          {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    ユーザーを追加
                  </button>
                </form>

                {/* 一覧 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">登録済みユーザー</h3>
                    {selectedUserIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedUserIds.length}件選択中
                        </span>
                        {selectedUserIds.length === 1 && (
                          <button
                            onClick={() => {
                              const user = users.find(u => u.user_id === selectedUserIds[0]);
                              if (user) handleStartEditUser(user);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            編集
                          </button>
                        )}
                        <button
                          onClick={handleDeleteSelectedUsers}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  {editingUserId && (
                    <form onSubmit={handleUpdateUser} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">ユーザー編集</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ユーザー名
                          </label>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            新しいパスワード（変更する場合のみ）
                          </label>
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="変更しない場合は空欄"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            権限
                          </label>
                          <select
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {roles.map((role) => (
                              <option key={role.role_id} value={role.role_name}>
                                {role.description}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            更新
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditUser}
                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="grid gap-4">
                    {users.map((user) => (
                      <div
                        key={user.user_id}
                        className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.user_id)}
                            onChange={() => handleUserCheckboxChange(user.user_id)}
                            className="mt-1.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1 flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`h-10 w-10 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0 ${
                                user.role === 'admin'
                                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                              }`}>
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">{user.username}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    user.role === 'admin'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                                  </span>
                                  {user.created_at && (
                                    <span className="text-xs text-gray-500">
                                      登録日: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                              ID: {user.user_id}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 権限管理 */}
            {activeTab === 'roles' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900">権限管理</h2>

                {/* 追加フォーム */}
                <form onSubmit={handleAddRole} className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      権限名
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例: content_manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      説明
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="権限の説明を入力"
                    />
                  </div>

                  {/* 権限マトリックス */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      権限設定
                    </label>
                    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              リソース
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              作成
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              参照
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              更新
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              削除
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(['category', 'tag', 'document', 'model', 'user', 'role'] as const).map((resource) => {
                            const resourceLabels = {
                              category: 'カテゴリ',
                              tag: 'タグ',
                              document: '文書',
                              model: 'モデル',
                              user: 'ユーザー',
                              role: '権限'
                            };
                            const permission = newRolePermissions.find(p => p.resource === resource);
                            return (
                              <tr key={resource} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {resourceLabels[resource]}
                                </td>
                                {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                                  <td key={action} className="px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={permission?.actions.includes(action) || false}
                                      onChange={() => handleTogglePermission(resource, action)}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <strong>注意:</strong> カスタム権限を作成できますが、実際のデータベースへの保存は未実装です（モック実装）。
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    権限を追加
                  </button>
                </form>

                {/* 一覧 */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">登録済み権限</h3>
                    {selectedRoleIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedRoleIds.length}件選択中
                        </span>
                        {selectedRoleIds.length === 1 && !roles.find(r => r.role_id === selectedRoleIds[0])?.is_system && (
                          <button
                            onClick={() => {
                              const role = roles.find(r => r.role_id === selectedRoleIds[0]);
                              if (role) handleStartEditRole(role);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            編集
                          </button>
                        )}
                        <button
                          onClick={handleDeleteSelectedRoles}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  {editingRoleId && (
                    <form onSubmit={handleUpdateRole} className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">権限編集</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            権限名
                          </label>
                          <input
                            type="text"
                            value={editRoleName}
                            onChange={(e) => setEditRoleName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            説明
                          </label>
                          <input
                            type="text"
                            value={editRoleDesc}
                            onChange={(e) => setEditRoleDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        {/* 編集用権限マトリックス */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            権限設定
                          </label>
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                                    リソース
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                                    作成
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                                    参照
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                                    更新
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">
                                    削除
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {(['category', 'tag', 'document', 'model', 'user', 'role'] as const).map((resource) => {
                                  const resourceLabels = {
                                    category: 'カテゴリ',
                                    tag: 'タグ',
                                    document: '文書',
                                    model: 'モデル',
                                    user: 'ユーザー',
                                    role: '権限'
                                  };
                                  const permission = editRolePermissions.find(p => p.resource === resource);
                                  return (
                                    <tr key={resource} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                        {resourceLabels[resource]}
                                      </td>
                                      {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                                        <td key={action} className="px-3 py-2 text-center">
                                          <input
                                            type="checkbox"
                                            checked={permission?.actions.includes(action) || false}
                                            onChange={() => handleToggleEditPermission(resource, action)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            更新
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditRole}
                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  <div className="grid gap-4">
                    {roles.map((role) => (
                      <div
                        key={role.role_id}
                        className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                          role.is_system ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedRoleIds.includes(role.role_id)}
                            onChange={() => handleRoleCheckboxChange(role.role_id)}
                            className="mt-1.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            disabled={role.is_system}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-lg font-semibold text-gray-900">{role.role_name}</h4>
                                {role.is_system && (
                                  <span className="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                                    システム権限
                                  </span>
                                )}
                              </div>
                              <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                ID: {role.role_id}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{role.description}</p>

                            {/* 権限詳細 */}
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <h5 className="text-xs font-semibold text-gray-700 mb-2">付与されている権限:</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {role.permissions.map((perm, idx) => {
                                  const resourceLabels: Record<string, string> = {
                                    category: 'カテゴリ',
                                    tag: 'タグ',
                                    document: '文書',
                                    model: 'モデル',
                                    user: 'ユーザー',
                                    role: '権限'
                                  };
                                  const actionLabels: Record<string, string> = {
                                    create: '作成',
                                    read: '参照',
                                    update: '更新',
                                    delete: '削除'
                                  };
                                  return (
                                    <div key={idx} className="text-xs">
                                      <span className="font-medium text-gray-700">
                                        {resourceLabels[perm.resource]}:
                                      </span>{' '}
                                      <span className="text-gray-600">
                                        {perm.actions.map(a => actionLabels[a]).join(', ')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
