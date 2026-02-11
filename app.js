import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* =============================
   Estado + utilidades
============================= */
const LOCAL_KEY = "disciplinas_local_cache_v1";
let disciplinas = loadLocal();
let uid = null;
let unsubscribeSnapshot = null;

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(disciplinas));
}

function byId(a, b) {
  return (a.id || 0) - (b.id || 0);
}

/* =============================
   Destaque Aula ao vivo (<=24h)
============================= */
function parseDateTimeLocal(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getAulaStatus(value) {
  const d = parseDateTimeLocal(value);
  if (!d) return { isSoon: false, isToday: false, text: "" };

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs <= 0) return { isSoon: false, isToday: false, text: "" };

  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours <= 24) {
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    return { isSoon: true, isToday, text: isToday ? "📣 Hoje" : "📣 Em até 24h" };
  }
  return { isSoon: false, isToday: false, text: "" };
}

/* =============================
   Firebase (Auth + Firestore)
============================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (sel) => document.querySelector(sel);

function setAuthUI(isSignedIn, userEmail = "") {
  const pill = $("#authPill");
  const loginBtn = $("#btnLogin");
  const logoutBtn = $("#btnLogout");
  const hint = $("#cloudHint");

  if (!pill || !loginBtn || !logoutBtn || !hint) return;

  if (isSignedIn) {
    pill.innerHTML = `☁️ Nuvem: <strong>Conectada</strong> <span class="small">(${escapeHtml(userEmail || "Google")})</span>`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-flex";
    hint.textContent = "Salvando automaticamente no Firestore (nuvem).";
  } else {
    pill.innerHTML = `💾 Local: <strong>Ativo</strong> <span class="small">(faça login p/ salvar na nuvem)</span>`;
    loginBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";
    hint.textContent = "Sem login: salvando apenas no seu navegador (localStorage).";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function cloudUpsert(obj) {
  if (!uid) return;
  const ref = doc(db, "users", uid, "disciplinas", String(obj.id));
  await setDoc(ref, obj, { merge: false });
}

async function cloudDelete(id) {
  if (!uid) return;
  const ref = doc(db, "users", uid, "disciplinas", String(id));
  await deleteDoc(ref);
}

function startCloudListener() {
  if (!uid) return;

  if (unsubscribeSnapshot) unsubscribeSnapshot();

  const colRef = collection(db, "users", uid, "disciplinas");
  unsubscribeSnapshot = onSnapshot(
    colRef,
    (snap) => {
      disciplinas = snap.docs.map((d) => d.data()).sort(byId);
      saveLocal(); // cache local
      renderizar();
    },
    (err) => {
      console.error("Firestore snapshot error:", err);
      renderizar();
    }
  );
}

async function migrateLocalToCloudIfNeeded() {
  if (!uid) return;

  const colRef = collection(db, "users", uid, "disciplinas");
  const snap = await getDocs(colRef);

  const cloudCount = snap.size;
  const local = loadLocal().sort(byId);

  if (cloudCount === 0 && local.length > 0) {
    for (const item of local) {
      await cloudUpsert(item);
    }
  }
}

/* =============================
   UI handlers (globais)
============================= */
window.loginGoogle = async function loginGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    alert(
      "Não consegui abrir o login do Google.\n\n" +
        "Causas comuns:\n" +
        "• Domínio não autorizado no Firebase (Authorized domains)\n" +
        "• Bloqueio de pop-up no navegador\n\n" +
        "Abra F12 → Console para ver o erro exato."
    );
  }
};

window.logoutGoogle = async function logoutGoogle() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
};

window.adicionarDisciplina = async function adicionarDisciplina() {
  const novaDisciplina = {
    id: Date.now(),
    nome: "",
    professor: "",
    videoBoasVindas: false,
    planoEnsino: false,
    aulaAoVivo1: "",
    aulaAoVivo2: "",
    plantaoSemanal: ""
  };

  if (uid) {
    await cloudUpsert(novaDisciplina);
  } else {
    disciplinas.push(novaDisciplina);
    saveLocal();
    renderizar();
  }
};

window.deletarDisciplina = async function deletarDisciplina(id) {
  if (!confirm("Tem certeza que deseja deletar esta disciplina?")) return;

  if (uid) {
    await cloudDelete(id);
  } else {
    disciplinas = disciplinas.filter((d) => d.id !== id);
    saveLocal();
    renderizar();
  }
};

window.atualizarCampo = async function atualizarCampo(id, campo, valor) {
  const disciplina = disciplinas.find((d) => d.id === id);
  if (!disciplina) return;

  disciplina[campo] = valor;

  if (uid) {
    await cloudUpsert(disciplina);
  } else {
    saveLocal();
    renderizar();
  }
};

window.limparTudo = async function limparTudo() {
  if (
    !confirm(
      "Tem certeza que deseja limpar TODAS as disciplinas?\nEsta ação não pode ser desfeita."
    )
  )
    return;

  if (uid) {
    const ids = disciplinas.map((d) => d.id);
    for (const id of ids) {
      await cloudDelete(id);
    }
  } else {
    disciplinas = [];
    saveLocal();
    renderizar();
  }
};

/* =============================
   Renderização
============================= */
function renderizar() {
  const grid = $("#disciplinasGrid");
  if (!grid) return;

  if (!disciplinas || disciplinas.length === 0) {
    grid.innerHTML =
      '<p class="empty">Nenhuma disciplina cadastrada. Clique em “+ Nova Disciplina” para começar.</p>';
    return;
  }

  grid.innerHTML = disciplinas
    .sort(byId)
    .map((disc) => {
      const a1 = getAulaStatus(disc.aulaAoVivo1);
      const a2 = getAulaStatus(disc.aulaAoVivo2);

      return `
      <div class="disciplina-card">
        <div class="card-header">
          <input
            type="text"
            placeholder="Nome da Disciplina"
            value="${escapeHtml(disc.nome || "")}"
            onchange="atualizarCampo(${disc.id}, 'nome', this.value)"
          />
          <input
            type="text"
            placeholder="Professor(a)"
            value="${escapeHtml(disc.professor || "")}"
            onchange="atualizarCampo(${disc.id}, 'professor', this.value)"
          />
        </div>

        <div class="checklist-item">
          <label>
            <input
              type="checkbox"
              ${disc.videoBoasVindas ? "checked" : ""}
              onchange="atualizarCampo(${disc.id}, 'videoBoasVindas', this.checked)"
            />
            <span class="item-label">Vídeo de boas-vindas</span>
          </label>
          <span class="status-badge ${disc.videoBoasVindas ? "status-sim" : "status-nao"}">
            ${disc.videoBoasVindas ? "Postou" : "Não postou"}
          </span>
        </div>

        <div class="checklist-item">
          <label>
            <input
              type="checkbox"
              ${disc.planoEnsino ? "checked" : ""}
              onchange="atualizarCampo(${disc.id}, 'planoEnsino', this.checked)"
            />
            <span class="item-label">Plano de ensino</span>
          </label>
          <span class="status-badge ${disc.planoEnsino ? "status-sim" : "status-nao"}">
            ${disc.planoEnsino ? "Postou" : "Não postou"}
          </span>
        </div>

        <div class="checklist-item ${a1.isSoon ? "aula-proxima pulse" : ""}">
          <span class="item-label">Aula ao vivo 1:</span>
          <input
            type="datetime-local"
            value="${escapeHtml(disc.aulaAoVivo1 || "")}"
            onchange="atualizarCampo(${disc.id}, 'aulaAoVivo1', this.value)"
          />
          ${a1.isSoon ? `<span class="badge-proxima ${a1.isToday ? "badge-hoje" : ""}">${a1.text}</span>` : ""}
        </div>

        <div class="checklist-item ${a2.isSoon ? "aula-proxima pulse" : ""}">
          <span class="item-label">Aula ao vivo 2:</span>
          <input
            type="datetime-local"
            value="${escapeHtml(disc.aulaAoVivo2 || "")}"
            onchange="atualizarCampo(${disc.id}, 'aulaAoVivo2', this.value)"
          />
          ${a2.isSoon ? `<span class="badge-proxima ${a2.isToday ? "badge-hoje" : ""}">${a2.text}</span>` : ""}
        </div>

        <div class="checklist-item">
          <span class="item-label">Plantão semanal:</span>
          <input
            type="text"
            placeholder="Ex: Segunda às 14h"
            value="${escapeHtml(disc.plantaoSemanal || "")}"
            onchange="atualizarCampo(${disc.id}, 'plantaoSemanal', this.value)"
          />
        </div>

        <button class="btn delete-card" onclick="deletarDisciplina(${disc.id})">
          🗑️ Deletar Disciplina
        </button>
      </div>`;
    })
    .join("");
}

/* =============================
   Boot
============================= */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    uid = user.uid;
    setAuthUI(true, user.email || "");
    try {
      await migrateLocalToCloudIfNeeded();
    } catch (e) {
      console.error("Migration error:", e);
    }
    startCloudListener();
  } else {
    uid = null;
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeSnapshot = null;
    setAuthUI(false);
    disciplinas = loadLocal();
    renderizar();
  }
});

// primeira render (offline/local)
setAuthUI(false);
renderizar();
