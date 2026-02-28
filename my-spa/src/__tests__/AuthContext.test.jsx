import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';

vi.mock('../api/client', () => ({
  apiFetch: vi.fn()
}));

import { apiFetch } from '../api/client';

function Probe() {
  const { session, refreshSession, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="loaded">{String(session.loaded)}</div>
      <div data-testid="isAdmin">{String(session.isAdmin)}</div>
      <button onClick={() => refreshSession()}>refresh</button>
      <button onClick={() => login({ email: 'a@b.c', password: 'x' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshSession sets session flags on success', async () => {
    apiFetch.mockResolvedValueOnce({
      is_admin: true,
      is_authenticated: true,
      has_client_session: false
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByTestId('loaded')).toHaveTextContent('false');

    screen.getByText('refresh').click();

    await screen.findByText('refresh');

    expect(screen.getByTestId('loaded')).toHaveTextContent('true');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
    expect(apiFetch).toHaveBeenCalledWith('/session/', { method: 'GET' });
  });

  it('refreshSession sets empty session on failure', async () => {
    apiFetch.mockRejectedValueOnce(new Error('network'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    screen.getByText('refresh').click();
    await screen.findByText('refresh');

    expect(screen.getByTestId('loaded')).toHaveTextContent('true');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
  });

  it('login calls /login/ POST with payload', async () => {
    apiFetch.mockResolvedValueOnce({ ok: true });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    screen.getByText('login').click();
    await screen.findByText('login');

    expect(apiFetch).toHaveBeenCalledWith('/login/', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'x' }
    });
  });

  it('logout calls /logout/ then refreshSession', async () => {
    apiFetch
      .mockResolvedValueOnce({ ok: true }) // logout
      .mockResolvedValueOnce({ is_admin: false, is_authenticated: false, has_client_session: false }); // session

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    screen.getByText('logout').click();
    await screen.findByText('logout');

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/logout/', { method: 'POST', body: {} });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/session/', { method: 'GET' });
  });
});