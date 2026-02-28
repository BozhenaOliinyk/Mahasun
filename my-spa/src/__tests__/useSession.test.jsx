import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../api/client', () => ({
  apiFetch: vi.fn()
}));
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../hooks/useSession.js';

function Probe() {
  const { loadSession } = useSession();
  return <button onClick={() => loadSession()}>load</button>;
}

describe('useSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets session flags on success', async () => {
    const setSession = vi.fn();
    useAuth.mockReturnValue({ setSession });

    apiFetch.mockResolvedValueOnce({
      is_admin: true,
      is_authenticated: true,
      has_client_session: false
    });

    render(<Probe />);
    screen.getByText('load').click();
    await screen.findByText('load');

    expect(apiFetch).toHaveBeenCalledWith('/session/', { method: 'GET' });
    expect(setSession).toHaveBeenCalledWith({
      isAdmin: true,
      isAuthenticated: true,
      hasClientSession: false,
      loaded: true
    });
  });

  it('sets empty session on failure', async () => {
    const setSession = vi.fn();
    useAuth.mockReturnValue({ setSession });

    apiFetch.mockRejectedValueOnce(new Error('fail'));

    render(<Probe />);
    screen.getByText('load').click();
    await screen.findByText('load');

    expect(setSession).toHaveBeenCalledWith({
      isAdmin: false,
      isAuthenticated: false,
      hasClientSession: false,
      loaded: true
    });
  });
});