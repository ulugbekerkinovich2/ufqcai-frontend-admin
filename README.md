# ufqcai-frontend — Senariy Analizer (React)

O'zbekiston Madaniyat vazirligi uchun ssenariy tahlil tizimi frontend qismi.

**Stack:** React 18 · TypeScript · Vite · Tailwind · TanStack Query · Zustand · React Router · Recharts · Axios.

## Lokal ishga tushirish

```bash
npm install
npm run dev     # http://localhost:5173 ; /api → backend (vite proxy: 8001)
npm run build   # production build → dist/
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
