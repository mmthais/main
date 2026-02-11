// 1) Crie um projeto no Firebase
// 2) Em Authentication -> Sign-in method, habilite "Google"
// 3) Em Firestore Database -> crie o banco (modo produção ou teste)
// 4) Em Project settings -> pegue as chaves e cole aqui
// 5) Em Authentication -> Settings -> Authorized domains,
//    adicione seu domínio do GitHub Pages (ex: seuusuario.github.io) e/ou seu domínio custom.
// 6) Regras sugeridas (Firestore) estão no README.md

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATm-VZArjMfEs1d6JmmuUM8a7a45HXLJg",
  authDomain: "checklist-a150c.firebaseapp.com",
  projectId: "checklist-a150c",
  storageBucket: "checklist-a150c.firebasestorage.app",
  messagingSenderId: "700616349614",
  appId: "1:700616349614:web:5c815f9ac91403c7cf5a3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
