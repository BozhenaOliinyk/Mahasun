import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Outlets() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await apiFetch("/outlets/", { method: "GET" });
        const r = Array.isArray(data?.rows) ? data.rows : [];
        if (alive) setRows(r);
      } catch (err) {
        if (alive) setError(err?.message || "Не вдалося завантажити торгові точки");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const errorNode = useMemo(() => {
    if (!error) return null;
    return (
      <div className="error-message" role="alert">
        <p>{error}</p>
      </div>
    );
  }, [error]);

  function openEdit(id) {
    if (!session.isAdmin) return;
    navigate(`/outlets/${id}/edit`);
  }

  return (
    <main className="outlets-page">
      <header className="page-header">
        <h1 className="visually-hidden">Наші торгові точки</h1>

        {session.isAdmin && (
          <Link to="/outlets/new" className="admin-add-btn" aria-label="Додати торгову точку">+</Link>
        )}
      </header>

      {errorNode}

      <section className="long-list" id="outlets-list">
        {rows.map((row) => {
          const values = Array.isArray(row.values) ? row.values : [];
          const id = row.id;

          return (
            <article
              key={id}
              className="long-card"
              role="button"
              tabIndex={0}
              onClick={() => openEdit(id)}
              onKeyDown={(e) => e.key === "Enter" && openEdit(id)}
            >
              <figure className="card-image-wrapper">
                <img src="/static/images/outlet_placeholder.jpg" alt={`Торгова точка ${values[1] || ""}`} />
              </figure>

              <section className="card-details">
                <header className="outlet-title">
                  <h2>{values[1] || ""}</h2>
                </header>
                <p className="outlet-address">{values[2] || ""}</p>
              </section>
            </article>
          );
        })}
      </section>
    </main>
  );
}
