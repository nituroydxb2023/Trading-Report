import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocFromServer 
} from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { OperationType, FirestoreErrorInfo } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error handler
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

// Auth helpers
export const login = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore helpers
export const getTrades = (callback: (trades: any[], changes?: any[]) => void) => {
  const q = query(collection(db, 'trades'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const trades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const changes = snapshot.docChanges().map(change => ({
      type: change.type,
      doc: { id: change.doc.id, ...change.doc.data() }
    }));
    callback(trades, changes);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'trades');
  });
};

export const getProfile = (profileId: string, callback: (profile: any) => void) => {
  return onSnapshot(doc(db, 'profiles', profileId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `profiles/${profileId}`);
  });
};

export const addTrade = async (trade: any) => {
  try {
    await addDoc(collection(db, 'trades'), trade);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'trades');
  }
};

export const updateTrade = async (id: string, trade: any) => {
  try {
    await updateDoc(doc(db, 'trades', id), trade);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `trades/${id}`);
  }
};

export const deleteTrade = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'trades', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trades/${id}`);
  }
};

export const updateProfile = async (id: string, profile: any) => {
  try {
    await setDoc(doc(db, 'profiles', id), profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${id}`);
  }
};
