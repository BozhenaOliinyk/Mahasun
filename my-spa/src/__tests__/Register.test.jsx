import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Register from "../pages/Register.jsx";

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

const loadSessionMock = vi.fn();
vi.mock("../hooks/useSession", () => ({
  useSession: () => ({ loadSession: loadSessionMock }),
}));

describe("Register page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
  });

  it("submits registration -> POST /register/ with current form -> loadSession -> navigate /profile", async () => {
    apiFetchMock.mockResolvedValueOnce({ ok: true });
    loadSessionMock.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<Register />);

    await user.type(screen.getByLabelText("Пошта"), "a@b.com");
    await user.type(screen.getByLabelText("Пароль"), "pass1234");
    await user.type(screen.getByLabelText("Прізвище"), "Іваненко");
    await user.type(screen.getByLabelText("Ім'я"), "Іван");
    await user.type(screen.getByLabelText("Номер телефону"), "0990000000");
    await user.type(screen.getByLabelText("По батькові"), "Іванович");

    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(1);
    });

    expect(apiFetchMock).toHaveBeenCalledWith("/register/", {
      method: "POST",
      body: {
        email: "a@b.com",
        password: "pass1234",
        last_name: "Іваненко",
        first_name: "Іван",
        fathers_name: "Іванович",
        phone_number: "0990000000",
      },
    });

    await waitFor(() => {
      expect(loadSessionMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith("/profile");
    });
  });

  it("shows API error text when registration fails", async () => {
    apiFetchMock.mockRejectedValueOnce(new Error("Помилка реєстрації з бекенду"));

    const user = userEvent.setup();
    render(<Register />);

    await user.type(screen.getByLabelText("Пошта"), "a@b.com");
    await user.type(screen.getByLabelText("Пароль"), "pass1234");
    await user.type(screen.getByLabelText("Прізвище"), "Іваненко");
    await user.type(screen.getByLabelText("Ім'я"), "Іван");
    await user.type(screen.getByLabelText("Номер телефону"), "0990000000");

    await user.click(screen.getByRole("button", { name: "Зареєструватись" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Помилка реєстрації з бекенду"
    );

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(loadSessionMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});