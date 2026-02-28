import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Cards from "../pages/Cards.jsx";

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

describe("Cards page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads cards list (GET /cards/) and admin sees plus button", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });

    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 1, values: [null, "pro", 5, 10] }],
    });

    render(
      <MemoryRouter>
        <Cards />
      </MemoryRouter>
    );

    expect(apiFetchMock).toHaveBeenCalledWith("/cards/", { method: "GET" });

    expect(await screen.findByLabelText("Додати нову картку")).toBeInTheDocument();

    expect(screen.getByText("PRO")).toBeInTheDocument();
    expect(screen.getByText(/Відсоток нарахування бонусів/i)).toBeInTheDocument();
  });

  it("admin click on card navigates to edit", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });

    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 7, values: [null, "advanced", 7, 2] }],
    });

    render(
      <MemoryRouter>
        <Cards />
      </MemoryRouter>
    );

    await screen.findByText("ADVANCED");

    const cardBtn = screen.getByRole("button");
    fireEvent.click(cardBtn);

    expect(navigateMock).toHaveBeenCalledWith("/cards/7/edit");
  });

  it("regular user does not see plus button and click does not navigate", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: false } });

    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 2, values: [null, "new", 1, 0] }],
    });

    render(
      <MemoryRouter>
        <Cards />
      </MemoryRouter>
    );

    await screen.findByText("NEW");

    expect(screen.queryByLabelText("Додати нову картку")).not.toBeInTheDocument();

    const cardBtn = screen.getByRole("button");
    fireEvent.click(cardBtn);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows error when API fails", async () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });
    apiFetchMock.mockRejectedValueOnce(new Error("fail"));

    render(
      <MemoryRouter>
        <Cards />
      </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("fail");
  });
});