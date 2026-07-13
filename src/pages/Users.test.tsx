import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { Users } from "./Users";
import { api } from "@/api/client";
import { setLang } from "@/lib/i18n";

vi.mock("@/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const SELF_REGISTERED_USER = {
  id: "u-1", full_name: "Ochiq Foydalanuvchi", email: "public@example.uz",
  role: "user", is_active: true, created_at: "2026-01-01T00:00:00Z", permissions: [],
};
const MUTAXASSIS = {
  id: "u-2", full_name: "Mutaxassis Ism", email: "mx@example.uz",
  role: "mutaxassis", is_active: true, created_at: "2026-01-01T00:00:00Z", permissions: [],
};

describe("Users", () => {
  beforeEach(() => {
    setLang("uz");
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.get).mockResolvedValue({ data: [SELF_REGISTERED_USER, MUTAXASSIS] });
  });

  it("renders the correct role badge for a self-registered 'user' account", async () => {
    renderWithProviders(<Users />);
    await waitFor(() => expect(screen.getByText("Ochiq Foydalanuvchi")).toBeInTheDocument());
    expect(screen.getByText("Foydalanuvchi")).toBeInTheDocument();
    expect(screen.getByText("Mutaxassis")).toBeInTheDocument();
  });

  it("does not offer the 'user' role when creating a new account", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Users />);
    await waitFor(() => expect(screen.getByText("Ochiq Foydalanuvchi")).toBeInTheDocument());

    await user.click(screen.getByText("Yangi foydalanuvchi"));
    const select = screen.getByLabelText("Rol") as HTMLSelectElement;
    const options = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(options).not.toContain("Foydalanuvchi");
    expect(options).toContain("Mutaxassis");
    expect(options).toContain("Ekspert");
  });

  it("creates a new user with the posted payload", async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValue({ data: { ...MUTAXASSIS, id: "u-3" } });
    renderWithProviders(<Users />);
    await waitFor(() => expect(screen.getByText("Ochiq Foydalanuvchi")).toBeInTheDocument());

    await user.click(screen.getByText("Yangi foydalanuvchi"));
    await user.type(screen.getByLabelText("To'liq ism"), "Yangi Ekspert");
    await user.type(screen.getByLabelText("Elektron pochta"), "new@example.uz");
    await user.type(screen.getByLabelText("Boshlang'ich parol"), "pass12345");

    await user.click(screen.getByRole("button", { name: "Yaratish" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/users", expect.objectContaining({
      full_name: "Yangi Ekspert", email: "new@example.uz", password: "pass12345",
    })));
  });

  it("shows 'user' as a selectable, highlighted role when editing a self-registered account", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Users />);
    await waitFor(() => expect(screen.getByText("Ochiq Foydalanuvchi")).toBeInTheDocument());

    const row = screen.getByText("Ochiq Foydalanuvchi").closest("tr")!;
    await user.click(within(row).getByTitle("Tahrirlash"));

    // Edit modal renders a role button-grid (not a <select>) that includes "user" —
    // create's ASSIGNABLE_ROLES excludes it, edit's EDITABLE_ROLES includes it.
    const dialog = (await screen.findByText("Foydalanuvchini tahrirlash")).closest(".fixed")! as HTMLElement;
    const roleButton = within(dialog).getByText("Foydalanuvchi").closest("button")!;
    expect(roleButton).toHaveClass("border-ink/30");
  });
});
