import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Navbar from "../components/Navbar.jsx";

const useAuthMock = vi.fn();
vi.mock("../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("for non-admin shows only base links", () => {
    useAuthMock.mockReturnValue({
      session: { isAdmin: false },
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("Спеції")).toBeInTheDocument();
    expect(screen.getByText("Бонусні картки")).toBeInTheDocument();
    expect(screen.getByText("Торгові точки")).toBeInTheDocument();
    expect(screen.queryByText("Працівники")).not.toBeInTheDocument();
    expect(screen.queryByText("Постачальники")).not.toBeInTheDocument();
    expect(screen.queryByText("Клієнти")).not.toBeInTheDocument();
  });

  it("for admin shows extra links (Employees/Suppliers/Clients)", () => {
    useAuthMock.mockReturnValue({
      session: { isAdmin: true },
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("Спеції")).toBeInTheDocument();
    expect(screen.getByText("Бонусні картки")).toBeInTheDocument();
    expect(screen.getByText("Торгові точки")).toBeInTheDocument();
    expect(screen.getByText("Працівники")).toBeInTheDocument();
    expect(screen.getByText("Постачальники")).toBeInTheDocument();
    expect(screen.getByText("Клієнти")).toBeInTheDocument();
  });
});