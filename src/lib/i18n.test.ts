import { describe, it, expect, beforeEach } from "vitest";
import { t, setLang } from "./i18n";

describe("t", () => {
  beforeEach(() => setLang("uz"));

  it("returns the UZ string for a known key", () => {
    expect(t("common.cancel")).toBe("Bekor qilish");
  });

  it("falls back to the key itself when missing everywhere", () => {
    expect(t("no.such.key.exists")).toBe("no.such.key.exists");
  });

  it("interpolates {n}-style variables", () => {
    const out = t("documents.total", { n: 5 });
    expect(out).toContain("5");
  });

  it("switches language via setLang and falls back to uz for missing RU/EN keys", () => {
    setLang("ru");
    expect(t("common.cancel")).toBe("Отмена");
    setLang("en");
    expect(t("common.cancel")).toBe("Cancel");
  });
});
