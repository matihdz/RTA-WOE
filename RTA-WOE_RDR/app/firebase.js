import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB310RhlDsiWAQOyWR9lQQrj15efN0i9o4",
  authDomain: "virtual-classroom-simulator.firebaseapp.com",
  projectId: "virtual-classroom-simulator",
  storageBucket: "virtual-classroom-simulator.appspot.com",
  messagingSenderId: "701093061485",
  appId: "1:701093061485:web:8975686624e27234cc3064"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
