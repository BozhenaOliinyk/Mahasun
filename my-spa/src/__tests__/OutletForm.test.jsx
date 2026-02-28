import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import OutletForm from "../pages/OutletForm.jsx";

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

describe("OutletForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paramsMock = {};
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("non-admin redirects to /outlets", () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: false } });

    render(<OutletForm />);

    expect(navigateMock).toHaveBeenCalledWith("/outlets", { replace: true });
  });

  it("admin create: POST /outlets/new/ then navigate /outlets", async () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });
    paramsMock = {}; // create
    apiFetchMock.mockResolvedValueOnce({ ok: true });

    render(<OutletForm />);

    fireEvent.change(screen.getByLabelText("Назва точки"), { target: { value: "Shop" } });
    fireEvent.change(screen.getByLabelText("Адреса"), { target: { value: "Street 1" } });

    fireEvent.submit(screen.getByRole("button", { name: "Зберегти" }).closest("form"));
    await Promise.resolve();

    expect(apiFetchMock).toHaveBeenCalledWith("/outlets/new/", {
      method: "POST",
      body: { name: "Shop", address: "Street 1" },
    });

    expect(navigateMock).toHaveBeenCalledWith("/outlets");
  });

  it("admin edit: GET /outlets/:id/ and POST edit", async () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });
    paramsMock = { id: "3" };

    apiFetchMock
      .mockResolvedValueOnce({ name: "Old", address: "Addr" }) // GET
      .mockResolvedValueOnce({ ok: true }); // POST

    render(<OutletForm />);

    expect(apiFetchMock).toHaveBeenCalledWith("/outlets/3/", { method: "GET" });
    expect(await screen.findByText("Редагувати торгову точку")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Адреса"), { target: { value: "New Addr" } });
    fireEvent.submit(screen.getByRole("button", { name: "Зберегти" }).closest("form"));
    await Promise.resolve();

    expect(apiFetchMock).toHaveBeenLastCalledWith("/outlets/3/edit/", {
      method: "POST",
      body: { name: "Old", address: "New Addr" },
    });

    expect(navigateMock).toHaveBeenCalledWith("/outlets");
  });

  it("admin edit: delete", async () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });
    paramsMock = { id: "8" };

    apiFetchMock
      .mockResolvedValueOnce({ name: "X", address: "Y" }) // GET
      .mockResolvedValueOnce({ ok: true }); // delete

    render(<OutletForm />);

    await screen.findByText("Редагувати торгову точку");

    fireEvent.click(screen.getByRole("button", { name: "Видалити" }));
    await Promise.resolve();

    expect(window.confirm).toHaveBeenCalledWith("Видалити торгову точку?");
    expect(apiFetchMock).toHaveBeenLastCalledWith("/outlets/8/delete/", { method: "POST", body: {} });
    expect(navigateMock).toHaveBeenCalledWith("/outlets");
  });
});