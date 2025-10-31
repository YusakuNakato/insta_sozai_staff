import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';
import { checkEmailInvited, markInvitationAsUsed } from './invitation.service';

/**
 * ユーザーログイン
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User; firebaseUser: FirebaseUser }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('ユーザー情報が見つかりません');
    }

    const userData = userDoc.data() as Omit<User, 'id'>;

    return {
      user: {
        id: firebaseUser.uid,
        ...userData,
      },
      firebaseUser,
    };
  } catch (error: any) {
    throw new Error(`ログインに失敗しました: ${error.message}`);
  }
};

/**
 * ユーザー登録（招待制）
 */
export const signUp = async (
  email: string,
  password: string,
  name: string,
  additionalInfo?: {
    actualJobTitle?: string;
    dailyAvailableHours?: number;
    workingHoursStart?: string;
    workingHoursEnd?: string;
  }
): Promise<{ user: User; firebaseUser: FirebaseUser }> => {
  try {
    console.log('Starting user registration for:', email);

    // 招待メールアドレスチェック
    const invitation = await checkEmailInvited(email);

    if (!invitation) {
      console.log('No invitation found for email:', email);
      throw new Error('このメールアドレスは招待されていません。管理者に招待を依頼してください。\n\n※開発者モードを有効にすると、招待なしで管理者アカウントを作成できます（タイトルを5回タップ）。');
    }

    console.log('Invitation found, proceeding with user creation');

    // Firebase Authでユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Firestoreにユーザー情報を保存（招待時のroleを使用）
    const userData: Omit<User, 'id'> = {
      name,
      role: invitation.role, // 招待時に指定されたroleを使用
      email,
      passwordHash: '', // Firebase Authが管理するため空文字
      createdAt: Timestamp.now(),
      // 追加情報
      actualJobTitle: additionalInfo?.actualJobTitle,
      dailyAvailableHours: additionalInfo?.dailyAvailableHours,
      workingHoursStart: additionalInfo?.workingHoursStart,
      workingHoursEnd: additionalInfo?.workingHoursEnd,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    console.log('User document created in Firestore');

    // 招待を使用済みにマーク
    await markInvitationAsUsed(invitation.id, firebaseUser.uid);
    console.log('Invitation marked as used');

    return {
      user: {
        id: firebaseUser.uid,
        ...userData,
      },
      firebaseUser,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);

    // Firestoreのパーミッションエラーの詳細を表示
    if (error.message.includes('permission') || error.message.includes('Missing or insufficient permissions')) {
      throw new Error('Firestoreのアクセス権限エラー: セキュリティルールを確認してください。\n\n詳細: invitedEmailsコレクションへの読み取り権限が必要です。');
    }

    throw new Error(`ユーザー登録に失敗しました: ${error.message}`);
  }
};

/**
 * 管理者として登録（開発者モード用）
 */
export const signUpAsAdmin = async (
  email: string,
  password: string,
  name: string,
  additionalInfo?: {
    actualJobTitle?: string;
    dailyAvailableHours?: number;
    workingHoursStart?: string;
    workingHoursEnd?: string;
  }
): Promise<{ user: User; firebaseUser: FirebaseUser }> => {
  try {
    // Firebase Authでユーザー作成（招待チェックなし）
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Firestoreにユーザー情報を保存（管理者として）
    const userData: Omit<User, 'id'> = {
      name,
      role: 'admin', // 管理者として登録
      email,
      passwordHash: '', // Firebase Authが管理するため空文字
      createdAt: Timestamp.now(),
      // 追加情報
      actualJobTitle: additionalInfo?.actualJobTitle,
      dailyAvailableHours: additionalInfo?.dailyAvailableHours,
      workingHoursStart: additionalInfo?.workingHoursStart,
      workingHoursEnd: additionalInfo?.workingHoursEnd,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    return {
      user: {
        id: firebaseUser.uid,
        ...userData,
      },
      firebaseUser,
    };
  } catch (error: any) {
    throw new Error(`管理者登録に失敗しました: ${error.message}`);
  }
};

/**
 * ログアウト
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(`ログアウトに失敗しました: ${error.message}`);
  }
};

/**
 * 認証状態の監視
 */
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data() as Omit<User, 'id'>;

    return {
      id: firebaseUser.uid,
      ...userData,
    };
  } catch (error: any) {
    throw new Error(`ユーザー情報の取得に失敗しました: ${error.message}`);
  }
};
