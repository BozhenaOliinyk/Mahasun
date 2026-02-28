import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Spices from "../pages/Spices.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

const apiFetchMock = vi.fn();
vi.mock("../api/client", () => ({
  apiFetch: (...args) => apiFetchMock(...args),
}));

const useAuthMock = vi.fn();
vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("Spices page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("loads spices on mount from /spices/ and renders card + heart for user", async () => {
    useAuthMock.mockReturnValue({
      session: { loaded: true, isAdmin: false, hasClientSession: true },
    });

    apiFetchMock.mockResolvedValueOnce({
      rows: [
        { id: 7, values: [null, "Paprika", "TypeA", "PurposeA", 12] },
      ],
      fav_ids: [],
    });

    render(<Spices />);

    expect(await screen.findByText("Каталог спецій")).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledWith("/spices/", { method: "GET" });

    expect(await screen.findByText("Paprika")).toBeInTheDocument();

    expect(screen.getByText("❤")).toBeInTheDocument();
  });

  it("user without client session: clicking heart redirects to /login (no POST)", async () => {
    useAuthMock.mockReturnValue({
      session: { loaded: true, isAdmin: false, hasClientSession: false },
    });

    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 5, values: [null, "Cumin", "T", "P", 7] }],
      fav_ids: [],
    });

    render(<Spices />);

    expect(await screen.findByText("Cumin")).toBeInTheDocument();

    await userEvent.click(screen.getByText("❤"));

    expect(navigateMock).toHaveBeenCalledWith("/login");
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("user with client session: clicking heart calls POST /favorites/add_del/:id/ and toggles", async () => {
    useAuthMock.mockReturnValue({
      session: { loaded: true, isAdmin: false, hasClientSession: true },
    });

    apiFetchMock
      .mockResolvedValueOnce({
        rows: [{ id: 9, values: [null, "Pepper", "T", "P", 10] }],
        fav_ids: [],
      })
      .mockResolvedValueOnce({ ok: true }); // POST add/del

    render(<Spices />);

    expect(await screen.findByText("Pepper")).toBeInTheDocument();

    await userEvent.click(screen.getByText("❤"));

    expect(apiFetchMock).toHaveBeenCalledWith("/favorites/add_del/9/", {
      method: "POST",
      body: {},
    });
  });

  it("admin: no heart, clicking a card navigates to /spices/edit/:id", async () => {
    useAuthMock.mockReturnValue({
      session: { loaded: true, isAdmin: true, hasClientSession: false },
    });

    apiFetchMock.mockResolvedValueOnce({
      rows: [{ id: 11, values: [null, "Saffron", "T", "P", 99] }],
      fav_ids: [],
    });

    render(<Spices />);

    const name = await screen.findByText("Saffron");

    expect(screen.queryByText("❤")).not.toBeInTheDocument();

    await userEvent.click(name);

    expect(navigateMock).toHaveBeenCalledWith("/spices/edit/11");
  });
});