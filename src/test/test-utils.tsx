import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";

interface Options {
  route?: string;
  /** react-router path pattern, e.g. "/expert-review/:docId" — needed when the
   * component reads useParams(). Defaults to the literal route (no params). */
  path?: string;
}

export function renderWithProviders(ui: ReactElement, { route = "/", path }: Options = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path ?? route} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
