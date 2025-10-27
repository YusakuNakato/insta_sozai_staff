import { collection, query, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

/**
 * 全ユーザーを取得
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * ユーザーを削除
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    // ユーザー情報を削除
    await deleteDoc(doc(db, 'users', userId));

    // Note: Firebase Authenticationからのユーザー削除は管理者SDKが必要
    // クライアントサイドからは削除できないため、Cloud Functionsで実装することを推奨
    console.log('User deleted from Firestore:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * ユーザー情報を取得
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * ユーザー情報を更新
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'passwordHash'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}
