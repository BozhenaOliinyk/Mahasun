import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigate,
    Link: (p) => <a href={p.to}>{p.children}</a>,
  };
});

vi.mock("../context/AuthContext.jsx", () => ({ useAuth: vi.fn() }));
import { useAuth } from "../context/AuthContext.jsx";
import Login from "../pages/Login.jsx";

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigate.mockClear();
  });

  it("submits form -> login, refreshSession, navigate to /spices", async () => {
    const login = vi.fn().mockResolvedValueOnce(undefined);
    const refreshSession = vi.fn().mockResolvedValueOnce(undefined);

    useAuth.mockReturnValue({
      login,
      refreshSession,
      session: { loaded: true, isAdmin: false },
    });

    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText("Пошта"), "a@b.com");
    await user.type(screen.getByLabelText("Пароль"), "pass1234");

    await user.click(screen.getByRole("button", { name: "Ввійти" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledTimes(1);
      expect(refreshSession).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith("/spices", { replace: true });
    });

    expect(login).toHaveBeenCalledWith({ email: "a@b.com", password: "pass1234" });
  });

  it("shows error if login fails", async () => {
    const login = vi.fn().mockRejectedValueOnce(new Error("bad"));
    const refreshSession = vi.fn();

    useAuth.mockReturnValue({
      login,
      refreshSession,
      session: { loaded: true, isAdmin: false },
    });

    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText("Пошта"), "a@b.com");
    await user.type(screen.getByLabelText("Пароль"), "pass1234");
    await user.click(screen.getByRole("button", { name: "Ввійти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("bad");
  });

  it("auto-redirects admin to /spices", async () => {
    useAuth.mockReturnValue({
      login: vi.fn(),
      refreshSession: vi.fn(),
      session: { loaded: true, isAdmin: true },
    });

    render(<Login />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/spices", { replace: true });
    });
  });
});