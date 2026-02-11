import {
  watchUser,
  loginWithGoogle,
  logout,
  watchDisciplinas,
  upsertDisciplina,
  removeDisciplina
} from "./cloud.js";

// --------------------
// Estado + armazenamento
// --------------------
let disciplinas = [];
let currentUser = null;
let unsubscribeCloud = null;

const LS_KEY = "disciplinas_ead_pleno_v2";

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify(disciplinas));
}

function setStoreStatus(kind, text) {
  const dot = document.getElementById("storeDot");
  const label = document.getElementById("storeText");
  dot.className = "dot " + (kind || "");
  label.textContent = text;
}

// --------------------
// Util: destaque "aula ao vivo" até 24h
// --------------------
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

// --------------------
// CRUD
// --------------------
function novaDisciplinaVazia() {
  return {
    id: Date.now(),
    nome: "",
    professor: "",
    videoBoasVindas: false,
    planoEnsino: false,
    aulaAoVivo1: "",
    aulaAoVivo2: "",
    plantaoSemanal: ""
  };
}

async function persistDisciplina(disc) {
  if (currentUser) {
    await upsertDisciplina(currentUser.uid, disc);
  } else {
    saveLocal();
  }
}

async function persistDelete(id) {
  if (currentUser) {
    await removeDisciplina(currentUser.uid, id);
  } else {
    saveLocal();
  }
}

function adicionarDisciplina() {
  const d = novaDisciplinaVazia();
  disciplinas.unshift(d);
  if (!currentUser) saveLocal();
  renderizar();
  if (currentUser) persistDisciplina(d);
}

function atualizarCampo(id, campo, valor) {
  const idx = disciplinas.findIndex(d => d.id === id);
  if (idx === -1) return;
  disciplinas[idx][campo] = valor;

  if (!currentUser) saveLocal();
  renderizar();

  persistDisciplina(disciplinas[idx]);
}

function deletarDisciplina(id) {
  disciplinas = disciplinas.filter(d => d.id !== id);
  if (!currentUser) saveLocal();
  renderizar();
  persistDelete(id);
}

async function limparTudo() {
  if (!confirm("Tem certeza que deseja limpar todas as disciplinas?")) return;

  if (currentUser) {
    // remove item por item
    const ids = disciplinas.map(d => d.id);
    disciplinas = [];
    renderizar();
    await Promise.all(ids.map(id => removeDisciplina(currentUser.uid, id)));
  } else {
    disciplinas = [];
    saveLocal();
    renderizar();
  }
}

// --------------------
// Render
// --------------------
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderizar() {
  const grid = document.getElementById("disciplinasGrid");

  if (!disciplinas.length) {
    grid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-weight: 800;">Nenhuma disciplina cadastrada. Clique em "Nova Disciplina" para começar.</p>';
    return;
  }

  grid.innerHTML = disciplinas.map(disc => {
    const a1 = getAulaStatus(disc.aulaAoVivo1);
    const a2 = getAulaStatus(disc.aulaAoVivo2);

    return `
      <div class="disciplina-card">
        <div class="card-header">
          <input
            type="text"
            placeholder="Nome da Disciplina"
            value="${escapeHtml(disc.nome)}"
            onchange="window.__atualizarCampo(${disc.id}, 'nome', this.value)"
            style="font-weight: 900;"
          />
          <input
            type="text"
            placeholder="Professor(a)"
            value="${escapeHtml(disc.professor)}"
            onchange="window.__atualizarCampo(${disc.id}, 'professor', this.value)"
          />
        </div>

        <div class="checklist-item">
          <label>
            <input
              type="checkbox"
              ${disc.videoBoasVindas ? "checked" : ""}
              onchange="window.__atualizarCampo(${disc.id}, 'videoBoasVindas', this.checked)"
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
              onchange="window.__atualizarCampo(${disc.id}, 'planoEnsino', this.checked)"
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
            value="${escapeHtml(disc.aulaAoVivo1)}"
            onchange="window.__atualizarCampo(${disc.id}, 'aulaAoVivo1', this.value)"
          />
          ${a1.isSoon ? `<span class="badge-proxima ${a1.isToday ? "badge-hoje" : ""}">${a1.text}</span>` : ""}
        </div>

        <div class="checklist-item ${a2.isSoon ? "aula-proxima pulse" : ""}">
          <span class="item-label">Aula ao vivo 2:</span>
          <input
            type="datetime-local"
            value="${escapeHtml(disc.aulaAoVivo2)}"
            onchange="window.__atualizarCampo(${disc.id}, 'aulaAoVivo2', this.value)"
          />
          ${a2.isSoon ? `<span class="badge-proxima ${a2.isToday ? "badge-hoje" : ""}">${a2.text}</span>` : ""}
        </div>

        <div class="checklist-item">
          <span class="item-label">Plantão semanal:</span>
          <input
            type="text"
            placeholder="Ex: Segunda às 14h"
            value="${escapeHtml(disc.plantaoSemanal)}"
            onchange="window.__atualizarCampo(${disc.id}, 'plantaoSemanal', this.value)"
          />
        </div>

        <button class="btn btn-delete delete-card" onclick="window.__deletarDisciplina(${disc.id})">
          🗑️ Deletar Disciplina
        </button>
      </div>
    `;
  }).join("");
}

// Expor handlers (porque o HTML gerado usa onclick/onchange)
window.__atualizarCampo = atualizarCampo;
window.__deletarDisciplina = deletarDisciplina;

// --------------------
// Auth / Sync
// --------------------
function showAuthButtons(isLogged) {
  document.getElementById("btnLogin").style.display = isLogged ? "none" : "inline-flex";
  document.getElementById("btnLogout").style.display = isLogged ? "inline-flex" : "none";
}

function startCloudWatch(user) {
  if (unsubscribeCloud) unsubscribeCloud();
  unsubscribeCloud = null;

  if (!user) return;

  unsubscribeCloud = watchDisciplinas(user.uid, (list) => {
    disciplinas = list;
    renderizar();
  });
}

async function migrateLocalToCloudIfNeeded() {
  if (!currentUser) return;
  const local = loadLocal();
  if (!local.length) return;

  // Mescla: mantém a nuvem como fonte principal, mas sobe itens locais que ainda não existam
  const cloudIds = new Set(disciplinas.map(d => d.id));
  const toUpload = local.filter(d => !cloudIds.has(d.id));

  if (toUpload.length) {
    setStoreStatus("warn", "Sincronizando itens locais para a nuvem...");
    await Promise.all(toUpload.map(d => upsertDisciplina(currentUser.uid, d)));
  }

  // limpa cache local depois de subir
  localStorage.removeItem(LS_KEY);
  setStoreStatus("ok", "Nuvem (Firestore) — sincronizado");
}

// --------------------
// Boot
// --------------------
document.getElementById("btnNova").addEventListener("click", adicionarDisciplina);
document.getElementById("btnLimpar").addEventListener("click", limparTudo);
document.getElementById("btnLogin").addEventListener("click", async () => {
  try {
    setStoreStatus("warn", "Abrindo login...");
    await loginWithGoogle();
  } catch (e) {
    console.error(e);
    alert("Não foi possível logar. Verifique se o domínio está autorizado no Firebase Auth e se o popup não foi bloqueado.");
    setStoreStatus("err", "Falha no login");
  }
});
document.getElementById("btnLogout").addEventListener("click", async () => {
  await logout();
});

// Carrega local imediatamente (melhor UX)
disciplinas = loadLocal();
renderizar();
setStoreStatus("ok", "Local (navegador)");

// Observa login
watchUser(async (user) => {
  currentUser = user;
  showAuthButtons(!!user);

  if (user) {
    setStoreStatus("warn", "Conectando à nuvem...");
    startCloudWatch(user);
    // aguarda um pouco o primeiro snapshot; migração acontece depois no próximo tick
    setTimeout(() => migrateLocalToCloudIfNeeded().catch(console.error), 300);
  } else {
    if (unsubscribeCloud) unsubscribeCloud();
    unsubscribeCloud = null;

    disciplinas = loadLocal();
    renderizar();
    setStoreStatus("ok", "Local (navegador)");
  }
});
