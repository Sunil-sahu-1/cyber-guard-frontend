# Cyber Guard Frontend

Modern Next.js frontend for the Cyber Guard Django REST backend.

## Backend
The frontend targets:
`http://127.0.0.1:8000/api`

Set a different URL in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Modules
- JWT authentication
- Security command dashboard
- Threat management and AI analysis details
- URL and email phishing analysis
- Image/video impersonation analysis
- Login and behaviour anomaly analysis
- Incident response and response actions
- Audit log search

All API calls live under `src/services/api/`; UI modules are kept separate under `src/components/` and `src/app/`.
