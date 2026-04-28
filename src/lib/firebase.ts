import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const authInstance = getAuth(app);
// Ensure persistence is set to LOCAL explicitly to remember auth across pages/iframes
setPersistence(authInstance, browserLocalPersistence).catch(console.error);
export const auth = authInstance;

