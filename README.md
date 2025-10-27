# StaffWorkTracker

スタッフ稼働を日報形式で記録し、ディレクターが工数・品質・修正傾向を分析できるモバイルアプリ

## 概要

StaffWorkTrackerは、チームメンバーが日々のタスク稼働を記録し、ディレクターがプロジェクトの工数・品質・修正回数を可視化できるReact Nativeアプリケーションです。

## 主な機能

### 基本機能
- **日報入力**: タスク名、所要時間、品質スコア（1-5段階）、修正回数を記録
- **役割別ログイン**: スタッフ／ディレクターで異なる権限
- **稼働状況一覧**: フィルター付きで日報を表示
- **分析ダッシュボード**: スタッフ単位/タスク単位での集計とグラフ表示
- **セキュアな認証**: Firebase Authenticationによる安全なログイン

### 🆕 Instagram運用チーム向けAI機能（ディレクター専用）

#### 基本機能（📸 Instagram分析）
- **📊 スタッフパフォーマンス可視化**
  - 1日あたりの稼働時間、月間納品数、平均制作時間を一覧表示
  - 平均クオリティスコア（1-5段階）とスキル天井（最大キャパシティ）を可視化
  - 各スタッフの得意分野と生産効率を表示

- **🤖 AIタスク配分シミュレーター**
  - 3つの配分戦略（バランス型、品質重視、スピード重視）から選択可能
  - 目標タスク数を入力すると、最適なスタッフ配分を自動計算
  - チーム全体の予測稼働率、予測品質、予測納品数を表示
  - 各スタッフへの推奨タスク数と推奨理由を提示
  - リスクと改善提案を自動生成

#### 🆕 拡張機能（🤖 Instagram AI分析）
**1️⃣ チーム全体サマリー（Glass風KPIカード）**
- 合計稼働時間、平均クオリティ、総納品数、理論上限納品数を表示
- Glass morphism デザインで視覚的にリッチな表現

**2️⃣ 個人パフォーマンス可視化ゾーン**
- **レーダーチャート**: スピード・品質・安定度・効率の4軸評価
- **実績 vs 理論上限 棒グラフ**: 各スタッフの潜在能力を可視化
- **散布図**: 制作時間と品質の関係性、点サイズで納品数を表現

**3️⃣ 日次・月次トレンド分析ゾーン**
- **折れ線グラフ**: チーム全体の日別稼働時間推移（30日分）
- **ヒートマップ**: スタッフ別×日付別の稼働状況を色で表現
- **月次統計サマリー**: 総稼働時間、平均/日、稼働日数、稼働率

**4️⃣ AIタスク配分シミュレーター（高度版）**
- **スライダー入力**: 50〜300件の総案件数を設定可能
- **リアルタイム再計算**: タスク数変更で即座に推奨配分を更新
- **疲労補正アルゴリズム**:
  ```
  potential = (monthlyHours / avgTime) * efficiency
  qualityFactor = avgQuality / 5
  fatigueFactor = 1 - fatigueIndex
  score = potential * qualityFactor * fatigueFactor
  recommendedTasks = (score / totalScore) * totalTasks
  ```
- **テーブル表示**: スタッフ別推奨件数・稼働率・品質補正
- **コメント生成**: 各スタッフへの個別推奨理由（稼働率ベース）

**5️⃣ スタッフ詳細モーダル**
- タップで詳細情報をモーダル表示
- 基本パフォーマンス指標（6項目）
- パフォーマンスレーダー（4軸バー表示）
- 得意分野バッジ
- 直近30日の稼働推移グラフ

## 技術スタック

- **フレームワーク**: React Native (Expo)
- **言語**: TypeScript
- **バックエンド**: Firebase (Authentication + Firestore)
- **ナビゲーション**: React Navigation
- **グラフ**: react-native-chart-kit
- **テスト**: Jest
- **監視**: Sentry（予定）

## セットアップ

### 必要な環境

- Node.js 18.x以上
- npm または yarn
- Expo CLI（自動インストール）

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
# 1. .env.local.exampleファイルを.env.localにコピー
cp .env.local.example .env.local

# 2. .env.localファイルを編集して、実際のFirebase設定値を入力
# EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
# EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
# EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
# EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
# EXPO_PUBLIC_SETTINGS_PASSWORD=your-settings-password
# EXPO_PUBLIC_DIRECTOR_PASSWORD=your-director-password
```

> **注意**: `.env.local`ファイルには機密情報が含まれるため、公開リポジトリにコミットしないでください。このファイルは`.gitignore`に含まれています。

### 起動

```bash
# 開発サーバー起動
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android

# Web版（Instagram分析ダッシュボードを使用する場合はこちら推奨）
npm run web
```

### Instagram分析ダッシュボードの使用方法

#### 基本版（📸 Instagram分析）
1. アプリを起動（Web版推奨）
2. ディレクターアカウントでログイン
3. サイドメニューから「📸 Instagram分析（旧）」を選択
4. スタッフパフォーマンスを確認
5. タスク配分シミュレーターで戦略を選択し、目標タスク数を入力
6. AI推奨結果を確認して、最適な配分を実施

#### 拡張版（📊 ダッシュボード）**推奨**
1. サイドメニューから「📊 ダッシュボード」を選択
2. **実際の日報データから自動集計**されたチーム全体サマリーで現状を把握
3. パフォーマンスチャート（レーダー・散布図・比較棒グラフ）で各スタッフの特性を確認
4. トレンド分析で稼働推移とヒートマップを確認
5. AIシミュレーターで総案件数を設定（50〜300件）
6. リアルタイムで算出される推奨配分を確認
7. スタッフ名をタップして詳細モーダルで深掘り分析
8. 最適なタスク配分を実施

**データの流れ:**
```
1. スタッフがログイン
   → ログインユーザー（田中太郎、佐藤花子等）= スタッフ

2. スタッフが日報入力
   → タスク情報を記録
   - アカウント名: さきAI、たくむAIお兄さん等（作業対象）
   - タスク名: 動画編集、画像加工等
   - 時間、タスクタイプ（新規/修正）

3. ディレクターが評価
   → 品質スコア、修正工数等を入力

4. ダッシュボードで可視化
   → スタッフ単位で実際の日報データから自動集計
   - スタッフ名: 田中太郎、佐藤花子等（ログインユーザー）
   - 得意分野: 新規制作、動画編集等（頻出タスク）
   - 稼働時間、納品数、品質スコア: 実データから計算
```

**重要な区別:**
- **スタッフ** = ログインする人（田中太郎、佐藤花子等）→ ダッシュボードで分析
- **アカウント名** = 作業対象（さきAI、たくむAIお兄さん等）→ タスク内の情報

**データ構造:**
```typescript
{
  dailyHours: number[];           // 30日分の日次稼働時間配列
  monthlyHoursAvailable: number;  // 月間稼働可能時間
  avgWorkTimePerItem: number;     // 平均制作時間
  avgQuality: number;             // 平均クオリティ（1-5）
  potentialMaxItems: number;      // 理論上限納品数
  efficiency: number;             // 稼働効率係数（0-1）
  fatigueIndex: number;           // 疲労指数（0-1）
  speed: number;                  // スピード指標（0-100）
  quality: number;                // 品質指標（0-100）
  stability: number;              // 安定度指標（0-100）
  efficiencyScore: number;        // 効率指標（0-100）
}
```

## プロジェクト構造

```
StaffWorkTracker/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase初期化
│   ├── services/
│   │   ├── auth.service.ts              # 認証ロジック
│   │   ├── taskReport.service.ts        # CRUD操作
│   │   ├── analytics.service.ts         # 分析ロジック
│   │   └── instagramPerformance.service.ts  # 🆕 Instagram AI分析
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── TaskReport/
│   │   │   ├── TaskReportForm.tsx
│   │   │   └── TaskReportList.tsx
│   │   ├── Analytics/
│   │   │   └── AnalyticsDashboard.tsx
│   │   └── Instagram/                   # 🆕 Instagram運用分析
│   │       └── InstagramDashboard.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── hooks/
│   │   └── useAuth.tsx
│   └── types/
│       └── index.ts
├── __tests__/
│   └── unit/
├── App.tsx
└── package.json
```

## データモデル

### User
```typescript
{
  id: string,
  name: string,
  role: "staff" | "director",
  email: string,
  createdAt: Timestamp
}
```

### TaskReport
```typescript
{
  id: string,
  userId: string,
  date: Date,
  taskName: string,
  durationHrs: number,
  qualityScore: number,     // 1〜5段階
  fixCount: number,         // 修正回数
  createdAt: Timestamp
}
```

## 開発コマンド

```bash
# テスト実行
npm test

# テストカバレッジ
npm run test:coverage

# TypeScript型チェック
npm run lint
```

## Firebase セットアップ手順

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authenticationを有効化（Email/Password認証）
3. Firestoreを有効化
4. Webアプリを追加し、設定情報を`.env.local`に記載

### Firestoreセキュリティルール（例）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のドキュメントのみ読み書き可能
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 日報は自分のものだけ作成可能、ディレクターは全て読める
    match /taskReports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 品質ゲート

- ユニットテストカバレッジ > 50%
- TypeScript型エラーゼロ
- Firebase Authによる安全な認証

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずIssueを開いて変更内容を議論してください。
