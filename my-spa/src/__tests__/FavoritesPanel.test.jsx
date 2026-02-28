import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/client", () => ({ apiFetch: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FavoritesPanel from "../components/FavoritesPanel.jsx";

describe("FavoritesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("shows guest message when not logged in", () => {
    useAuth.mockReturnValue({ session: { hasClientSession: false, isAdmin: false } });

    render(
      <MemoryRouter>
        <FavoritesPanel isOpen onChanged={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Улюблені доступні після входу/i)).toBeInTheDocument();
  });

  it("loads and renders favorites when open and client session", async () => {
    useAuth.mockReturnValue({ session: { hasClientSession: true, isAdmin: false } });

    apiFetch.mockResolvedValueOnce({
      favorites: [{ spice_id: 1, name: "Pepper", price: 10 }],
    });

    render(
      <MemoryRouter>
        <FavoritesPanel isOpen onChanged={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Pepper/i)).toBeInTheDocument();
    expect(screen.getByText(/10 грн/i)).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith("/favorites/", { method: "GET" });
  });

  it("shows error on load failure", async () => {
    useAuth.mockReturnValue({ session: { hasClientSession: true, isAdmin: false } });

    apiFetch.mockRejectedValueOnce(new Error("fail"));

    render(
      <MemoryRouter>
        <FavoritesPanel isOpen onChanged={vi.fn()} />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Не вдалося завантажити улюблені/i)).toBeInTheDocument();
  });

  it("deletes favorite (POST) then reloads and calls onChanged", async () => {
    useAuth.mockReturnValue({ session: { hasClientSession: true, isAdmin: false } });

    apiFetch
      .mockResolvedValueOnce({
        favorites: [{ spice_id: 5, name: "Cumin", price: 7 }],
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ favorites: [] });

    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FavoritesPanel isOpen onChanged={onChanged} />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Cumin/i)).toBeInTheDocument();

    await user.click(screen.getByText("❤"));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/favorites/add_del/5/", { method: "POST", body: {} });
    });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/favorites/", { method: "GET" });
    });

    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});