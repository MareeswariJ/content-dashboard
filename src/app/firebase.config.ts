import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../environments/environment';

// Initialize Firebase
const app: FirebaseApp = initializeApp(environment.firebase);

// Initialize Firestore - using default configuration for faster operations
const db: Firestore = getFirestore(app);

const storage: FirebaseStorage = getStorage(app);

console.log('Firebase initialized - Project:', environment.firebase.projectId);

export { app, db, storage };
