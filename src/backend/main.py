from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import time

app = FastAPI(title="LocalSafeAI API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# モデル定義
# ============================================

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user_id: int
    username: str
    token: str
    role: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "user"

class RegisterResponse(BaseModel):
    user_id: int
    username: str
    created_at: str

class ChatMessage(BaseModel):
    query: str
    use_rag: bool = True
    category_ids: list[int] = []
    tag_ids: list[int] = []

class SearchResult(BaseModel):
    doc_id: int
    chunk_index: int
    score: float
    text_chunk: str
    doc_title: str

class ChatResponse(BaseModel):
    query: str
    answer: str
    search_results: List[SearchResult]
    processing_time: float

class Permission(BaseModel):
    resource: str  # 'category', 'tag', 'document', 'model', 'user'
    actions: List[str]  # ['create', 'read', 'update', 'delete']

class Role(BaseModel):
    role_id: int
    role_name: str
    description: str
    is_system: bool
    permissions: List[Permission]
    created_at: str

# ============================================
# モックデータ（学校関連）
# ============================================

MOCK_USERS = [
    {
        "user_id": 1,
        "username": "teacher",
        "password": "teacher123",  # 本番ではハッシュ化必須
        "role": "admin",
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "user_id": 2,
        "username": "staff",
        "password": "staff123",
        "role": "user",
        "created_at": "2024-01-01T00:00:00"
    }
]

# 権限管理モックデータ
MOCK_ROLES = [
    {
        "role_id": 1,
        "role_name": "admin",
        "description": "スーパー管理者（全権限）",
        "is_system": True,
        "permissions": [
            {"resource": "category", "actions": ["create", "read", "update", "delete"]},
            {"resource": "tag", "actions": ["create", "read", "update", "delete"]},
            {"resource": "document", "actions": ["create", "read", "update", "delete"]},
            {"resource": "model", "actions": ["create", "read", "update", "delete"]},
            {"resource": "user", "actions": ["create", "read", "update", "delete"]},
            {"resource": "role", "actions": ["create", "read", "update", "delete"]},
        ],
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "role_id": 2,
        "role_name": "user",
        "description": "一般ユーザー（チャットのみ）",
        "is_system": True,
        "permissions": [],
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "role_id": 3,
        "role_name": "editor",
        "description": "編集者（文書・カテゴリ・タグの編集が可能）",
        "is_system": False,
        "permissions": [
            {"resource": "category", "actions": ["read", "update"]},
            {"resource": "tag", "actions": ["read", "update"]},
            {"resource": "document", "actions": ["create", "read", "update", "delete"]},
        ],
        "created_at": "2024-01-01T00:00:00"
    },
    {
        "role_id": 4,
        "role_name": "content_manager",
        "description": "コンテンツマネージャー（文書全権限 + カテゴリ・タグ管理）",
        "is_system": False,
        "permissions": [
            {"resource": "category", "actions": ["create", "read", "update", "delete"]},
            {"resource": "tag", "actions": ["create", "read", "update", "delete"]},
            {"resource": "document", "actions": ["create", "read", "update", "delete"]},
        ],
        "created_at": "2024-01-01T00:00:00"
    },
]

MOCK_CATEGORIES = [
    {"category_id": 1, "category_name": "カリキュラム", "description": "授業計画・指導案関連", "color": "#3b82f6"},
    {"category_id": 2, "category_name": "生徒指導", "description": "生徒指導・教育相談関連", "color": "#10b981"},
    {"category_id": 3, "category_name": "法律", "description": "教育法規・規則関連", "color": "#f59e0b"},
    {"category_id": 4, "category_name": "評価", "description": "学習評価・成績処理関連", "color": "#8b5cf6"},
]

MOCK_TAGS = [
    {"tag_id": 1, "tag_name": "授業計画", "category_id": 1},
    {"tag_id": 2, "tag_name": "アクティブラーニング", "category_id": 1},
    {"tag_id": 3, "tag_name": "指導案", "category_id": 1},
    {"tag_id": 4, "tag_name": "問題行動", "category_id": 2},
    {"tag_id": 5, "tag_name": "教育相談", "category_id": 2},
    {"tag_id": 6, "tag_name": "保護者対応", "category_id": 2},
    {"tag_id": 7, "tag_name": "学校教育法", "category_id": 3},
    {"tag_id": 8, "tag_name": "教員の義務", "category_id": 3},
    {"tag_id": 9, "tag_name": "形成的評価", "category_id": 4},
    {"tag_id": 10, "tag_name": "ルーブリック", "category_id": 4},
]

MOCK_DOCUMENTS = [
    {"doc_id": 1, "title": "学校教育法施行規則", "category_id": 3, "tag_ids": [7]},
    {"doc_id": 2, "title": "授業計画ガイドライン2024", "category_id": 1, "tag_ids": [1, 2, 3]},
    {"doc_id": 3, "title": "生徒指導の手引き", "category_id": 2, "tag_ids": [4, 5, 6]},
    {"doc_id": 4, "title": "学習評価の方法", "category_id": 4, "tag_ids": [9, 10]},
]

MOCK_MODELS = [
    {"model_id": 1, "model_name": "Llama-3-8B", "file_size_mb": 4800, "description": "高速・軽量モデル", "archived": False},
    {"model_id": 2, "model_name": "Llama-3-70B", "file_size_mb": 40000, "description": "高性能モデル", "archived": False},
    {"model_id": 3, "model_name": "Mistral-7B", "file_size_mb": 4200, "description": "バランス型モデル", "archived": False},
]

MOCK_SEARCH_RESULTS = [
    {
        "doc_id": 2,
        "chunk_index": 12,
        "score": 0.92,
        "text_chunk": "アクティブラーニングとは、学習者が能動的に学習に参加する授業手法です。グループディスカッション、ディベート、プレゼンテーションなどを通じて、思考力・判断力・表現力を育成します。従来の講義形式と組み合わせることで、より深い理解を促進できます。",
        "doc_title": "授業計画ガイドライン2024"
    },
    {
        "doc_id": 2,
        "chunk_index": 13,
        "score": 0.87,
        "text_chunk": "授業設計では、まず学習目標を明確に設定することが重要です。その後、目標達成のための活動内容、評価方法を具体的に計画します。生徒の発達段階や学習状況に応じて柔軟に調整することも大切です。",
        "doc_title": "授業計画ガイドライン2024"
    },
    {
        "doc_id": 1,
        "chunk_index": 5,
        "score": 0.81,
        "text_chunk": "学校教育法第37条により、小学校には、校長、教頭、教諭、養護教諭及び事務職員を置かなければならないとされています。また、学校の規模等に応じて、副校長、主幹教諭、指導教諭、栄養教諭その他の職員を置くことができます。",
        "doc_title": "学校教育法施行規則"
    }
]

MOCK_ANSWERS = {
    "授業": "授業計画を立てる際のポイントについてお答えします。\n\n**1. 学習目標の明確化**\n- 生徒に何を学ばせたいのかを具体的に設定\n- 知識・技能だけでなく、思考力・判断力・表現力も考慮\n\n**2. アクティブラーニングの導入**\n- グループディスカッションやプレゼンテーションを取り入れる\n- 生徒が主体的に学ぶ場面を設計する\n- 従来の講義形式とバランスよく組み合わせる\n\n**3. 評価方法の設計**\n- 形成的評価と総括的評価を組み合わせる\n- ルーブリックを活用した多面的な評価\n\n**4. 柔軟な調整**\n- 生徒の理解度に応じて進度を調整\n- フィードバックを活かした改善\n\nこれらを意識することで、効果的な授業が実現できます。",
    "生徒指導": "生徒指導における基本的な考え方についてご説明します。\n\n**生徒指導の目的**\n生徒一人ひとりの人格の健全な発達を支援し、社会的資質や行動力を育成することです。\n\n**基本原則**\n\n1. **受容的・共感的理解**\n   - 生徒の気持ちや立場を理解する\n   - 信頼関係の構築が最優先\n\n2. **自己決定の尊重**\n   - 生徒自身の選択と責任を重視\n   - 主体性を育む支援\n\n3. **個別的・継続的対応**\n   - 一人ひとりの状況に応じた支援\n   - 長期的な視点での関わり\n\n**具体的な取り組み**\n- 定期的な面談・観察\n- 家庭や関係機関との連携\n- チーム学校としての組織的対応\n\n問題行動への対処だけでなく、予防的・開発的な生徒指導が重要です。",
    "評価": "学習評価の方法について、最新の考え方をご説明します。\n\n**評価の3つの観点**（新学習指導要領）\n\n1. **知識・技能**\n   - 基礎的な知識の習得状況\n   - 技能の定着度\n\n2. **思考・判断・表現**\n   - 知識を活用して課題を解決する力\n   - 自分の考えを表現する力\n\n3. **主体的に学習に取り組む態度**\n   - 粘り強く取り組む姿勢\n   - 自己調整しながら学ぶ態度\n\n**効果的な評価方法**\n\n- **形成的評価**: 学習過程での小テスト、観察、対話\n- **総括的評価**: 単元末テスト、パフォーマンス課題\n- **ルーブリック**: 評価基準を明確化し、生徒と共有\n- **ポートフォリオ**: 学習の成長過程を可視化\n\n評価は「測定」だけでなく、生徒の成長を支援するツールとして活用することが大切です。",
    "default": "ご質問ありがとうございます。\n\n申し訳ございませんが、ご質問の内容に関連する文書が見つかりませんでした。\n\n以下をお試しください：\n- より具体的なキーワードで検索する（例：「授業計画」「生徒指導」「評価方法」など）\n- 関連文書をアップロードする\n- 質問の表現を変えてみる\n\n**現在登録されている文書カテゴリ**：\n- 法律関連（学校教育法など）\n- カリキュラム（授業計画、指導案など）\n- 生徒指導関連\n\n学校運営や教育実践に関するご質問であれば、お答えできる可能性が高いです。"
}

# ============================================
# エンドポイント
# ============================================

@app.get("/")
def root():
    return {
        "message": "LocalSafeAI API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/auth/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """ログイン（モックデータ）"""
    user = next((u for u in MOCK_USERS if u["username"] == request.username), None)

    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="認証に失敗しました")

    return LoginResponse(
        user_id=user["user_id"],
        username=user["username"],
        token=f"mock-token-{user['user_id']}-{int(time.time())}",
        role=user["role"]
    )

@app.post("/api/auth/register", response_model=RegisterResponse)
def register(request: RegisterRequest):
    """ユーザー登録（モック）"""
    # 既存ユーザーチェック
    if any(u["username"] == request.username for u in MOCK_USERS):
        raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています")

    new_user_id = max([u["user_id"] for u in MOCK_USERS], default=0) + 1

    return RegisterResponse(
        user_id=new_user_id,
        username=request.username,
        created_at=datetime.now().isoformat()
    )

@app.get("/api/categories")
def get_categories():
    """カテゴリ一覧取得"""
    return MOCK_CATEGORIES

@app.get("/api/tags")
def get_tags(category_id: Optional[int] = None):
    """タグ一覧取得（カテゴリでフィルタ可能）"""
    if category_id:
        return [tag for tag in MOCK_TAGS if tag["category_id"] == category_id]
    return MOCK_TAGS

@app.get("/api/models")
def get_models():
    """モデル一覧取得（チャット用：アーカイブされていないもののみ）"""
    return [m for m in MOCK_MODELS if not m.get("archived", False)]

@app.post("/api/chat", response_model=ChatResponse)
def chat(message: ChatMessage):
    """チャット・質問応答（モックデータ）"""
    start_time = time.time()

    # 処理時間をシミュレート（0.5-1.5秒）
    time.sleep(0.8)

    # タグ・カテゴリでフィルタリング（モック）
    filtered_info = ""
    if message.tag_ids:
        selected_tags = [t["tag_name"] for t in MOCK_TAGS if t["tag_id"] in message.tag_ids]
        filtered_info = f"\n\n選択されたタグ: {', '.join(selected_tags)}"

    # キーワードに基づいてモック回答を選択
    if "授業" in message.query or "アクティブラーニング" in message.query or "指導案" in message.query:
        answer = MOCK_ANSWERS["授業"] + filtered_info
        search_results = MOCK_SEARCH_RESULTS[:2]
    elif "生徒指導" in message.query or "生徒" in message.query:
        answer = MOCK_ANSWERS["生徒指導"] + filtered_info
        search_results = MOCK_SEARCH_RESULTS[1:3]
    elif "評価" in message.query or "テスト" in message.query or "成績" in message.query:
        answer = MOCK_ANSWERS["評価"] + filtered_info
        search_results = MOCK_SEARCH_RESULTS
    else:
        answer = MOCK_ANSWERS["default"] + filtered_info
        search_results = []

    processing_time = time.time() - start_time

    return ChatResponse(
        query=message.query,
        answer=answer,
        search_results=search_results,
        processing_time=round(processing_time, 2)
    )

@app.post("/api/admin/categories")
def add_category(category_name: str, description: str = "", color: str = "#6b7280"):
    """カテゴリ追加（管理者のみ）"""
    new_id = max([c["category_id"] for c in MOCK_CATEGORIES]) + 1
    new_category = {
        "category_id": new_id,
        "category_name": category_name,
        "description": description,
        "color": color
    }
    MOCK_CATEGORIES.append(new_category)
    return new_category

@app.put("/api/admin/categories/{category_id}")
def update_category(category_id: int, category_name: str, description: str = "", color: str = "#6b7280"):
    """カテゴリ編集（管理者のみ）"""
    global MOCK_CATEGORIES
    for i, category in enumerate(MOCK_CATEGORIES):
        if category["category_id"] == category_id:
            MOCK_CATEGORIES[i] = {
                "category_id": category_id,
                "category_name": category_name,
                "description": description,
                "color": color
            }
            return MOCK_CATEGORIES[i]
    raise HTTPException(status_code=404, detail="カテゴリが見つかりません")

@app.delete("/api/admin/categories/{category_id}")
def delete_category(category_id: int):
    """カテゴリ削除（管理者のみ）"""
    global MOCK_CATEGORIES
    MOCK_CATEGORIES = [c for c in MOCK_CATEGORIES if c["category_id"] != category_id]
    return {"status": "deleted", "category_id": category_id}

@app.post("/api/admin/categories/delete-multiple")
def delete_multiple_categories(category_ids: List[int]):
    """カテゴリ一斉削除（管理者のみ）"""
    global MOCK_CATEGORIES
    MOCK_CATEGORIES = [c for c in MOCK_CATEGORIES if c["category_id"] not in category_ids]
    return {"status": "deleted", "category_ids": category_ids, "count": len(category_ids)}

@app.post("/api/admin/tags")
def add_tag(tag_name: str, category_id: int):
    """タグ追加（管理者のみ）"""
    new_id = max([t["tag_id"] for t in MOCK_TAGS]) + 1
    new_tag = {
        "tag_id": new_id,
        "tag_name": tag_name,
        "category_id": category_id
    }
    MOCK_TAGS.append(new_tag)
    return new_tag

@app.put("/api/admin/tags/{tag_id}")
def update_tag(tag_id: int, tag_name: str, category_id: int):
    """タグ編集（管理者のみ）"""
    global MOCK_TAGS
    for i, tag in enumerate(MOCK_TAGS):
        if tag["tag_id"] == tag_id:
            MOCK_TAGS[i] = {
                "tag_id": tag_id,
                "tag_name": tag_name,
                "category_id": category_id
            }
            return MOCK_TAGS[i]
    raise HTTPException(status_code=404, detail="タグが見つかりません")

@app.delete("/api/admin/tags/{tag_id}")
def delete_tag(tag_id: int):
    """タグ削除（管理者のみ）"""
    global MOCK_TAGS
    MOCK_TAGS = [t for t in MOCK_TAGS if t["tag_id"] != tag_id]
    return {"status": "deleted", "tag_id": tag_id}

@app.post("/api/admin/tags/delete-multiple")
def delete_multiple_tags(tag_ids: List[int]):
    """タグ一斉削除（管理者のみ）"""
    global MOCK_TAGS
    MOCK_TAGS = [t for t in MOCK_TAGS if t["tag_id"] not in tag_ids]
    return {"status": "deleted", "tag_ids": tag_ids, "count": len(tag_ids)}

@app.post("/api/admin/documents")
def upload_document(file_name: str, category_id: int, tag_ids: list[int] = []):
    """文書アップロード（管理者のみ）- モック"""
    new_id = max([d["doc_id"] for d in MOCK_DOCUMENTS]) + 1
    new_doc = {
        "doc_id": new_id,
        "title": file_name,
        "category_id": category_id,
        "tag_ids": tag_ids
    }
    MOCK_DOCUMENTS.append(new_doc)
    return {"doc_id": new_id, "file_name": file_name, "status": "uploaded"}

@app.get("/api/admin/documents")
def get_all_documents():
    """文書一覧取得（管理者のみ）"""
    return MOCK_DOCUMENTS

@app.put("/api/admin/documents/{doc_id}")
def update_document(doc_id: int, title: str, category_id: int, tag_ids: list[int] = []):
    """文書編集（管理者のみ）"""
    global MOCK_DOCUMENTS
    for i, doc in enumerate(MOCK_DOCUMENTS):
        if doc["doc_id"] == doc_id:
            MOCK_DOCUMENTS[i] = {
                "doc_id": doc_id,
                "title": title,
                "category_id": category_id,
                "tag_ids": tag_ids
            }
            return MOCK_DOCUMENTS[i]
    raise HTTPException(status_code=404, detail="文書が見つかりません")

@app.delete("/api/admin/documents/{doc_id}")
def delete_document(doc_id: int):
    """文書削除（管理者のみ）"""
    global MOCK_DOCUMENTS
    MOCK_DOCUMENTS = [d for d in MOCK_DOCUMENTS if d["doc_id"] != doc_id]
    return {"status": "deleted", "doc_id": doc_id}

@app.post("/api/admin/documents/delete-multiple")
def delete_multiple_documents(doc_ids: List[int]):
    """文書一斉削除（管理者のみ）"""
    global MOCK_DOCUMENTS
    MOCK_DOCUMENTS = [d for d in MOCK_DOCUMENTS if d["doc_id"] not in doc_ids]
    return {"status": "deleted", "doc_ids": doc_ids, "count": len(doc_ids)}

@app.get("/api/admin/models")
def get_all_models():
    """全モデル一覧取得（管理者用：アーカイブ含む）"""
    return MOCK_MODELS

@app.post("/api/admin/models")
def upload_model(model_name: str, file_size_mb: int):
    """モデルアップロード（管理者のみ）- モック"""
    return {
        "model_id": 1,
        "model_name": model_name,
        "file_size_mb": file_size_mb,
        "status": "uploaded"
    }

@app.put("/api/admin/models/{model_id}")
def update_model(model_id: int, model_name: str, file_size_mb: int, description: str = ""):
    """モデル編集（管理者のみ）"""
    global MOCK_MODELS
    for i, model in enumerate(MOCK_MODELS):
        if model["model_id"] == model_id:
            MOCK_MODELS[i] = {
                "model_id": model_id,
                "model_name": model_name,
                "file_size_mb": file_size_mb,
                "description": description,
                "archived": model.get("archived", False)
            }
            return MOCK_MODELS[i]
    raise HTTPException(status_code=404, detail="モデルが見つかりません")

@app.post("/api/admin/models/{model_id}/archive")
def archive_model(model_id: int):
    """モデルをアーカイブ（管理者のみ）"""
    global MOCK_MODELS
    for model in MOCK_MODELS:
        if model["model_id"] == model_id:
            model["archived"] = True
            return {"status": "archived", "model_id": model_id, "model": model}
    raise HTTPException(status_code=404, detail="モデルが見つかりません")

@app.post("/api/admin/models/{model_id}/unarchive")
def unarchive_model(model_id: int):
    """モデルのアーカイブを解除（管理者のみ）"""
    global MOCK_MODELS
    for model in MOCK_MODELS:
        if model["model_id"] == model_id:
            model["archived"] = False
            return {"status": "unarchived", "model_id": model_id, "model": model}
    raise HTTPException(status_code=404, detail="モデルが見つかりません")

@app.post("/api/admin/models/archive-multiple")
def archive_multiple_models(model_ids: List[int]):
    """モデル一斉アーカイブ（管理者のみ）"""
    global MOCK_MODELS
    for model in MOCK_MODELS:
        if model["model_id"] in model_ids:
            model["archived"] = True
    return {"status": "archived", "model_ids": model_ids, "count": len(model_ids)}

@app.delete("/api/admin/models/{model_id}")
def delete_model(model_id: int):
    """モデル削除（管理者のみ）"""
    global MOCK_MODELS
    MOCK_MODELS = [m for m in MOCK_MODELS if m["model_id"] != model_id]
    return {"status": "deleted", "model_id": model_id}

@app.post("/api/admin/models/delete-multiple")
def delete_multiple_models(model_ids: List[int]):
    """モデル一斉削除（管理者のみ）"""
    global MOCK_MODELS
    MOCK_MODELS = [m for m in MOCK_MODELS if m["model_id"] not in model_ids]
    return {"status": "deleted", "model_ids": model_ids, "count": len(model_ids)}

# ============================================
# ユーザー管理エンドポイント（管理者のみ）
# ============================================

@app.get("/api/admin/users")
def get_users():
    """ユーザー一覧取得（管理者のみ）"""
    # パスワードを除外して返す
    return [
        {
            "user_id": u["user_id"],
            "username": u["username"],
            "role": u["role"],
            "created_at": u.get("created_at", "")
        }
        for u in MOCK_USERS
    ]

@app.post("/api/admin/users")
def add_user(username: str, password: str, role: str = "user"):
    """ユーザー追加（管理者のみ）"""
    global MOCK_USERS

    # 既存ユーザーチェック
    if any(u["username"] == username for u in MOCK_USERS):
        raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています")

    new_user_id = max([u["user_id"] for u in MOCK_USERS], default=0) + 1
    new_user = {
        "user_id": new_user_id,
        "username": username,
        "password": password,
        "role": role,
        "created_at": datetime.now().isoformat()
    }
    MOCK_USERS.append(new_user)

    # パスワードを除外して返す
    return {
        "user_id": new_user["user_id"],
        "username": new_user["username"],
        "role": new_user["role"],
        "created_at": new_user["created_at"]
    }

@app.put("/api/admin/users/{user_id}")
def update_user(user_id: int, username: str = None, password: str = None, role: str = None):
    """ユーザー情報更新（管理者のみ）"""
    global MOCK_USERS

    for i, user in enumerate(MOCK_USERS):
        if user["user_id"] == user_id:
            # ユーザー名変更時の重複チェック
            if username and username != user["username"]:
                if any(u["username"] == username for u in MOCK_USERS):
                    raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています")
                MOCK_USERS[i]["username"] = username

            # パスワード変更
            if password:
                MOCK_USERS[i]["password"] = password

            # 権限変更
            if role:
                MOCK_USERS[i]["role"] = role

            # パスワードを除外して返す
            return {
                "user_id": MOCK_USERS[i]["user_id"],
                "username": MOCK_USERS[i]["username"],
                "role": MOCK_USERS[i]["role"],
                "created_at": MOCK_USERS[i].get("created_at", "")
            }

    raise HTTPException(status_code=404, detail="ユーザーが見つかりません")

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int):
    """ユーザー削除（管理者のみ）"""
    global MOCK_USERS

    # 最後の管理者を削除できないようにする
    admin_count = sum(1 for u in MOCK_USERS if u["role"] == "admin")
    user_to_delete = next((u for u in MOCK_USERS if u["user_id"] == user_id), None)

    if user_to_delete and user_to_delete["role"] == "admin" and admin_count <= 1:
        raise HTTPException(status_code=400, detail="最後の管理者ユーザーは削除できません")

    MOCK_USERS = [u for u in MOCK_USERS if u["user_id"] != user_id]
    return {"status": "deleted", "user_id": user_id}

@app.post("/api/admin/users/delete-multiple")
def delete_multiple_users(user_ids: List[int]):
    """ユーザー一斉削除（管理者のみ）"""
    global MOCK_USERS

    # 最後の管理者を削除できないようにする
    remaining_admins = [u for u in MOCK_USERS if u["role"] == "admin" and u["user_id"] not in user_ids]
    if len(remaining_admins) == 0:
        raise HTTPException(status_code=400, detail="最後の管理者ユーザーは削除できません")

    MOCK_USERS = [u for u in MOCK_USERS if u["user_id"] not in user_ids]
    return {"status": "deleted", "user_ids": user_ids, "count": len(user_ids)}

# ============================================
# 権限管理エンドポイント（管理者のみ）
# ============================================

@app.get("/api/admin/roles")
def get_roles():
    """権限一覧取得（管理者のみ）"""
    return MOCK_ROLES

@app.get("/api/admin/roles/{role_id}")
def get_role(role_id: int):
    """権限詳細取得（管理者のみ）"""
    role = next((r for r in MOCK_ROLES if r["role_id"] == role_id), None)
    if not role:
        raise HTTPException(status_code=404, detail="権限が見つかりません")
    return role

class RoleCreateRequest(BaseModel):
    permissions: List[dict]

class RoleUpdateRequest(BaseModel):
    permissions: Optional[List[dict]] = None

@app.post("/api/admin/roles")
def add_role(role_name: str, description: str, body: RoleCreateRequest):
    """カスタム権限追加（管理者のみ）"""
    global MOCK_ROLES

    # 権限名の重複チェック
    if any(r["role_name"] == role_name for r in MOCK_ROLES):
        raise HTTPException(status_code=400, detail="この権限名は既に使用されています")

    new_role_id = max([r["role_id"] for r in MOCK_ROLES], default=0) + 1
    new_role = {
        "role_id": new_role_id,
        "role_name": role_name,
        "description": description,
        "is_system": False,
        "permissions": body.permissions,
        "created_at": datetime.now().isoformat()
    }
    MOCK_ROLES.append(new_role)
    return new_role

@app.put("/api/admin/roles/{role_id}")
def update_role(role_id: int, role_name: str = None, description: str = None, body: RoleUpdateRequest = None):
    """権限更新（管理者のみ）"""
    global MOCK_ROLES

    for i, role in enumerate(MOCK_ROLES):
        if role["role_id"] == role_id:
            # システムロールは編集不可
            if role["is_system"]:
                raise HTTPException(status_code=400, detail="システム定義の権限は編集できません")

            # 権限名変更時の重複チェック
            if role_name and role_name != role["role_name"]:
                if any(r["role_name"] == role_name for r in MOCK_ROLES):
                    raise HTTPException(status_code=400, detail="この権限名は既に使用されています")
                MOCK_ROLES[i]["role_name"] = role_name

            if description is not None:
                MOCK_ROLES[i]["description"] = description

            if body and body.permissions is not None:
                MOCK_ROLES[i]["permissions"] = body.permissions

            return MOCK_ROLES[i]

    raise HTTPException(status_code=404, detail="権限が見つかりません")

@app.delete("/api/admin/roles/{role_id}")
def delete_role(role_id: int):
    """権限削除（管理者のみ）"""
    global MOCK_ROLES

    role = next((r for r in MOCK_ROLES if r["role_id"] == role_id), None)
    if not role:
        raise HTTPException(status_code=404, detail="権限が見つかりません")

    # システムロールは削除不可
    if role["is_system"]:
        raise HTTPException(status_code=400, detail="システム定義の権限は削除できません")

    # この権限を使用しているユーザーがいないかチェック
    users_with_role = [u for u in MOCK_USERS if u["role"] == role["role_name"]]
    if users_with_role:
        raise HTTPException(
            status_code=400,
            detail=f"この権限は{len(users_with_role)}人のユーザーに割り当てられているため削除できません"
        )

    MOCK_ROLES = [r for r in MOCK_ROLES if r["role_id"] != role_id]
    return {"status": "deleted", "role_id": role_id}

@app.post("/api/admin/roles/delete-multiple")
def delete_multiple_roles(role_ids: List[int]):
    """権限一斉削除（管理者のみ）"""
    global MOCK_ROLES

    # システムロールが含まれていないかチェック
    system_roles = [r for r in MOCK_ROLES if r["role_id"] in role_ids and r["is_system"]]
    if system_roles:
        raise HTTPException(status_code=400, detail="システム定義の権限は削除できません")

    # 使用中の権限が含まれていないかチェック
    roles_to_delete = [r for r in MOCK_ROLES if r["role_id"] in role_ids]
    for role in roles_to_delete:
        users_with_role = [u for u in MOCK_USERS if u["role"] == role["role_name"]]
        if users_with_role:
            raise HTTPException(
                status_code=400,
                detail=f"権限「{role['role_name']}」は使用中のため削除できません"
            )

    MOCK_ROLES = [r for r in MOCK_ROLES if r["role_id"] not in role_ids]
    return {"status": "deleted", "role_ids": role_ids, "count": len(role_ids)}

@app.get("/api/health")
def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
