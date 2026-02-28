import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Outlets from "../pages/Outlets.jsx";

const navigateMock = vi.fn();
const apiFetchMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("../api/client", () => ({
  apiFetch: (...args) => apiFetchMock(...args),
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => useAuthMock(),
}));

describe("Outlets page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads outlets and admin sees plus", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });
    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 1, values: [null, "Точка 1", "Адреса 1"] }],
    });

    render(
      <MemoryRouter>
        <Outlets />
      </MemoryRouter>
    );

    expect(apiFetchMock).toHaveBeenCalledWith("/outlets/", { method: "GET" });
    expect(await screen.findByLabelText("Додати торгову точку")).toBeInTheDocument();
    expect(screen.getByText("Точка 1")).toBeInTheDocument();
    expect(screen.getByText("Адреса 1")).toBeInTheDocument();
  });

  it("admin click navigates to edit", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });
    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 9, values: [null, "X", "Y"] }],
    });

    render(
      <MemoryRouter>
        <Outlets />
      </MemoryRouter>
    );

    await screen.findByText("X");

    fireEvent.click(screen.getByRole("button"));
    expect(navigateMock).toHaveBeenCalledWith("/outlets/9/edit");
  });

  it("regular user does not see plus and click does not navigate", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: false } });
    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 2, values: [null, "A", "B"] }],
    });

    render(
      <MemoryRouter>
        <Outlets />
      </MemoryRouter>
    );

    await screen.findByText("A");
    expect(screen.queryByLabelText("Додати торгову точку")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows error when API fails", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });
    apiFetchMock.mockRejectedValueOnce(new Error("fail"));

    render(
      <MemoryRouter>
        <Outlets />
      </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("fail");
  });
});