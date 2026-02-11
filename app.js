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
   Estado
============================= */
const LOCAL_KEYS = {
  pleno: "disciplinas_local_cache_pleno_v1",
  presencial: "disciplinas_local_cache_presencial_v1"
};

let tabAtiva = "pleno";
let uid = null;

let disciplinasPleno = loadLocal("pleno");
let disciplinasPresencial = loadLocal("presencial");

let unsubPleno = null;
let unsubPresencial = null;

/* =============================
   Utils
============================= */
const $ = (sel) => document.querySelector(sel);

function byId(a, b) {
  return (a.id || 0) - (b.id || 0);
}

function loadLocal(tab) {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEYS[tab])) || [];
  } catch {
    return [];
  }
}

function saveLocal(tab) {
  const data = tab === "pleno" ? disciplinasPleno : disciplinasPresencial;
  localStorage.setItem(LOCAL_KEYS[tab], JSON.stringify(data));
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =============================
   Destaque Aula ao vivo (apenas Pleno)
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
   Firebase
============================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function colPath(tab) {
  // duas coleções separadas (uma por aba)
  return collection(db, "users", uid, tab === "pleno" ? "disciplinas_pleno" : "disciplinas_presencial");
}

async function cloudUpsert(tab, obj) {
  const ref = doc(db, "users", uid, tab === "pleno" ? "disciplinas_pleno" : "disciplinas_presencial", String(obj.id));
  await setDoc(ref, obj, { merge: false });
}

async function cloudDelete(tab, id) {
  const ref = doc(db, "users", uid, tab === "pleno" ? "disciplinas_pleno" : "disciplinas_presencial", String(id));
  await deleteDoc(ref);
}

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

function startCloudListeners() {
  if (!uid) return;

  if (unsubPleno) unsubPleno();
  if (unsubPresencial) unsubPresencial();

  unsubPleno = onSnapshot(
    colPath("pleno"),
    (snap) => {
      disciplinasPleno = snap.docs.map((d) => d.data()).sort(byId);
      saveLocal("pleno");
      renderizar();
    },
    (err) => console.error("Firestore pleno:", err)
  );

  unsubPresencial = onSnapshot(
    colPath("presencial"),
    (snap) => {
      disciplinasPresencial = snap.docs.map((d) => d.data()).sort(byId);
      saveLocal("presencial");
      renderizar();
    },
    (err) => console.error("Firestore presencial:", err)
  );
}

async function migrateLocalToCloudIfNeeded(tab) {
  const snap = await getDocs(colPath(tab));
  const cloudCount = snap.size;
  const local = loadLocal(tab).sort(byId);

  if (cloudCount === 0 && local.length > 0) {
    for (const item of local) {
      await cloudUpsert(tab, item);
    }
  }
}

/* =============================
   Abas
============================= */
window.setTab = function setTab(tab) {
  tabAtiva = tab;

  const tabPleno = $("#tabPleno");
  const tabPresencial = $("#tabPresencial");

  if (tabPleno && tabPresencial) {
    tabPleno.classList.toggle("active", tabAtiva === "pleno");
    tabPresencial.classList.toggle("active", tabAtiva === "presencial");
    tabPleno.setAttribute("aria-selected", tabAtiva === "pleno" ? "true" : "false");
    tabPresencial.setAttribute("aria-selected", tabAtiva === "presencial" ? "true" : "false");
  }

  renderizar();
};

/* =============================
   UI (globais)
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
      "• Pop-up bloqueado no navegador\n\n" +
      "Abra F12 → Console para ver o erro exato."
    );
  }
};

window.logoutGoogle = async function logoutGoogle() {
  try { await signOut(auth); } catch (e) { console.error(e); }
};

function getListaAtual() {
  return tabAtiva === "pleno" ? disciplinasPleno : disciplinasPresencial;
}

function setListaAtual(newArr) {
  if (tabAtiva === "pleno") disciplinasPleno = newArr;
  else disciplinasPresencial = newArr;
}

window.adicionarDisciplina = async function adicionarDisciplina() {
  const base = {
    id: Date.now(),
    nome: "",
    professor: "",
    videoBoasVindas: false,
    planoEnsino: false,
    plantaoSemanal: ""
  };

  const nova =
    tabAtiva === "pleno"
      ? { ...base, extensao: false, aulaAoVivo1: "", aulaAoVivo2: "" }
      : base; // presencial não tem aulas ao vivo

  if (uid) {
    await cloudUpsert(tabAtiva, nova);
  } else {
    const lista = getListaAtual();
    lista.push(nova);
    setListaAtual(lista);
    saveLocal(tabAtiva);
    renderizar();
  }
};

window.deletarDisciplina = async function deletarDisciplina(id) {
  if (!confirm("Tem certeza que deseja deletar esta disciplina?")) return;

  if (uid) {
    await cloudDelete(tabAtiva, id);
  } else {
    const lista = getListaAtual().filter((d) => d.id !== id);
    setListaAtual(lista);
    saveLocal(tabAtiva);
    renderizar();
  }
};

window.atualizarCampo = async function atualizarCampo(id, campo, valor) {
  const lista = getListaAtual();
  const disciplina = lista.find((d) => d.id === id);
  if (!disciplina) return;

  disciplina[campo] = valor;

  if (uid) {
    await cloudUpsert(tabAtiva, disciplina);
  } else {
    saveLocal(tabAtiva);
    renderizar();
  }
};

window.limparTudo = async function limparTudo() {
  if (!confirm("Tem certeza que deseja limpar TODAS as disciplinas desta aba?")) return;

  if (uid) {
    const lista = getListaAtual();
    for (const item of lista) {
      await cloudDelete(tabAtiva, item.id);
    }
  } else {
    setListaAtual([]);
    saveLocal(tabAtiva);
    renderizar();
  }
};

/* =============================
   Renderização
============================= */
function renderizar() {
  const grid = $("#disciplinasGrid");
  if (!grid) return;

  const lista = getListaAtual().sort(byId);

  if (!lista.length) {
    grid.innerHTML =
      '<p class="empty">Nenhuma disciplina cadastrada nesta aba. Clique em “+ Nova Disciplina” para começar.</p>';
    return;
  }

  grid.innerHTML = lista.map((disc) => {
    const a1 = tabAtiva === "pleno" ? getAulaStatus(disc.aulaAoVivo1) : null;
    const a2 = tabAtiva === "pleno" ? getAulaStatus(disc.aulaAoVivo2) : null;

    const aulasAoVivoHtml = tabAtiva === "pleno" ? `
      <div class="checklist-item ${a1?.isSoon ? "aula-proxima pulse" : ""}">
        <span class="item-label">Aula ao vivo 1:</span>
        <input type="datetime-local" value="${escapeHtml(disc.aulaAoVivo1 || "")}"
          onchange="atualizarCampo(${disc.id}, 'aulaAoVivo1', this.value)" />
        ${a1?.isSoon ? `<span class="badge-proxima ${a1.isToday ? "badge-hoje" : ""}">${a1.text}</span>` : ""}
      </div>

      <div class="checklist-item ${a2?.isSoon ? "aula-proxima pulse" : ""}">
        <span class="item-label">Aula ao vivo 2:</span>
        <input type="datetime-local" value="${escapeHtml(disc.aulaAoVivo2 || "")}"
          onchange="atualizarCampo(${disc.id}, 'aulaAoVivo2', this.value)" />
        ${a2?.isSoon ? `<span class="badge-proxima ${a2.isToday ? "badge-hoje" : ""}">${a2.text}</span>` : ""}
      </div>
    ` : "";

    return `
      <div class="disciplina-card">
        <div class="card-header">
          <input type="text" placeholder="Nome da Disciplina"
            value="${escapeHtml(disc.nome)}"
            onchange="atualizarCampo(${disc.id}, 'nome', this.value)" />
          <input type="text" placeholder="Professor(a)"
            value="${escapeHtml(disc.professor)}"
            onchange="atualizarCampo(${disc.id}, 'professor', this.value)" />
          ${tabAtiva === "pleno" ? `
          <div class="toggle-wrap">
            <span class="toggle-label">Disciplina de extensão?</span>
            <div class="toggle" role="group" aria-label="Disciplina de extensão">
              <button class="yes ${!!disc.extensao ? "active" : ""}" type="button"
                onclick="atualizarCampo(${disc.id}, 'extensao', true)">SIM</button>
              <button class="no ${!disc.extensao ? "active" : ""}" type="button"
                onclick="atualizarCampo(${disc.id}, 'extensao', false)">NÃO</button>
            </div>
          </div>
          ` : ``}

        </div>

        <div class="checklist-item">
          <label>
            <input type="checkbox" ${disc.videoBoasVindas ? "checked" : ""}
              onchange="atualizarCampo(${disc.id}, 'videoBoasVindas', this.checked)" />
            <span class="item-label">Vídeo de boas-vindas</span>
          </label>
          <span class="status-badge ${disc.videoBoasVindas ? "status-sim" : "status-nao"}">
            ${disc.videoBoasVindas ? "Postou" : "Não postou"}
          </span>
        </div>

        <div class="checklist-item">
          <label>
            <input type="checkbox" ${disc.planoEnsino ? "checked" : ""}
              onchange="atualizarCampo(${disc.id}, 'planoEnsino', this.checked)" />
            <span class="item-label">Plano de ensino</span>
          </label>
          <span class="status-badge ${disc.planoEnsino ? "status-sim" : "status-nao"}">
            ${disc.planoEnsino ? "Postou" : "Não postou"}
          </span>
        </div>

        ${aulasAoVivoHtml}

        <div class="checklist-item">
          <span class="item-label">Plantão semanal:</span>
          <input type="text" placeholder="Ex: Segunda às 14h"
            value="${escapeHtml(disc.plantaoSemanal)}"
            onchange="atualizarCampo(${disc.id}, 'plantaoSemanal', this.value)" />
        </div>

        <button class="btn delete-card" onclick="deletarDisciplina(${disc.id})">🗑️ Deletar Disciplina</button>
      </div>
    `;
  }).join("");
}

/* =============================
   Boot
============================= */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    uid = user.uid;
    setAuthUI(true, user.email || "");

    try {
      await migrateLocalToCloudIfNeeded("pleno");
      await migrateLocalToCloudIfNeeded("presencial");
    } catch (e) {
      console.error("Migration:", e);
    }

    startCloudListeners();
  } else {
    uid = null;
    if (unsubPleno) unsubPleno();
    if (unsubPresencial) unsubPresencial();
    unsubPleno = unsubPresencial = null;

    setAuthUI(false);

    disciplinasPleno = loadLocal("pleno");
    disciplinasPresencial = loadLocal("presencial");
    renderizar();
  }
});

// primeira render
setAuthUI(false);
renderizar();
