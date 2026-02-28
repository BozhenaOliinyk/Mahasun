import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

function buildName(value) {
  return String(value || "");
}

function uniqSorted(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
    String(a).localeCompare(String(b), "uk", { sensitivity: "base" })
  );
}

export default function Spices() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [rows, setRows] = useState([]);
  const [favIds, setFavIds] = useState(new Set());
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const typeOptions = useMemo(() => {
    const types = rows.map((r) => (Array.isArray(r.values) ? r.values[2] : "")).map(String);
    return uniqSorted(types);
  }, [rows]);

  const purposeOptions = useMemo(() => {
    const purposes = rows.map((r) => (Array.isArray(r.values) ? r.values[3] : "")).map(String);
    return uniqSorted(purposes);
  }, [rows]);

  const load = async () => {
    setError("");
    try {
      const search = debouncedQ.trim();
      const hasFilters =
        purpose.trim() || type.trim() || String(priceMin).trim() || String(priceMax).trim();

      let url = "/spices/";

      if (search) {
        const params = new URLSearchParams({ q: search });
        url = `/spices/search/?${params.toString()}`;
      } else if (hasFilters) {
        const params = new URLSearchParams();
        if (purpose.trim()) params.set("purpose", purpose.trim());
        if (type.trim()) params.set("type", type.trim());
        if (String(priceMin).trim()) params.set("price_min", String(priceMin).trim());
        if (String(priceMax).trim()) params.set("price_max", String(priceMax).trim());
        url = `/spices/filter/?${params.toString()}`;
      }

      const data = await apiFetch(url, { method: "GET" });
      const r = Array.isArray(data?.rows) ? data.rows : [];
      const fav = Array.isArray(data?.fav_ids) ? data.fav_ids : [];
      setRows(r);
      setFavIds(new Set(fav));
    } catch (err) {
      setError(err?.message || "Не вдалося завантажити спеції");
    }
  };

  useEffect(() => {
    load();
  }, [debouncedQ, type, purpose, priceMin, priceMax, session?.isAdmin]);

  const onToggleFav = async (spiceId) => {
    if (session.isAdmin) return;
    if (!session.hasClientSession) {
      navigate("/login");
      return;
    }

    try {
      await apiFetch(`/favorites/add_del/${spiceId}/`, { method: "POST", body: {} });
      setFavIds((prev) => {
        const next = new Set(prev);
        if (next.has(spiceId)) next.delete(spiceId);
        else next.add(spiceId);
        return next;
      });
    } catch (err) {
      window.alert(err?.message || "Помилка");
    }
  };

  return (
    <main className="catalog-page">
      <header className="page-header">
        <h1 className="visually-hidden">Каталог спецій</h1>

        <div className="page-header-row">
          <div>
            <input
              className="search"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук спеції"
              aria-label="Пошук спеції"
            />
          </div>

            <select
              className="filter"
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-label="Фільтр за типом"
            >
              <option value="">Тип</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              className="filter"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              aria-label="Фільтр за призначенням"
            >
              <option value="">Призначення</option>
              {purposeOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <input
              className="filter"
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Ціна від"
              aria-label="Мінімальна ціна"
              min="0"
              step="0.01"
            />

            <input
              className="filter"
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Ціна до"
              aria-label="Максимальна ціна"
              min="0"
              step="0.01"
            />

          {session.isAdmin ? (
            <Link to="/spices/add" className="admin-add-btn" aria-label="Додати спецію">
              +
            </Link>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="error-message" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="spice-grid">
        {rows.map((row) => {
          const values = Array.isArray(row.values) ? row.values : [];
          const spiceId = row.id;

          const name = buildName(values[1]);
          const t = String(values[2] || "");
          const p = String(values[3] || "");
          const price = String(values[4] || "");

          return (
            <article
              key={spiceId}
              className="spice-card"
              role="button"
              tabIndex={0}
              onClick={() => {
                if (session.isAdmin) navigate(`/spices/edit/${spiceId}`);
              }}
              onKeyDown={(e) => {
                if (session.isAdmin && e.key === "Enter") navigate(`/spices/edit/${spiceId}`);
              }}
            >
              <figure className="spice-image-container">
                <img src="/static/images/placeholder.jpg" className="spice-img" alt={name} />
              </figure>

              <div className="spice-content">
                <header className="spice-header">
                  <h3 className="spice-title">{name}</h3>
                </header>

                <p className="spice-meta">{t}</p>
                <p className="spice-meta">{p}</p>

                <footer className="spice-footer">
                  <p className="spice-price">
                    <span>{price}</span> <span className="price-unit">грн / 100 гр</span>
                  </p>
                </footer>
              </div>

              {!session.isAdmin ? (
                <a
                  href="#"
                  className={`fav-heart-btn ${favIds.has(spiceId) ? "active" : ""}`}
                  aria-label="Додати в обране"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFav(spiceId);
                  }}
                >
                  ❤
                </a>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}