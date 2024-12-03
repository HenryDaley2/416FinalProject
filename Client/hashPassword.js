// Import required Firebase modules
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// Import Node.js crypto library
import crypto from "crypto";

// Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaWJA7KSIetAyf_C16EDL5wfvJ6kYlAF0",
    authDomain: "cs416-44189.firebaseapp.com",
    projectId: "cs416-44189",
    storageBucket: "cs416-44189.firebasestorage.app",
    messagingSenderId: "38755271302",
    appId: "1:38755271302:web:244c2f4b56fb4ae2488707",
    measurementId: "G-X4P4FGF0J3"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Authentication

// Function to hash passwords
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex"); // Generate a random salt
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex"); // Hash the password with the salt
  return { salt, hashedPassword };
}

// Log in and store the hashed password in Firestore
signInWithEmailAndPassword(auth, "kamerondear@outlook.com", "Kamdear15")
  .then(async (userCredential) => {
    console.log("Logged in as:", userCredential.user.email);

    // Hash the password you want to store
    const { salt, hashedPassword } = hashPassword("mySecurePassword123");

    

    // Store the salt and hashed password in Firestore
    await addDoc(collection(db, "users"), {
      salt: salt,
      password: hashedPassword
    });

    console.log("Password stored successfully");
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
