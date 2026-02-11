# Checklist EaD Pleno (GitHub Pages + Firebase Firestore)

Hospedagem:
- https://mmthais.github.io/main/checklist.html

## 1) Arquivos
Coloque estes arquivos dentro da pasta `main/` do seu repositório:
- checklist.html
- styles.css
- app.js
- firebase-config.js

## 2) Firebase (o que precisa estar certo)
### (A) Authentication
Firebase Console → Build → Authentication
- Sign-in method → habilite **Google**
- Settings → Authorized domains → adicione:
  - `mmthais.github.io`

### (B) Firestore
Firebase Console → Build → Firestore Database → Create database

Regras (Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/disciplinas/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 3) Preencher o firebase-config.js
Firebase Console → Project settings (engrenagem) → Your apps → Web app → Config  
Cole os valores no arquivo `firebase-config.js` (sem aspas extras).

## 4) Se o login ainda falhar
Abra `F12 → Console`:
- Erro `auth/unauthorized-domain` → faltou autorizar `mmthais.github.io`
- Pop-up bloqueado → permita pop-ups para `mmthais.github.io`

## 5) Como funciona o salvamento
- Sem login: salva em **localStorage**
- Com login: salva na **nuvem (Firestore)** e mantém cache local
- Ao fazer login: se a nuvem estiver vazia e houver dados locais, migra local → nuvem.
