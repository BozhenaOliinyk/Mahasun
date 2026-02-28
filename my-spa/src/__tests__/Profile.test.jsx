import React from "react";
import {describe, it, expect, vi, beforeEach} from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Profile from "../pages/Profile.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {...actual, useNavigate: () => navigateMock};
});

const apiFetchMock = vi.fn();
vi.mock("../api/client", () => ({
    apiFetch: (...args) => apiFetchMock(...args),
}));

const loadSessionMock = vi.fn();
vi.mock("../hooks/useSession", () => ({
    useSession: () => ({loadSession: loadSessionMock}),
}));

describe("Profile page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        navigateMock.mockClear();
    });

    it("loads profile from /profile/ GET and displays bonus fields", async () => {
        apiFetchMock.mockResolvedValueOnce({
            last_name: "Іваненко",
            first_name: "Іван",
            fathers_name: "Іванович",
            phone_number: "0990000000",
            bonus_card_type: "pro",
            bonus_count: 123,
        });

        render(<Profile/>);

        expect(await screen.findByText("Мій профіль")).toBeInTheDocument();

        expect(apiFetchMock).toHaveBeenCalledTimes(1);
        expect(apiFetchMock).toHaveBeenCalledWith("/profile/", {method: "GET"});

        expect(screen.getByText(/Тип картки:/i)).toBeInTheDocument();
        expect(screen.getByText("pro")).toBeInTheDocument();
        expect(screen.getByText(/Нараховано бонусів:/i)).toBeInTheDocument();
        expect(screen.getByText("123")).toBeInTheDocument();

        expect(screen.getByLabelText("Прізвище")).toHaveValue("Іваненко");
        expect(screen.getByLabelText("Ім'я")).toHaveValue("Іван");
        expect(screen.getByLabelText("По батькові")).toHaveValue("Іванович");
        expect(screen.getByLabelText("Телефон")).toHaveValue("0990000000");
    });

    it("submits profile save -> POST /profile/ with body and navigates /profile", async () => {
        apiFetchMock
            .mockResolvedValueOnce({
                last_name: "Іваненко",
                first_name: "Іван",
                fathers_name: "Іванович",
                phone_number: "0990000000",
                bonus_card_type: "pro",
                bonus_count: 10,
            })
            .mockResolvedValueOnce({ok: true});

        const user = userEvent.setup();
        render(<Profile/>);

        await screen.findByText(/Тип картки:/i);
        expect(screen.getByText("pro")).toBeInTheDocument();

        const ln = screen.getByLabelText("Прізвище");
        await user.clear(ln);
        await user.type(ln, "Петренко");

        const saveBtn = screen.getByRole("button", {name: "Зберегти зміни"});
        await user.click(saveBtn);

        expect(apiFetchMock).toHaveBeenCalledTimes(2);

        expect(apiFetchMock).toHaveBeenNthCalledWith(1, "/profile/", {method: "GET"});

        expect(apiFetchMock).toHaveBeenNthCalledWith(2, "/profile/", {
            method: "POST",
            body: {
                ln: "Петренко",
                fn: "Іван",
                mn: "Іванович",
                phone: "0990000000",
            },
        });

        expect(navigateMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith("/profile");
    });

    it("logout button -> POST /logout/ (ignore errors) -> loadSession -> navigate /login", async () => {
        apiFetchMock
            .mockResolvedValueOnce({
                last_name: "A",
                first_name: "B",
                fathers_name: "C",
                phone_number: "1",
                bonus_card_type: "",
                bonus_count: 0,
            })
            .mockRejectedValueOnce(new Error("logout failed"));

        loadSessionMock.mockResolvedValueOnce(undefined);

        const user = userEvent.setup();
        render(<Profile/>);

        await screen.findByText("Мій профіль");

        const logoutBtn = screen.getByRole("button", {name: "Вийти з акаунту"});
        await user.click(logoutBtn);

        expect(apiFetchMock).toHaveBeenCalledTimes(2);

        expect(apiFetchMock).toHaveBeenNthCalledWith(1, "/profile/", {method: "GET"});

        expect(apiFetchMock).toHaveBeenNthCalledWith(2, "/logout/", {method: "POST", body: {}});

        expect(loadSessionMock).toHaveBeenCalledTimes(1);

        expect(navigateMock).toHaveBeenCalledTimes(1);
        expect(navigateMock).toHaveBeenCalledWith("/login");
    });
});