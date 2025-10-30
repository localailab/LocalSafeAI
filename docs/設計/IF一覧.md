# 🔌 LocalSafeAI IF一覧（Next.js ⇄ Python・ポートレス構成）

---

## 💡 基本仕様

| 項目      | 内容                                                |
| ------- | ------------------------------------------------- |
| 通信方式    | IPC（プロセス間通信）or 関数呼び出し                             |
| 通信ライブラリ | `pywebview.api` / `tauri.invoke()` / Electron IPC |
| データ形式   | JSON（引数・戻り値）                                      |
| 実行環境    | Next.js (静的UI) + Python (バックエンド)                  |
| ポート利用   | **なし（HTTPサーバ未使用）**                                |

---

## 1️⃣ ユーザー管理

### register_user(username, password, role)

* ユーザー登録
  **入力**

```json
{ "username": "admin", "password": "123456", "role": "admin" }
```

**出力**

```json
{ "user_id": 1, "username": "admin", "created_at": "2025-10-24T10:00:00Z" }
```

---

### login(username, password)

* ローカルログイン
  **入力**

```json
{ "username": "admin", "password": "123456" }
```

**出力**

```json
{ "user_id": 1, "token": "local-session-uuid", "expires_in": 3600 }
```

---

## 2️⃣ 文書管理

### upload_document(file_path, category_id, tag_ids)

* 文書アップロード・登録
  **入力**

```json
{
  "files": [
    { "file_path": "C:/docs/学校案内.pdf", "category_id": 2, "tag_ids": [5, 6] },
    { "file_path": "C:/docs/地域医療計画.docx", "category_id": 3, "tag_ids": [7] }
  ]
}
```

**出力**

```json
{
  "results": [
    { "doc_id": 21, "file_name": "学校案内.pdf", "status": "uploaded" },
    { "doc_id": 22, "file_name": "地域医療計画.docx", "status": "uploaded" }
  ],
  "total_uploaded": 2
}
```

---

### get_documents()

* 文書一覧取得
  **出力**

```json
[
  { "doc_id": 1, "title": "授業関連", "category": "科目", "tags": ["算数","国語"], "created_at": "2025-10-20" }
]
```

---

### delete_document(doc_id)

* 文書削除（DB・.npy・.faiss連動）

---

## 3️⃣ ベクトル／FAISS管理

### generate_embedding(doc_id)

* 文書をチャンク分割 → `.npy`ベクトル生成
  **出力**

```json
{ "doc_id": 12, "vectors_created": 35, "vector_file": "vectors/doc_12.npy" }
```

---

### build_faiss_index(index_name)

* `.npy`から `.faiss` インデックス構築
  **出力**

```json
{ "index_id": 2, "index_path": "indexes/main_index.faiss", "total_vectors": 14352 }
```

---

### search_vector(query, top_k)

* FAISS類似検索
  **入力**

```json
{ "query": "親子　行事", "top_k": 5 }
```

**出力**

```json
{
  "results": [
    { "doc_id": 12, "chunk_index": 4, "score": 0.88, "text_chunk": "３者面談..." }
  ]
}
```

---

## 4️⃣ カテゴリ／タグ管理

### get_categories()

**出力**

```json
[
  { "category_id": 1, "category_name": "科目", "description": "教科関連", "color": "#3b82f6" }
]
```

---

### add_category(category_name, description, color)

* カテゴリ追加（管理者のみ）
  **入力**

```json
{ "category_name": "カリキュラム", "description": "授業計画・指導案関連", "color": "#3b82f6" }
```

**出力**

```json
{ "category_id": 5, "category_name": "カリキュラム", "description": "授業計画・指導案関連", "color": "#3b82f6" }
```

---

### get_tags(category_id)

* タグ一覧取得（カテゴリIDでフィルタ可能）
  **入力**

```json
{ "category_id": 1 }
```

**出力**

```json
[
  { "tag_id": 1, "tag_name": "授業計画", "category_id": 1 },
  { "tag_id": 2, "tag_name": "アクティブラーニング", "category_id": 1 }
]
```

---

### add_tag(category_id, tag_name)

**入力**

```json
{ "category_id": 1, "tag_name": "英語" }
```

**出力**

```json
{ "tag_id": 3, "tag_name": "英語" }
```

---

## 5️⃣ モデル管理

### get_models()

* モデル一覧取得
  **出力**

```json
[
  { "model_id": 1, "model_name": "Llama-3-8B", "file_size_mb": 4800, "description": "高速・軽量モデル" },
  { "model_id": 2, "model_name": "Llama-3-70B", "file_size_mb": 40000, "description": "高性能モデル" },
  { "model_id": 3, "model_name": "Mistral-7B", "file_size_mb": 4200, "description": "バランス型モデル" }
]
```

---

### upload_model(file_path, model_name, description)

**入力**

```json
{ "file_path": "C:/models/Mistral-7B.gguf", "model_name": "Mistral-7B", "description": "高性能LLMモデル" }
```

**出力**

```json
{ "model_id": 2, "model_name": "Mistral-7B", "status": "registered" }
```

---

### activate_model(model_id)

* 指定モデルをアクティブ化（`models.active=true`）

---

## 6️⃣ 設定管理

### get_settings()

**出力**

```json
{ "search.top_k": "5", "encryption.enabled": "true" }
```

---

### update_setting(key, value)

**入力**

```json
{ "key": "search.top_k", "value": "10" }
```

**出力**

```json
{ "key": "search.top_k", "value": "10", "updated_at": "2025-10-24T12:00:00Z" }
```

---

## 7️⃣ ログ管理

### get_logs(level, limit)

**入力**

```json
{ "level": "ERROR", "limit": 20 }
```

**出力**

```json
[
  { "timestamp": "2025-10-24T10:00", "level": "ERROR", "message": "FAISS index not found" }
]
```

---

## 8️⃣ 内部ユーティリティ（非UI呼出し）

| 関数名                          | 説明           |
| ---------------------------- | ------------ |
| `encrypt_file(path)`         | AES暗号化処理     |
| `decrypt_file(path)`         | 復号処理         |
| `validate_integrity(doc_id)` | ベクトル・DB整合性検証 |
| `cleanup_orphan_vectors()`   | 参照切れファイル削除   |

---

## ✅ 備考

* 全関数は Next.js 側から

  ```ts
  await window.pywebview.api.functionName(params)
  ```

  で呼び出し可能。
* 返却形式は JSON 固定。
* ポート未使用、完全ローカル実行。

---
