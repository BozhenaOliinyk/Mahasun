import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '../api/client.jsx';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends JSON body when body is not null', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true })
    }));

    const res = await apiFetch('/ping/', { method: 'POST', body: { a: 1 } });

    expect(res).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toBe('/_api/ping/');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers.Accept).toBe('application/json');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('parses non-JSON response into {raw}', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'plain text'
    }));

    const res = await apiFetch('/text/', { method: 'GET' });
    expect(res).toEqual({ raw: 'plain text' });
  });

  it('throws Error with data.error when response is not ok', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'Bad request' })
    }));

    await expect(apiFetch('/fail/', { method: 'GET' })).rejects.toMatchObject({
      message: 'Bad request',
      status: 400,
      data: { error: 'Bad request' }
    });
  });

  it('throws Error with HTTP status when response is not ok and no data.error', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ nope: true })
    }));

    await expect(apiFetch('/fail2/', { method: 'GET' })).rejects.toMatchObject({
      message: 'HTTP 500',
      status: 500
    });
  });

  it('returns null when response body is empty', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 204,
      text: async () => ''
    }));

    const res = await apiFetch('/empty/', { method: 'GET' });
    expect(res).toBeNull();
  });
});