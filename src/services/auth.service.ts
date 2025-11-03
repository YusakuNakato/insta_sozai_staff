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
      // Firestoreにユーザー情報が存在しない場合、自動的に作成
      console.warn('User document not found, creating new one');
      const newUserData: Omit<User, 'id'> = {
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ユーザー',
        role: 'staff', // デフォルトでスタッフ
        email: firebaseUser.email || '',
        passwordHash: '',
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);

      return {
        user: {
          id: firebaseUser.uid,
          ...newUserData,
        },
        firebaseUser,
      };
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
    console.error('Sign in error:', error);

    // Firebaseエラーコードを日本語化
    let errorMessage = 'ログインに失敗しました';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'このメールアドレスは登録されていません。新規登録してください。';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'パスワードが間違っています。';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'メールアドレスの形式が正しくありません。';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'このアカウントは無効化されています。管理者にお問い合わせください。';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'メールアドレスまたはパスワードが間違っています。';
    } else if (error.message) {
      errorMessage = `ログインに失敗しました: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
};

/**
 * ユーザー登録（誰でも登録可能）
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

    // Firebase Authでユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Firestoreにユーザー情報を保存（デフォルトでスタッフ）
    const userData: Omit<User, 'id'> = {
      name,
      role: 'staff', // デフォルトでスタッフとして登録
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

    return {
      user: {
        id: firebaseUser.uid,
        ...userData,
      },
      firebaseUser,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);

    // Firebaseエラーコードを日本語化
    let errorMessage = 'ユーザー登録に失敗しました';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'このメールアドレスは既に登録されています。ログイン画面からログインしてください。';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'メールアドレスの形式が正しくありません。';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'メール/パスワード認証が有効になっていません。管理者にお問い合わせください。';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'パスワードが弱すぎます。もっと強力なパスワードを設定してください。';
    } else if (error.message) {
      errorMessage = `ユーザー登録に失敗しました: ${error.message}`;
    }

    throw new Error(errorMessage);
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
    console.error('Admin sign up error:', error);

    // Firebaseエラーコードを日本語化
    let errorMessage = '管理者登録に失敗しました';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'このメールアドレスは既に登録されています。ログイン画面からログインしてください。';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'メールアドレスの形式が正しくありません。';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'メール/パスワード認証が有効になっていません。管理者にお問い合わせください。';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'パスワードが弱すぎます。もっと強力なパスワードを設定してください。';
    } else if (error.message) {
      errorMessage = `管理者登録に失敗しました: ${error.message}`;
    }

    throw new Error(errorMessage);
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
