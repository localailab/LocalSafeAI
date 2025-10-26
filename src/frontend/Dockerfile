FROM node:20-alpine

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package.json ./
RUN npm install

# アプリケーションコードをコピー
COPY . .

# 環境変数を設定
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# ポート公開
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]
