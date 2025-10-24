# LocalSafeAI データベース設計書（FAISS対応・外部ベクトル管理版）

---

## 1. 設計方針

- **DBMS**：PostgreSQL
- **目的**：ローカル完結のAIドキュメント検索・要約・モデル管理  
- **検索エンジン**：FAISS（ベクトルは外部ファイル `.npy` / `.faiss` で管理）  
- **設計思想**：
  - データベースは **「メタ情報」＋「テキスト」管理専用**
  - ベクトルデータはファイルで保存し、パスをDBに登録
  - AES-256暗号化によるローカルデータ保護
  - ログ・監査を完全DB内で管理

---

## 2. テーブル構成一覧

| テーブル名 | 用途 | 主キー |
|-------------|------|--------|
| `users` | ユーザーアカウント・権限情報 | `user_id` |
| `documents` | 文書メタ情報 | `doc_id` |
| `embeddings` | 文書のチャンク情報・ベクトルファイル参照 | `embed_id` |
| `categories` | タグ分類カテゴリ | `category_id` |
| `tags` | タグ情報（カテゴリ所属） | `tag_id` |
| `document_tags` | 文書とタグの紐付け | 複合キー(`doc_id`, `tag_id`) |
| `indexes` | FAISSインデックス管理 | `index_id` |
| `models` | LLMモデル情報 | `model_id` |
| `settings` | システム設定情報 | `key` |
| `logs` | システム・エラーログ | `log_id` |

---

## 3. テーブル定義

### users

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| user_id | SERIAL | PK | ユーザーID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | ログイン名 |
| role | VARCHAR(20) | NOT NULL | 権限（`admin` / `user`） |
| password_hash | TEXT | NOT NULL | パスワードハッシュ |
| last_login | TIMESTAMP | | 最終ログイン日時 |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |
| updated_at | TIMESTAMP | DEFAULT now() | 更新日時 |

---

### documents

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| doc_id | SERIAL | PK | 文書ID |
| file_name | VARCHAR(255) | NOT NULL | ファイル名 |
| file_type | VARCHAR(20) | | 拡張子（pdf, docx, txt, csvなど） |
| title | VARCHAR(255) | | 文書タイトル |
| summary | TEXT | | 要約内容（AI生成結果） |
| file_path | TEXT | | 元ファイルの保存先（暗号化対象） |
| size_kb | INTEGER | | ファイルサイズ（KB） |
| uploaded_by | INTEGER | FK → users.user_id | 登録ユーザー |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |
| updated_at | TIMESTAMP | DEFAULT now() | 更新日時 |

---

### embeddings（外部ベクトル参照）

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| embed_id | SERIAL | PK | チャンクID |
| doc_id | INTEGER | FK → documents.doc_id | 対応する文書 |
| chunk_index | INTEGER | NOT NULL | チャンク番号 |
| text_chunk | TEXT | NOT NULL | チャンク本文（検索再構成用） |
| vector_path | TEXT | | ベクトルファイルの保存パス（例：`vectors/doc_001_chunk_01.npy`） |
| index_id | INTEGER | FK → indexes.index_id | 登録されたFAISSインデックス参照 |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |

---

### categories

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| category_id | SERIAL | PK | カテゴリーID |
| category_name | VARCHAR(100) | UNIQUE, NOT NULL | カテゴリー名（例：保険、医療） |
| description | TEXT | | カテゴリー説明 |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |
| updated_at | TIMESTAMP | DEFAULT now() | 更新日時 |

---

### tags

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| tag_id | SERIAL | PK | タグID |
| tag_name | VARCHAR(100) | NOT NULL | タグ名（例：後期高齢者医療） |
| category_id | INTEGER | FK → categories.category_id | 所属カテゴリ |
| description | TEXT | | タグ説明 |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |
| updated_at | TIMESTAMP | DEFAULT now() | 更新日時 |

**制約**
- UNIQUE(category_id, tag_name)

---

### document_tags

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| doc_id | INTEGER | FK → documents.doc_id | 文書ID |
| tag_id | INTEGER | FK → tags.tag_id | タグID |
| PRIMARY KEY | (doc_id, tag_id) | | 複合主キー |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |

---

### indexes（FAISSインデックス管理）

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| index_id | SERIAL | PK | インデックスID |
| index_name | VARCHAR(100) | UNIQUE | インデックス名（例：main_index） |
| index_path | TEXT | NOT NULL | FAISSファイル保存先（例：`indexes/main_index.faiss`） |
| dimension | INTEGER | NOT NULL | ベクトル次元数（例：1536） |
| total_vectors | INTEGER | | 登録ベクトル数 |
| description | TEXT | | 管理メモ・用途説明 |
| updated_at | TIMESTAMP | DEFAULT now() | 更新日時 |

---

### models

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| model_id | SERIAL | PK | モデルID |
| model_name | VARCHAR(100) | UNIQUE | モデル名（例：Mistral-7B） |
| file_name | VARCHAR(255) | NOT NULL | アップロードファイル名 |
| file_size_mb | INTEGER | | ファイルサイズ（MB） |
| format | VARCHAR(50) | NOT NULL | モデル形式（gguf） |
| description | TEXT | | モデル説明 |
| uploaded_by | INTEGER | FK → users.user_id | 登録者 |
| active | BOOLEAN | DEFAULT false | 現在使用中モデル |
| checksum | VARCHAR(128) | | 整合性確認用ハッシュ |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |

---

### settings

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| key | VARCHAR(100) | PK | 設定キー |
| value | TEXT | | 設定値（JSON可） |
| description | TEXT | | 設定の説明 |
| updated_at | TIMESTAMP | DEFAULT now() | 更新日時 |

---

### logs

| カラム名 | 型 | 制約 | 説明 |
|-----------|----|------|------|
| log_id | SERIAL | PK | ログID |
| timestamp | TIMESTAMP | DEFAULT now() | 発生時刻 |
| level | VARCHAR(10) | NOT NULL | ログレベル（INFO / ERRORなど） |
| user_id | INTEGER | FK → users.user_id | 操作ユーザー（NULL可） |
| source | VARCHAR(100) | | 発生モジュール名 |
| message | TEXT | NOT NULL | 概要メッセージ |
| detail | TEXT | | 詳細内容（JSON可） |
| resolved | BOOLEAN | DEFAULT false | 対応済フラグ |
| created_at | TIMESTAMP | DEFAULT now() | 登録日時 |

---

## 4. リレーション概要
users (1)───(n) documents
documents (1)───(n) embeddings
embeddings (n)───(1) indexes
documents (n)───(n) tags ← document_tags
tags (n)───(1) categories
users (1)───(n) models
users (1)───(n) logs


---

## 5. ストレージ構成（外部ファイル管理）
LocalSafeAI/
├── db/
│ └── localsafeai.db
├── documents/
│ └── uploaded/
├── vectors/
│ ├── doc_001_chunk_01.npy
│ ├── doc_001_chunk_02.npy
│ └── ...
├── indexes/
│ ├── main_index.faiss
│ └── insurance_index.faiss
└── logs/
└── system.log


---

## 設計の特徴まとめ
- **ベクトルは外部ファイル管理**（`.npy` / `.faiss`）で軽量・高速  
- **DBはメタ情報＋テキスト＋監査専用**  
- **FAISSインデックス管理テーブル（indexes）** により、検索対象を明示的に追跡可能  
- **カテゴリー＋タグ構造**で柔軟な分類検索をサポート  
- **オフライン動作前提**（暗号化ストレージ・通信ポート無効化想定）  

---

## 6. 今後の拡張余地

| 項目 | 内容 |
|------|------|
| 差分インデックス再構築 | embeddingsテーブル更新時に自動再構築 |
| モデル別インデックス管理 | indexes に model_id を追加してモデルごとに分離 |
| バックアップ簡略化 | `.faiss` と `.npy` の同期スクリプトを提供 |
| キャッシュ強化 | 頻出クエリを in-memory FAISS でキャッシュ保持 |

---
