import React from "react";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Clients from "../pages/Clients.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {...actual, useNavigate: () => navigateMock};
});

const apiFetchMock = vi.fn();
vi.mock("../api/client", () => ({
    apiFetch: (...args) => apiFetchMock(...args),
}));

const useAuthMock = vi.fn();
vi.mock("../context/AuthContext.jsx", () => ({
    useAuth: () => useAuthMock(),
}));

describe("Clients page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, "confirm").mockReturnValue(true);
        vi.spyOn(window, "alert").mockImplementation(() => {
        });
    });

    it("non-admin (loaded): redirects to /spices (replace)", async () => {
        useAuthMock.mockReturnValue({
            session: {loaded: true, isAdmin: false, hasClientSession: true},
        });

        render(<Clients/>);

        expect(navigateMock).toHaveBeenCalledWith("/spices", {replace: true});
        expect(apiFetchMock).not.toHaveBeenCalled();
    });

    it("admin: loads /clients/ and renders rows", async () => {
        useAuthMock.mockReturnValue({
            session: {loaded: true, isAdmin: true, hasClientSession: false},
        });

        apiFetchMock.mockResolvedValueOnce({
            rows: [
                {
                    id: 101,
                    values: [null, "Іваненко", "Іван", "Іванович", "pro", 50, "ivan@example.com"],
                },
            ],
        });

        render(<Clients/>);

        expect(await screen.findByText("Список клієнтів")).toBeInTheDocument();
        expect(apiFetchMock).toHaveBeenCalledWith("/clients/", {method: "GET"});

        expect(await screen.findByText("Іваненко Іван Іванович")).toBeInTheDocument();
        expect(screen.getByText(/Тип картки:/)).toBeInTheDocument();
        expect(screen.getByText("pro")).toBeInTheDocument();
        expect(screen.getByText(/Кількість бонусів:/)).toBeInTheDocument();
        expect(screen.getByText("50")).toBeInTheDocument();
        expect(screen.getByText("ivan@example.com")).toBeInTheDocument();
    });

    it("admin: deletes client after confirm -> POST /clients/:id/delete/ and removes from list", async () => {
        useAuthMock.mockReturnValue({
            session: {loaded: true, isAdmin: true, hasClientSession: false},
        });

        apiFetchMock
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 202,
                        values: [null, "Петренко", "Петро", "", "new", 5, "petro@example.com"],
                    },
                ],
            })
            .mockResolvedValueOnce({ok: true});

        render(<Clients/>);

        expect(await screen.findByText("Петренко Петро")).toBeInTheDocument();

        const delBtn = screen.getByRole("button", {name: "Видалити"});
        await userEvent.click(delBtn);

        expect(window.confirm).toHaveBeenCalledWith("Видалити клієнта?");
        expect(apiFetchMock).toHaveBeenCalledWith("/clients/202/delete/", {
            method: "POST",
            body: {},
        });

        expect(screen.queryByText("Петренко Петро")).not.toBeInTheDocument();
    });
});