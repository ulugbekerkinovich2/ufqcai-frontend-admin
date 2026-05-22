/**
 * Sodda i18n — JSON sozlamalardan kalit bo'yicha matn olish.
 * `localStorage.lang` ('uz' | 'ru' | 'en'). Browser language fallback.
 */
import { useEffect, useState } from "react";

type Lang = "uz" | "ru" | "en";

const MESSAGES: Record<Lang, Record<string, string>> = {
  uz: {
    "app.title": "Senariy Analizer",
    "nav.dashboard": "Boshqaruv paneli",
    "nav.documents": "Ssenariylar",
    "nav.criteria": "Mezonlar",
    "nav.laws": "Qonunlar bazasi",
    "nav.users": "Foydalanuvchilar",
    "nav.usage": "OpenAI sarflar",
    "nav.audit": "Audit jurnali",
    "auth.login": "Tizimga kirish",
    "auth.email": "Elektron pochta",
    "auth.password": "Parol",
    "auth.totp": "2FA kod",
    "auth.submit": "Kirish",
    "auth.logout": "Chiqish",
    "common.save": "Saqlash",
    "common.cancel": "Bekor qilish",
    "common.delete": "O'chirish",
    "common.edit": "Tahrirlash",
    "common.search": "Qidirish",
    "common.loading": "Yuklanmoqda...",
    "risk.None": "Yo'q",
    "risk.Low": "Past",
    "risk.Medium": "O'rta",
    "risk.High": "Yuqori",
  },
  ru: {
    "app.title": "Senariy Analizer",
    "nav.dashboard": "Панель управления",
    "nav.documents": "Сценарии",
    "nav.criteria": "Критерии",
    "nav.laws": "База законов",
    "nav.users": "Пользователи",
    "nav.usage": "Расходы OpenAI",
    "nav.audit": "Журнал аудита",
    "auth.login": "Вход в систему",
    "auth.email": "Электронная почта",
    "auth.password": "Пароль",
    "auth.totp": "Код 2FA",
    "auth.submit": "Войти",
    "auth.logout": "Выход",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.edit": "Редактировать",
    "common.search": "Поиск",
    "common.loading": "Загрузка...",
    "risk.None": "Нет",
    "risk.Low": "Низкий",
    "risk.Medium": "Средний",
    "risk.High": "Высокий",
  },
  en: {
    "app.title": "Senariy Analizer",
    "nav.dashboard": "Dashboard",
    "nav.documents": "Scripts",
    "nav.criteria": "Criteria",
    "nav.laws": "Laws database",
    "nav.users": "Users",
    "nav.usage": "OpenAI usage",
    "nav.audit": "Audit log",
    "auth.login": "Sign in",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.totp": "2FA code",
    "auth.submit": "Sign in",
    "auth.logout": "Log out",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.loading": "Loading...",
    "risk.None": "None",
    "risk.Low": "Low",
    "risk.Medium": "Medium",
    "risk.High": "High",
  },
};

function detect(): Lang {
  const saved = (typeof localStorage !== "undefined" && localStorage.getItem("lang")) as Lang | null;
  if (saved && saved in MESSAGES) return saved;
  const nav = (typeof navigator !== "undefined" ? navigator.language : "uz").slice(0, 2);
  if (nav === "ru") return "ru";
  if (nav === "en") return "en";
  return "uz";
}

let currentLang: Lang = detect();
const listeners = new Set<() => void>();

export function t(key: string): string {
  return MESSAGES[currentLang][key] ?? MESSAGES.uz[key] ?? key;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  listeners.forEach((fn) => fn());
}

export function getLang(): Lang {
  return currentLang;
}

export function useI18n() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { t, lang: currentLang, setLang };
}
