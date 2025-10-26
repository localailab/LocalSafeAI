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

# ============================================
# モックデータ（学校関連）
# ============================================

MOCK_USERS = {
    "teacher": {
        "user_id": 1,
        "username": "teacher",
        "password": "teacher123",  # 本番ではハッシュ化必須
        "role": "admin"
    },
    "staff": {
        "user_id": 2,
        "username": "staff",
        "password": "staff123",
        "role": "user"
    }
}

MOCK_CATEGORIES = [
    {"category_id": 1, "category_name": "カリキュラム", "description": "授業計画・指導案関連"},
    {"category_id": 2, "category_name": "生徒指導", "description": "生徒指導・教育相談関連"},
    {"category_id": 3, "category_name": "法律", "description": "教育法規・規則関連"},
    {"category_id": 4, "category_name": "評価", "description": "学習評価・成績処理関連"},
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
    user = MOCK_USERS.get(request.username)

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
    if request.username in MOCK_USERS:
        raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています")

    new_user_id = len(MOCK_USERS) + 1

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
