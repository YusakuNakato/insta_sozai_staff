# CLAUDE.md - StaffWorkTracker開発ドキュメント

## プロジェクト概要

**目的**: スタッフ稼働を日報形式で記録し、ディレクターが工数・品質・修正傾向を分析できるモバイルアプリの構築

**スコープ（Must機能のみ）**:
- 日報入力（タスク名、所要時間、品質5段階、修正回数）
- 役割別ログイン（スタッフ／ディレクター）
- 稼働状況一覧（フィルター付き）
- 分析ダッシュボード（スタッフ単位/タスク単位）
- ネイティブアプリ対応（React Native + Firebase）

## アーキテクチャ

### 技術スタック

- **フレームワーク**: React Native (Expo 54.x)
- **言語**: TypeScript 5.9.x
- **バックエンド**: Firebase (Auth + Firestore)
- **状態管理**: React Context + Hooks
- **ナビゲーション**: React Navigation 7.x
- **グラフ**: react-native-chart-kit
- **テスト**: Jest + React Native Testing Library

### ディレクトリ構造

```
src/
├── config/           # Firebase初期化
├── services/         # ビジネスロジック層
│   ├── auth.service.ts
│   ├── taskReport.service.ts
│   └── analytics.service.ts
├── components/       # UIコンポーネント
│   ├── Auth/
│   ├── TaskReport/
│   └── Analytics/
├── navigation/       # ナビゲーション設定
├── hooks/           # カスタムフック（useAuth）
└── types/           # TypeScript型定義
```

## データモデル

### Firestore Collections

**users**
```typescript
{
  id: string,
  name: string,
  role: "staff" | "director",
  email: string,
  passwordHash: string,  // Firebase Authが管理（空文字）
  createdAt: Timestamp
}
```

**taskReports**
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

## 主要コンポーネント

### 1. 認証フロー (src/services/auth.service.ts)

- `signIn()`: メール/パスワードでログイン
- `signUp()`: 新規ユーザー登録
- `signOut()`: ログアウト
- `getCurrentUser()`: 現在のユーザー情報取得

### 2. 日報管理 (src/services/taskReport.service.ts)

- `createTaskReport()`: 日報作成
- `getTaskReports()`: フィルター付き一覧取得
- `updateTaskReport()`: 日報更新
- `deleteTaskReport()`: 日報削除

### 3. 分析機能 (src/services/analytics.service.ts)

- `analyzeByStaff()`: スタッフ別集計
- `analyzeByTask()`: タスク別集計
- `calculateSummary()`: 全体サマリー計算

### 4. UI画面

- **LoginScreen**: メール/パスワード認証
- **TaskReportForm**: 日報入力フォーム
- **TaskReportList**: 稼働一覧表示
- **AnalyticsDashboard**: グラフ付き分析画面（ディレクター専用）

## 実装完了項目

✅ Phase 1: プロジェクトセットアップ
  - Expo + TypeScript初期化
  - 依存関係インストール（Firebase, Navigation, Charts）
  - ディレクトリ構造作成

✅ Phase 2: コア機能実装
  - 型定義（User, TaskReport, Analytics）
  - Firebase設定
  - 認証サービス（signIn/signUp/signOut）
  - TaskReportサービス（CRUD操作）
  - 分析サービス（集計ロジック）

✅ Phase 3: UI実装
  - ログイン/登録画面
  - 日報入力フォーム
  - 稼働一覧画面（Pull-to-Refresh対応）
  - 分析ダッシュボード（BarChart表示）

✅ Phase 4: ナビゲーション
  - タブナビゲーション（日報入力/稼働一覧/分析）
  - 認証状態に応じた画面切り替え
  - ディレクター専用タブの表示制御

✅ Phase 5: 品質保証
  - TypeScript型チェック（エラーゼロ）
  - Jest設定
  - ユニットテスト（analytics.service.test.ts）

## 未実装項目（今後の拡張）

⏳ **テスト**
- E2Eテスト（Detox）
- UIコンポーネントテスト
- テストカバレッジ80%達成

⏳ **CI/CD**
- GitHub Actions設定
- 自動テスト実行
- Expo EASビルド

⏳ **監視・運用**
- Sentry統合（エラートラッキング）
- Firebase Analytics（使用状況分析）
- パフォーマンス監視（P95 < 300ms）

⏳ **機能拡張**
- フィルター機能（日付範囲、スタッフ、タスク）
- 日報編集・削除機能
- エクスポート機能（CSV/PDF）
- プッシュ通知

## 開発ガイドライン

### コーディング規約

- **TypeScript**: strict modeを有効化
- **命名規則**:
  - コンポーネント: PascalCase
  - 関数/変数: camelCase
  - ファイル: kebab-case or PascalCase（コンポーネント）
- **Firestore**: snake_caseではなくcamelCaseを使用

### Git運用

- **ブランチ戦略**: feature/機能名
- **PR単位**: 機能ごと（入力→一覧→分析）
- **コミットメッセージ**: Conventional Commits形式推奨

### テスト戦略

- **ユニットテスト**: サービス層カバレッジ > 80%
- **統合テスト**: 主要ユーザーフロー
- **E2Eテスト**: ログイン→日報入力→分析表示

## Firebaseセキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /taskReports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## トラブルシューティング

### よくある問題

**1. Firebase接続エラー**
- `.env.local`ファイルにFirebase設定を追加
- `EXPO_PUBLIC_`プレフィックスが必要

**2. 型エラー**
- `npm run lint`で型チェック
- Firestoreの`Timestamp`型とJSの`Date`型の変換に注意

**3. ナビゲーションエラー**
- `react-native-screens`と`react-native-safe-area-context`が必要
- Expo Go使用時は自動インストール

## パフォーマンス要件

- **レスポンス時間**: P95 < 300ms
- **日報取得（100件）**: < 300ms
- **分析集計計算**: < 500ms

## 成功基準

- 5名テストで日報入力率80%以上
- TypeScript型エラーゼロ
- Firebase Auth安全な認証
- ディレクターが工数・品質傾向を可視化できる

## 次のステップ

1. E2Eテスト環境構築（Detox）
2. CI/CD パイプライン構築（GitHub Actions）
3. Sentry統合
4. フィルター機能実装
5. 日報編集・削除機能
6. 本番環境デプロイ（Expo EAS）

## ライセンス

MIT
