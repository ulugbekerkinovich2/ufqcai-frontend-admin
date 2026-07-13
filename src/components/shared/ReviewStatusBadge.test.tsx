import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { setLang } from "@/lib/i18n";

describe("ReviewStatusBadge", () => {
  it("renders the correct label per status", () => {
    setLang("uz");
    const { rerender } = render(<ReviewStatusBadge status="pending_triage" />);
    expect(screen.getByText("Ko'rib chiqilmoqda")).toBeInTheDocument();

    rerender(<ReviewStatusBadge status="assigned" />);
    expect(screen.getByText("Ekspertga tayinlangan")).toBeInTheDocument();

    rerender(<ReviewStatusBadge status="rejected" />);
    expect(screen.getByText("Rad etilgan")).toBeInTheDocument();

    rerender(<ReviewStatusBadge status="evaluated" />);
    expect(screen.getByText("Baholangan")).toBeInTheDocument();
  });
});
