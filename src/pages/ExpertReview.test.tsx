import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ExpertReview } from "./ExpertReview";
import { api } from "@/api/client";
import { setLang } from "@/lib/i18n";

vi.mock("@/api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const DOC = {
  id: "doc-1", title: "Baholanadigan ssenariy", original_name: "s.pdf",
  file_type: "pdf", file_size: 100, status: "parsed", created_at: "2026-01-01T00:00:00Z",
  review_status: "assigned", assigned_at: "2026-01-02T00:00:00Z",
};
const CRITERION = { id: "crit-1", name: "Zo'ravonlik", ai_instruction: "x", weight: 1, is_active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };
const REVIEW = { id: "rev-1", document_id: "doc-1", expert_id: "exp-1", status: "draft", items: [] };

function mockGet(routes: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(routes)) {
      if (url === pattern || url.startsWith(pattern)) return Promise.resolve({ data });
    }
    return Promise.reject(new Error("unexpected GET " + url));
  });
}

describe("ExpertReview queue", () => {
  beforeEach(() => {
    setLang("uz");
    vi.mocked(api.get).mockReset();
  });

  it("shows the empty state with no assignments", async () => {
    mockGet({ "/expert/queue": [] });
    renderWithProviders(<ExpertReview />, { route: "/expert-review", path: "/expert-review" });
    await waitFor(() => expect(screen.getByText("Sizga tayinlangan ssenariy yo'q")).toBeInTheDocument());
  });

  it("lists the assigned document", async () => {
    mockGet({ "/expert/queue": [DOC] });
    renderWithProviders(<ExpertReview />, { route: "/expert-review", path: "/expert-review" });
    await waitFor(() => expect(screen.getByText("Baholanadigan ssenariy")).toBeInTheDocument());
  });
});

describe("ExpertReview detail", () => {
  beforeEach(() => {
    setLang("uz");
    vi.mocked(api.get).mockReset();
    vi.mocked(api.put).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("renders the criteria form and saves a draft", async () => {
    const user = userEvent.setup();
    mockGet({
      "/documents/doc-1/analyses": [],
      "/documents/doc-1": DOC,
      "/criteria": [CRITERION],
      "/expert/doc-1/review": REVIEW,
    });
    vi.mocked(api.put).mockResolvedValue({ data: { ...REVIEW, overall_verdict: "approved" } });

    renderWithProviders(<ExpertReview />, { route: "/expert-review/doc-1", path: "/expert-review/:docId" });

    await waitFor(() => expect(screen.getByText("Zo'ravonlik")).toBeInTheDocument());

    await user.click(screen.getByText("Tasdiqlanadi"));
    await user.click(screen.getByText("Qoralama saqlash"));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/expert/doc-1/review", expect.objectContaining({
        overall_verdict: "approved",
        items: [expect.objectContaining({ criterion_id: "crit-1", criterion_name: "Zo'ravonlik" })],
      })),
    );
  });

  it("disables the submit button until a verdict is chosen", async () => {
    mockGet({
      "/documents/doc-1/analyses": [],
      "/documents/doc-1": DOC,
      "/criteria": [CRITERION],
      "/expert/doc-1/review": REVIEW,
    });
    renderWithProviders(<ExpertReview />, { route: "/expert-review/doc-1", path: "/expert-review/:docId" });

    await waitFor(() => expect(screen.getByText("Zo'ravonlik")).toBeInTheDocument());
    expect(screen.getByText("Yakunlash").closest("button")).toBeDisabled();
  });
});
