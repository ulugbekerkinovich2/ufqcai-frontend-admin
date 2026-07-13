import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { Triage } from "./Triage";
import { api } from "@/api/client";
import { setLang } from "@/lib/i18n";

vi.mock("@/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const DOC = {
  id: "doc-1", title: "Test ssenariy", original_name: "test.pdf",
  file_type: "pdf", file_size: 100, status: "parsed", created_at: "2026-01-01T00:00:00Z",
  review_status: "pending_triage",
};
const EXPERT = { id: "exp-1", full_name: "Ali Valiyev", email: "ali@example.uz" };

describe("Triage", () => {
  beforeEach(() => {
    setLang("uz");
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("shows the empty state when the queue has no documents", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/triage/queue") return Promise.resolve({ data: [] });
      if (url === "/triage/experts") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("unexpected url " + url));
    });
    renderWithProviders(<Triage />);
    await waitFor(() => expect(screen.getByText("Navbat bo'sh")).toBeInTheDocument());
  });

  it("lists queued documents", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/triage/queue") return Promise.resolve({ data: [DOC] });
      if (url === "/triage/experts") return Promise.resolve({ data: [EXPERT] });
      return Promise.reject(new Error("unexpected url " + url));
    });
    renderWithProviders(<Triage />);
    await waitFor(() => expect(screen.getByText("Test ssenariy")).toBeInTheDocument());
  });

  it("assigns a document to the selected expert", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/triage/queue") return Promise.resolve({ data: [DOC] });
      if (url === "/triage/experts") return Promise.resolve({ data: [EXPERT] });
      return Promise.reject(new Error("unexpected url " + url));
    });
    vi.mocked(api.post).mockResolvedValue({ data: { ...DOC, review_status: "assigned" } });

    renderWithProviders(<Triage />);
    await waitFor(() => expect(screen.getByText("Test ssenariy")).toBeInTheDocument());

    await user.click(screen.getAllByText("Tayinlash")[0]);
    const select = await screen.findByLabelText("Ekspertni tanlang", { exact: false }).catch(() => screen.getByRole("combobox"));
    await user.selectOptions(select, "exp-1");
    await user.click(screen.getAllByText("Tayinlash").at(-1)!);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/triage/doc-1/assign", { expert_id: "exp-1" }),
    );
  });

  it("rejects a document with a reason", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/triage/queue") return Promise.resolve({ data: [DOC] });
      if (url === "/triage/experts") return Promise.resolve({ data: [] });
      return Promise.reject(new Error("unexpected url " + url));
    });
    vi.mocked(api.post).mockResolvedValue({ data: { ...DOC, review_status: "rejected" } });

    renderWithProviders(<Triage />);
    await waitFor(() => expect(screen.getByText("Test ssenariy")).toBeInTheDocument());

    await user.click(screen.getByText("Rad etish"));
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Mos emas");
    await user.click(screen.getAllByText("Rad etish").at(-1)!);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/triage/doc-1/reject", { reason: "Mos emas" }),
    );
  });
});
