import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { InvitedEmail, UserRole } from '../types';

/**
 * メールアドレスを招待リストに追加
 */
export async function inviteEmail(email: string, role: UserRole, invitedBy: string): Promise<void> {
  try {
    // すでに招待済みかチェック
    const existingInvite = await getInvitationByEmail(email);
    if (existingInvite) {
      throw new Error('このメールアドレスはすでに招待されています');
    }

    await addDoc(collection(db, 'invitedEmails'), {
      email: email.toLowerCase().trim(),
      role,
      invitedBy,
      createdAt: Timestamp.now(),
      used: false,
    });
  } catch (error) {
    console.error('Error inviting email:', error);
    throw error;
  }
}

/**
 * メールアドレスが招待済みかつ未使用かをチェック
 */
export async function checkEmailInvited(email: string): Promise<InvitedEmail | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const q = query(
      collection(db, 'invitedEmails'),
      where('email', '==', normalizedEmail),
      where('used', '==', false)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || Timestamp.now(),
    } as InvitedEmail;
  } catch (error) {
    console.error('Error checking email invitation:', error);
    return null;
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
