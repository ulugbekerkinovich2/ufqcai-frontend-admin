# ufqcai-frontend — Senariy Analizer (React)

O'zbekiston Madaniyat vazirligi uchun ssenariy tahlil tizimi frontend qismi.

**Stack:** React 18 · TypeScript · Vite · Tailwind · TanStack Query · Zustand · React Router · Recharts · Axios.

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env.local   # ixtiyoriy
npm run dev                  # http://localhost:5173 ; /api → backend (vite proxy: 8001)
npm run build                # production build → dist/
```

## Env (Vite)

`.env.local` (yoki `.env.production`) — `.env.example` ko'ring.

| Variable | Tavsif | Default |
|----------|--------|---------|
| `VITE_API_BASE_URL` | API base URL. Bo'sh — `/api/v1` (Vite/Nginx proxy). To'liq URL: `https://api.senariy.uz/api/v1` | `/api/v1` |
| `VITE_DEV_PROXY_TARGET` | Dev rejimida Vite proxy backendni qaerga jo'natadi | `http://localhost:8001` |

Frontend va backend bir domenda (nginx orqasida) bo'lsa, **`VITE_API_BASE_URL` ni o'rnatish shart emas**.

## PM2 bilan ishga tushirish

```bash
npm i -g pm2
npm run build
pm2 start ecosystem.config.cjs   # serve -s dist -l 5173
pm2 save && pm2 startup
```

Backend `localhost:8001` da bo'lishi kerak (`vite.config.ts`'da proxy sozlangan). Boshqa portni xohlasangiz `vite.config.ts` ni o'zgartiring.

## Sahifalar

- `/login` — Email + parol kirish
- `/` — Dashboard (statistika)
- `/documents` — ssenariylar, drag&drop yuklash
- `/documents/:id` — detail + tahlil tugmasi (yoki "Qayta tahlil")
- `/analyses/:id` — natija: ScoreGauge, Bar/Radar chart, kriteriyalar jadvali, highlighted matn, PDF eksport
- `/criteria` — CRUD
- `/laws` — qonun yuklash + indekslash
- `/users` — admin boshqarish (super_admin)
- `/audit` — audit log (super_admin)
- `/change-password` — parolni o'zgartirish

## Komponentlar

- `FileUploader` — drag&drop, format/hajm validatsiyasi
- `RiskBadge` — None/Low/Medium/High rangli belgi
- `ScoreGauge` — 0–100 aylanma indikator
- `HighlightedText` — ssenariy matnida flagged parchalarni rang bilan + click → izoh
- `Layout` — sidebar navigatsiya + foydalanuvchi paneli
