import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import CardForm from "../pages/CardForm.jsx";

const navigateMock = vi.fn();
const apiFetchMock = vi.fn();
const useAuthMock = vi.fn();
let paramsMock = {};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => paramsMock,
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

vi.mock("../api/client", () => ({
  apiFetch: (...args) => apiFetchMock(...args),
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => useAuthMock(),
}));

describe("CardForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paramsMock = {};
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("non-admin redirects to /cards", () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: false } });

    render(<CardForm />);

    expect(navigateMock).toHaveBeenCalledWith("/cards", { replace: true });
  });

  it("admin create mode: submits POST /cards/new/ and navigates /cards", async () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });
    paramsMock = {};
    apiFetchMock.mockResolvedValueOnce({ ok: true });

    render(<CardForm />);

    fireEvent.change(screen.getByLabelText("Тип картки"), { target: { value: "pro" } });
    fireEvent.change(screen.getByLabelText("Нарахування бонусів (%)"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Знижка (%)"), { target: { value: "10" } });

    fireEvent.submit(screen.getByRole("button", { name: "Зберегти" }).closest("form"));

    await Promise.resolve();

    expect(apiFetchMock).toHaveBeenCalledWith("/cards/new/", {
      method: "POST",
      body: { type: "pro", bonus_percent: "5", discount: "10" },
    });

    expect(navigateMock).toHaveBeenCalledWith("/cards");
  });

  it("admin edit mode: loads initial and submits POST /cards/:id/edit/", async () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });
    paramsMock = { id: "12" };

    apiFetchMock
      .mockResolvedValueOnce({ type: "pro", bonus_percent: 3, discount: 1 }) // GET
      .mockResolvedValueOnce({ ok: true }); // POST edit

    render(<CardForm />);

    expect(apiFetchMock).toHaveBeenCalledWith("/cards/12/", { method: "GET" });

    expect(await screen.findByText("Редагувати бонусну картку")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Знижка (%)"), { target: { value: "15" } });
    fireEvent.submit(screen.getByRole("button", { name: "Зберегти" }).closest("form"));
    await Promise.resolve();

    expect(apiFetchMock).toHaveBeenLastCalledWith("/cards/12/edit/", {
      method: "POST",
      body: { type: "pro", bonus_percent: "3", discount: "15" },
    });

    expect(navigateMock).toHaveBeenCalledWith("/cards");
  });

  it("admin edit mode: delete asks confirm, calls delete and navigates", async () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });
    paramsMock = { id: "5" };

    apiFetchMock
      .mockResolvedValueOnce({ type: "new", bonus_percent: 1, discount: 0 }) // GET
      .mockResolvedValueOnce({ ok: true }); // delete

    render(<CardForm />);

    await screen.findByText("Редагувати бонусну картку");

    fireEvent.click(screen.getByRole("button", { name: "Видалити" }));
    await Promise.resolve();

    expect(window.confirm).toHaveBeenCalledWith("Видалити картку?");
    expect(apiFetchMock).toHaveBeenLastCalledWith("/cards/5/delete/", { method: "POST", body: {} });
    expect(navigateMock).toHaveBeenCalledWith("/cards");
  });
});