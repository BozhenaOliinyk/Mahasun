import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import MobileMenu from "../components/MobileMenu.jsx";

const useAuthMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("MobileMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows base links for regular user", () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: false } });

    render(
      <MemoryRouter>
        <MobileMenu />
      </MemoryRouter>
    );

    const nav = screen.getByRole("navigation", { name: "Мобільне меню", hidden: true });
    const scope = within(nav);

    expect(scope.getByRole("link", { name: "Спеції", hidden: true })).toHaveAttribute("href", "/spices");
    expect(scope.getByRole("link", { name: "Бонусні картки", hidden: true })).toHaveAttribute("href", "/cards");
    expect(scope.getByRole("link", { name: "Торгові точки", hidden: true })).toHaveAttribute("href", "/outlets");

    expect(scope.queryByRole("link", { name: "Працівники", hidden: true })).not.toBeInTheDocument();
    expect(scope.queryByRole("link", { name: "Постачальники", hidden: true })).not.toBeInTheDocument();
    expect(scope.queryByRole("link", { name: "Клієнти", hidden: true })).not.toBeInTheDocument();

    const img = screen.getByAltText("Профіль", { hidden: true });
    expect(img).toHaveAttribute("src", "/static/images/default_user.jpg");
  });

  it("shows extra links for admin", () => {
    useAuthMock.mockReturnValue({ session: { isAdmin: true } });

    render(
      <MemoryRouter>
        <MobileMenu />
      </MemoryRouter>
    );

    const nav = screen.getByRole("navigation", { name: "Мобільне меню", hidden: true });
    const scope = within(nav);

    expect(scope.getByRole("link", { name: "Працівники", hidden: true })).toHaveAttribute("href", "/employees");
    expect(scope.getByRole("link", { name: "Постачальники", hidden: true })).toHaveAttribute("href", "/suppliers");
    expect(scope.getByRole("link", { name: "Клієнти", hidden: true })).toHaveAttribute("href", "/clients");

    const img = screen.getByAltText("Профіль", { hidden: true });
    expect(img).toHaveAttribute("src", "/static/images/admin_icon.jpg");
  });
});