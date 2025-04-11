
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // These are placeholder values. You should replace them with your actual Firebase project configuration.
  apiKey: "AIzaSyByNDDxXK_plHoZUHVGT6HQQTuMti1rckc", 
  authDomain: "plcwebapp.firebaseapp.com",
  databaseURL: "https://plcwebapp-default-rtdb.firebaseio.com",
  projectId: "plcwebapp",
  storageBucket: "plcwebapp.firebasestorage.app",
  messagingSenderId: "424899404299",
  appId: "1:424899404299:web:640112c4531b145674dd0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export { app, database };
