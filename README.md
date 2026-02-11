# Checklist de Disciplinas (EaD Pleno) — GitHub Pages

## O que já vem pronto
- Destaque automático de **Aula ao vivo** quando estiver **em até 24h** (inclusive "Hoje")
- Sem login: salva no **localStorage** do navegador (não perde ao atualizar a página)
- Com login (Google): salva e sincroniza na **nuvem (Firebase Firestore)**

---

## Como publicar no GitHub (pasta `main/`)
1. Copie estes arquivos para a pasta `main/` do seu domínio/repositório:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `cloud.js`
   - `firebase-config.js`

2. Faça commit/push e confirme que seu GitHub Pages está servindo essa pasta.

---

## Configurar Firebase (obrigatório para salvar na nuvem)
1. Crie um projeto no Firebase: https://console.firebase.google.com/
2. **Authentication** → *Sign-in method* → habilite **Google**
3. **Firestore Database** → crie o banco
4. **Project settings** → copie as chaves e cole em `firebase-config.js`
5. **Authentication** → *Settings* → **Authorized domains**
   - adicione `SEUUSUARIO.github.io` e/ou seu domínio custom (ex: `seudominio.com`)

### Regras recomendadas (Firestore)
No Firestore → Rules, você pode começar com:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/disciplinas/{discId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> Obs.: a sincronização entre dispositivos depende do **mesmo login Google**.

---

## Dica
Se o login não abrir:
- confira popup-blocker do navegador
- confira se o domínio está em **Authorized domains** no Firebase Auth
