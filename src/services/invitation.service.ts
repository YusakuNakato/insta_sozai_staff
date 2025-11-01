import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { InvitedEmail, UserRole } from '../types';

/**
 * メールアドレスを招待リストに追加
 */
export async function inviteEmail(email: string, role: UserRole, invitedBy: string): Promise<void> {
  try {
    console.log('招待処理開始 - Email:', email, 'Role:', role, 'InvitedBy:', invitedBy);

    // すでに招待済みかチェック
    const existingInvite = await getInvitationByEmail(email);
    if (existingInvite) {
      console.log('既に招待済み:', existingInvite);
      throw new Error('このメールアドレスはすでに招待されています');
    }

    const inviteData = {
      email: email.toLowerCase().trim(),
      role,
      invitedBy,
      createdAt: Timestamp.now(),
      used: false,
    };

    console.log('Firestoreに招待データを保存:', inviteData);
    const docRef = await addDoc(collection(db, 'invitedEmails'), inviteData);
    console.log('招待データ保存成功 - Document ID:', docRef.id);
  } catch (error: any) {
    console.error('Error inviting email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * メールアドレスが招待済みかつ未使用かをチェック
 */
export async function checkEmailInvited(email: string): Promise<InvitedEmail | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Checking invitation for email:', normalizedEmail);

    const q = query(
      collection(db, 'invitedEmails'),
      where('email', '==', normalizedEmail),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);
    console.log('Invitation query result:', snapshot.empty ? 'No invitations found' : `Found ${snapshot.size} invitation(s)`);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const invitation = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || Timestamp.now(),
    } as InvitedEmail;

    console.log('Found invitation:', invitation);
    return invitation;
  } catch (error) {
    console.error('Error checking email invitation:', error);
    // Firestoreのパーミッションエラーの場合は、より詳細なメッセージを表示
    if (error instanceof Error && error.message.includes('permission')) {
      console.error('Firestore permission error. Please check security rules for invitedEmails collection.');
    }
    throw error; // エラーを再スローして呼び出し側で処理できるようにする
  }
}

/**
 * メールアドレスの招待情報を取得（使用済み含む）
 */
async function getInvitationByEmail(email: string): Promise<InvitedEmail | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const q = query(
      collection(db, 'invitedEmails'),
      where('email', '==', normalizedEmail)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0];
    return {
      id: docData.id,
      ...docData.data(),
      createdAt: docData.data().createdAt || Timestamp.now(),
    } as InvitedEmail;
  } catch (error) {
    console.error('Error getting invitation:', error);
    return null;
  }
}

/**
 * 招待を使用済みにマーク
 */
export async function markInvitationAsUsed(invitationId: string, userId: string): Promise<void> {
  try {
    const invitationRef = doc(db, 'invitedEmails', invitationId);
    await updateDoc(invitationRef, {
      used: true,
      usedBy: userId,
      usedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking invitation as used:', error);
    throw error;
  }
}

/**
 * すべての招待を取得（ディレクター用）
 */
export async function getAllInvitations(): Promise<InvitedEmail[]> {
  try {
    const q = query(collection(db, 'invitedEmails'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || Timestamp.now(),
    })) as InvitedEmail[];
  } catch (error) {
    console.error('Error getting all invitations:', error);
    return [];
  }
}
