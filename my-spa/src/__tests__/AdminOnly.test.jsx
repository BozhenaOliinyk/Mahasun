import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import AdminOnly from "../components/AdminOnly.jsx";

const navigateMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate">GO:{to}</div>,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => useAuthMock(),
}));

describe("AdminOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when session not loaded", () => {
    useAuthMock.mockReturnValue({ session: { loaded: false, isAdmin: false } });

    const { container } = render(
      <AdminOnly>
        <div>SECRET</div>
      </AdminOnly>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("redirects non-admin to fallbackTo (default /spices)", () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: false } });

    render(
      <AdminOnly>
        <div>SECRET</div>
      </AdminOnly>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("GO:/spices");
    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });

  it("renders children for admin", () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: true } });

    render(
      <AdminOnly>
        <div>SECRET</div>
      </AdminOnly>
    );

    expect(screen.getByText("SECRET")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("redirects non-admin to custom fallbackTo", () => {
    useAuthMock.mockReturnValue({ session: { loaded: true, isAdmin: false } });

    render(
      <AdminOnly fallbackTo="/login">
        <div>SECRET</div>
      </AdminOnly>
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("GO:/login");
  });
});