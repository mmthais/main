# Checklist com duas abas (EaD Pleno + EaD Presencial)

URL:
- https://mmthais.github.io/main/checklist.html

## Arquivos para /main/
- checklist.html
- styles.css
- app.js
- firebase-config.js
- README.md

## Firestore: Regras (obrigatório)
Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{sub=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
> Alternativa mais restrita (se preferir): liberar apenas as coleções disciplinas_pleno e disciplinas_presencial.

## Auth: Domínios autorizados
Authentication → Settings → Authorized domains:
- mmthais.github.io

## Onde salva
- Sem login: localStorage (por aba)
- Com login: Firestore em:
  - users/{uid}/disciplinas_pleno/{id}
  - users/{uid}/disciplinas_presencial/{id}
