import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../environments/environment';

// Initialize Firebase
const app: FirebaseApp = initializeApp(environment.firebase);

// Initialize Firestore with the specific database ID
const db: Firestore = getFirestore(app, 'contentupload-db'); // ← SPECIFY DATABASE ID HERE

// Enable offline persistence (optional)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistence not available in this browser');
    }
});

const storage: FirebaseStorage = getStorage(app);

console.log('Firebase initialized - Project:', environment.firebase.projectId);
console.log('Firestore database: contentupload-db');
console.log('Firestore instance:', db);
console.log('Storage instance:', storage);

export { app, db, storage };
