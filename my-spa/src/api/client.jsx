export async function apiFetch(path, { method = "GET", body = null } = {}) {
  const url = `/_api${path}`;

  const headers = { Accept: "application/json" };
  const init = {
    method,
    headers,
    credentials: "include",
  };

  if (body !== null) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message = data?.error ? data.error : `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}