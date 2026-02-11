import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export function watchUser(callback) {
  return onAuthStateChanged(auth, (user) => callback(user || null));
}

export async function loginWithGoogle() {
  await signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
}

export function watchDisciplinas(uid, callback) {
  const colRef = collection(db, "users", uid, "disciplinas");
  const q = query(colRef);
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => d.data()).sort((a,b) => (a.id||0) - (b.id||0));
    callback(list);
  });
}

export async function upsertDisciplina(uid, disciplina) {
  const ref = doc(db, "users", uid, "disciplinas", String(disciplina.id));
  await setDoc(ref, disciplina, { merge: true });
}

export async function removeDisciplina(uid, id) {
  const ref = doc(db, "users", uid, "disciplinas", String(id));
  await deleteDoc(ref);
}

export async function replaceAll(uid, disciplinas) {
  // Estratégia simples: upsert de tudo e remoção do que sobrar é opcional.
  // Para "Limpar Tudo", chame removeDisciplina em loop.
  await Promise.all(disciplinas.map(d => upsertDisciplina(uid, d)));
}
