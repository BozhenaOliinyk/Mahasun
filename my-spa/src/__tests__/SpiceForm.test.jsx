import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import SpiceForm from "../pages/SpiceForm.jsx";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const apiFetchMock = vi.fn();
vi.mock("../api/client", () => ({
  apiFetch: (...args) => apiFetchMock(...args),
}));

describe("SpiceForm page (create/edit/delete)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("CREATE: submits form -> POST /spices/add/ with body -> navigates /spices", async () => {
    apiFetchMock.mockResolvedValueOnce({ ok: true });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/spices/add"]}>
        <Routes>
          <Route path="/spices/add" element={<SpiceForm mode="add" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Створення спеції")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Назва спеції"), "Paprika");
    await user.type(screen.getByLabelText("Вид спеції"), "Powder");
    await user.type(screen.getByLabelText("Призначення"), "For meat");
    await user.type(screen.getByLabelText("Ціна (грн / 100 гр)"), "12.5");
    await user.type(screen.getByLabelText("Назва постачальника"), "Supplier A");

    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/spices/add/", {
      method: "POST",
      body: {
        name: "Paprika",
        type: "Powder",
        purpose: "For meat",
        price: "12.5",
        supplier_name: "Supplier A",
      },
    });

    expect(navigateMock).toHaveBeenCalledWith("/spices");
  });

  it("EDIT: loads existing spice -> submits -> POST /spices/edit/:id/ -> navigates /spices", async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        name: "Cumin",
        type: "Seeds",
        purpose: "Soup",
        price: 7,
        current_supplier: "Supplier X",
      })
      .mockResolvedValueOnce({ ok: true });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/spices/edit/11"]}>
        <Routes>
          <Route path="/spices/edit/:id" element={<SpiceForm mode="edit" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Редагування спеції")).toBeInTheDocument();

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, "/spices/11/", { method: "GET" });

    expect(screen.getByLabelText("Назва спеції")).toHaveValue("Cumin");
    expect(screen.getByLabelText("Вид спеції")).toHaveValue("Seeds");
    expect(screen.getByLabelText("Призначення")).toHaveValue("Soup");
    expect(screen.getByLabelText("Ціна (грн / 100 гр)")).toHaveValue(7);
    expect(screen.getByLabelText("Назва постачальника")).toHaveValue("Supplier X");

    await user.clear(screen.getByLabelText("Назва спеції"));
    await user.type(screen.getByLabelText("Назва спеції"), "Cumin NEW");

    await user.click(screen.getByRole("button", { name: "Зберегти" }));

    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, "/spices/edit/11/", {
      method: "POST",
      body: {
        name: "Cumin NEW",
        type: "Seeds",
        purpose: "Soup",
        price: "7",
        supplier_name: "Supplier X",
      },
    });

    expect(navigateMock).toHaveBeenCalledWith("/spices");
  });

  it("EDIT: delete -> confirm yes -> POST /spices/delete/:id/ -> navigates /spices", async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        name: "Saffron",
        type: "Threads",
        purpose: "Rice",
        price: 99,
        current_supplier: "Supplier Z",
      })
      .mockResolvedValueOnce({ ok: true });

    window.confirm.mockReturnValueOnce(true);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/spices/edit/5"]}>
        <Routes>
          <Route path="/spices/edit/:id" element={<SpiceForm mode="edit" />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Редагування спеції");

    const deleteBtn = screen.getByRole("button", { name: "Видалити" });
    await user.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith("Видалити спецію?");

    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, "/spices/delete/5/", {
      method: "POST",
      body: {},
    });

    expect(navigateMock).toHaveBeenCalledWith("/spices");
  });

  it("EDIT: delete -> confirm NO -> does not call delete endpoint", async () => {
    apiFetchMock.mockResolvedValueOnce({
      name: "Pepper",
      type: "Ground",
      purpose: "Universal",
      price: 10,
      current_supplier: "Supplier Y",
    });

    window.confirm.mockReturnValueOnce(false);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/spices/edit/9"]}>
        <Routes>
          <Route path="/spices/edit/:id" element={<SpiceForm mode="edit" />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("Редагування спеції");

    await user.click(screen.getByRole("button", { name: "Видалити" }));

    expect(window.confirm).toHaveBeenCalledWith("Видалити спецію?");
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/spices/9/", { method: "GET" });
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

// npm i
// npm run test
// npm run coverage