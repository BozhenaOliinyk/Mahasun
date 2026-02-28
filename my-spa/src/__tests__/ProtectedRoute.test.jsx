import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: (props) => <div data-testid="navigate" data-to={props.to} />
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext';

describe('ProtectedRoute', () => {
  it('returns null if session not loaded', () => {
    useAuth.mockReturnValue({ session: { loaded: false } });

    const { container } = render(
      <ProtectedRoute>
        <div>secret</div>
      </ProtectedRoute>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders children when allowed', () => {
    useAuth.mockReturnValue({
      session: { loaded: true, isAdmin: false, hasClientSession: true }
    });

    render(
      <ProtectedRoute clientOnly>
        <div>secret</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('redirects when adminOnly and not admin', () => {
    useAuth.mockReturnValue({
      session: { loaded: true, isAdmin: false, hasClientSession: true }
    });

    render(
      <ProtectedRoute adminOnly>
        <div>admin</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('admin')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });

  it('redirects when clientOnly and no client session', () => {
    useAuth.mockReturnValue({
      session: { loaded: true, isAdmin: false, hasClientSession: false }
    });

    render(
      <ProtectedRoute clientOnly>
        <div>client</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('client')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });
});