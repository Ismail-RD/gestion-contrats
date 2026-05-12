# Deploiement

Architecture recommandee:

- Frontend: Vercel ou Cloudflare Pages
- Backend: Render Free Web Service
- Base de donnees: Neon Free PostgreSQL
- Email: Brevo API transactionnelle (recommande) ou Brevo SMTP en fallback

## 1. Neon PostgreSQL

1. Creer un projet Neon.
2. Copier la chaine de connexion PostgreSQL.
3. Utiliser cette valeur dans Render comme `DATABASE_URL`.

## 2. Backend sur Render

Creer un Web Service depuis le repo GitHub.

- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

Variables Render:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=change_me_to_a_long_secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=https://your-frontend-domain.vercel.app
FRONTEND_URLS=https://your-frontend-domain.vercel.app,http://localhost:5173
MAIL_FROM="Gestion des contrats <verified-sender@example.com>"
BREVO_API_KEY=xkeysib-your_brevo_api_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-lite

# Fallback SMTP si BREVO_API_KEY n'est pas defini
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USER=your_brevo_smtp_login
MAIL_PASSWORD=your_brevo_smtp_key
COMPANY_NAME=TechCare Maintenance
COMPANY_TAGLINE=Maintenance informatique, support et securite
COMPANY_EMAIL=support@example.com
COMPANY_PHONE=+212 600 000 000
COMPANY_ADDRESS=Casablanca, Maroc
```

## 3. Frontend sur Vercel

Importer le meme repo GitHub.

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Variable Vercel:

```env
VITE_API_URL=https://your-render-backend.onrender.com
```

Apres le deploiement frontend, mettre son URL finale dans `FRONTEND_URL` et `FRONTEND_URLS` sur Render, puis redeployer le backend.
