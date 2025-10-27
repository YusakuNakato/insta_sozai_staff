import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TaskReport, TaskReportInput, FilterOptions } from '../types';

const COLLECTION_NAME = 'taskReports';

/**
 * 日報作成
 */
export const createTaskReport = async (
  userId: string,
  input: TaskReportInput
): Promise<TaskReport> => {
  const now = Timestamp.now();
  const reportData = {
    userId,
    date: new Date(),
    tasks: input.tasks,
    learnings: input.learnings,
    ownResearchHours: input.ownResearchHours,
    ownResearchLearnings: input.ownResearchLearnings,
    competitorResearchHours: input.competitorResearchHours,
    competitorResearchLearnings: input.competitorResearchLearnings,
    createdAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), reportData);

    return {
      ...reportData,
      id: docRef.id,
    };
  } catch (error: any) {
    throw new Error(`日報の作成に失敗しました: ${error.message}`);
  }
};

/**
 * 日報更新
 */
export const updateTaskReport = async (
  reportId: string,
  input: Partial<TaskReportInput>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await updateDoc(docRef, {
      ...input,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(`日報の更新に失敗しました: ${error.message}`);
  }
};

/**
 * 日報削除
 */
export const deleteTaskReport = async (reportId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    await deleteDoc(docRef);
  } catch (error: any) {
    throw new Error(`日報の削除に失敗しました: ${error.message}`);
  }
};

/**
 * 日報取得（単体）
 */
export const getTaskReport = async (reportId: string): Promise<TaskReport | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, reportId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TaskReport;
  } catch (error: any) {
    throw new Error(`日報の取得に失敗しました: ${error.message}`);
  }
};

/**
 * 日報一覧取得（フィルター付き）
 */
export const getTaskReports = async (
  filters?: FilterOptions
): Promise<TaskReport[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    // フィルター条件を追加
    if (filters?.staffId) {
      constraints.push(where('userId', '==', filters.staffId));
    }

    if (filters?.taskName) {
      constraints.push(where('taskName', '==', filters.taskName));
    }

    if (filters?.startDate) {
      constraints.push(where('date', '>=', filters.startDate));
    }

    if (filters?.endDate) {
      constraints.push(where('date', '<=', filters.endDate));
    }

    // 日付の降順でソート
    constraints.push(orderBy('date', 'desc'));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TaskReport[];
  } catch (error: any) {
    throw new Error(`日報一覧の取得に失敗しました: ${error.message}`);
  }
};

/**
 * ユーザーの日報一覧取得
 */
export const getUserTaskReports = async (userId: string): Promise<TaskReport[]> => {
  return getTaskReports({ staffId: userId });
};

/**
 * 期間内の日報一覧取得
 */
export const getTaskReportsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<TaskReport[]> => {
  return getTaskReports({ startDate, endDate });
};
