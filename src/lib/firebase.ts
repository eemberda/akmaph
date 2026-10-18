import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, StudentProfileData, ActivityData, StudentSubmissionData, InteractionMessage, CoachChatMessage } from '../types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error context reporting required by Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Directive: Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

// Connection test on boot as mandated
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection notice: Client appears offline or pending rule initialization.");
    }
  }
}
testConnection();

// --- Firestore Data Operations ---

// Users
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const clean = sanitizePayload(profile);
    await setDoc(doc(db, 'users', profile.uid), clean, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Student Profile Details
export async function getStudentProfileDetails(studentId: string): Promise<StudentProfileData | null> {
  const path = `users/${studentId}/profile/details`;
  try {
    const snap = await getDoc(doc(db, 'users', studentId, 'profile', 'details'));
    if (snap.exists()) {
      return snap.data() as StudentProfileData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function saveStudentProfileDetails(studentId: string, details: Partial<StudentProfileData>): Promise<void> {
  const path = `users/${studentId}/profile/details`;
  try {
    const clean = sanitizePayload({
      ...details,
      studentId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'users', studentId, 'profile', 'details'), clean, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Activities
export async function saveActivity(activity: ActivityData): Promise<void> {
  const path = `activities/${activity.id}`;
  try {
    const clean = sanitizePayload(activity);
    await setDoc(doc(db, 'activities', activity.id), clean, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getEducatorActivities(educatorId: string): Promise<ActivityData[]> {
  const path = 'activities';
  try {
    const q = query(
      collection(db, 'activities'),
      where('educatorId', '==', educatorId)
    );
    const snap = await getDocs(q);
    const list: ActivityData[] = [];
    snap.forEach((d) => list.push(d.data() as ActivityData));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function getActivityById(activityId: string): Promise<ActivityData | null> {
  const path = `activities/${activityId}`;
  try {
    const snap = await getDoc(doc(db, 'activities', activityId));
    if (snap.exists()) {
      return snap.data() as ActivityData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function getActivityByJoinCode(code: string): Promise<ActivityData | null> {
  const path = 'activities';
  try {
    const q = query(collection(db, 'activities'), where('joinCode', '==', code.trim().toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as ActivityData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

// Activity Interactions (Educator multi-turn brainstorming)
export async function saveActivityInteraction(activityId: string, msg: InteractionMessage): Promise<void> {
  const path = `activities/${activityId}/interactions/${msg.id}`;
  try {
    const clean = sanitizePayload(msg);
    await setDoc(doc(db, 'activities', activityId, 'interactions', msg.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getActivityInteractions(activityId: string): Promise<InteractionMessage[]> {
  const path = `activities/${activityId}/interactions`;
  try {
    const snap = await getDocs(collection(db, 'activities', activityId, 'interactions'));
    const list: InteractionMessage[] = [];
    snap.forEach((d) => list.push(d.data() as InteractionMessage));
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Submissions
export async function saveStudentSubmission(submission: StudentSubmissionData): Promise<void> {
  const path = `activities/${submission.activityId}/submissions/${submission.studentId}`;
  try {
    const clean = sanitizePayload(submission);
    await setDoc(doc(db, 'activities', submission.activityId, 'submissions', submission.studentId), clean, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getStudentSubmission(activityId: string, studentId: string): Promise<StudentSubmissionData | null> {
  const path = `activities/${activityId}/submissions/${studentId}`;
  try {
    const snap = await getDoc(doc(db, 'activities', activityId, 'submissions', studentId));
    if (snap.exists()) {
      return snap.data() as StudentSubmissionData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function getActivitySubmissions(activityId: string): Promise<StudentSubmissionData[]> {
  const path = `activities/${activityId}/submissions`;
  try {
    const snap = await getDocs(collection(db, 'activities', activityId, 'submissions'));
    const list: StudentSubmissionData[] = [];
    snap.forEach((d) => list.push(d.data() as StudentSubmissionData));
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Student Coach Chats
export async function saveCoachChat(activityId: string, studentId: string, msg: CoachChatMessage): Promise<void> {
  const path = `activities/${activityId}/submissions/${studentId}/coach_chats/${msg.id}`;
  try {
    const clean = sanitizePayload(msg);
    await setDoc(doc(db, 'activities', activityId, 'submissions', studentId, 'coach_chats', msg.id), clean);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getCoachChats(activityId: string, studentId: string): Promise<CoachChatMessage[]> {
  const path = `activities/${activityId}/submissions/${studentId}/coach_chats`;
  try {
    const snap = await getDocs(collection(db, 'activities', activityId, 'submissions', studentId, 'coach_chats'));
    const list: CoachChatMessage[] = [];
    snap.forEach((d) => list.push(d.data() as CoachChatMessage));
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}
