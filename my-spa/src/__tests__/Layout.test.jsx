import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Layout from "../components/Layout.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: "/spices" }),
    Outlet: () => <div data-testid="outlet" />,
  };
});

const useAuthMock = vi.fn();
vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const useSessionMock = vi.fn();
vi.mock("../hooks/useSession", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("../components/Navbar", () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock("../components/MobileMenu", () => ({
  default: () => <div data-testid="mobile-menu" />,
}));

vi.mock("../components/FavoritesPanel", () => ({
  default: ({ isOpen }) =>
    isOpen ? <div data-testid="favorites-panel">OPEN</div> : null,
}));

describe("Layout (header behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();

    useSessionMock.mockReturnValue({
      loadSession: vi.fn(),
    });
  });

  it("non-admin (logged in): shows ❤ and opens FavoritesPanel on click", async () => {
    useAuthMock.mockReturnValue({
      session: { isAdmin: false, hasClientSession: true },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const heart = screen.getByText("❤");
    expect(heart).toBeInTheDocument();

    expect(screen.queryByTestId("favorites-panel")).not.toBeInTheDocument();

    await userEvent.click(heart);

    expect(screen.getByTestId("favorites-panel")).toBeInTheDocument();
  });

  it("admin: does NOT show ❤", () => {
    useAuthMock.mockReturnValue({
      session: { isAdmin: true, hasClientSession: false },
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.queryByText("❤")).not.toBeInTheDocument();
  });

  it("admin: clicking avatar triggers logout and navigates to /login (replace)", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);

    useAuthMock.mockReturnValue({
      session: { isAdmin: true, hasClientSession: false },
      logout,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const adminAvatar = screen.getByAltText("Адмін");
    await userEvent.click(adminAvatar);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("client session: clicking avatar navigates to /profile (no logout)", async () => {
    const logout = vi.fn();

    useAuthMock.mockReturnValue({
      session: { isAdmin: false, hasClientSession: true },
      logout,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const profileAvatar = screen.getByAltText("Профіль");
    await userEvent.click(profileAvatar);

    expect(logout).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });

  it("guest: clicking avatar navigates to /login", async () => {
    const logout = vi.fn();

    useAuthMock.mockReturnValue({
      session: { isAdmin: false, hasClientSession: false },
      logout,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    const guestAvatar = screen.getByAltText("User");
    await userEvent.click(guestAvatar);

    expect(logout).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});