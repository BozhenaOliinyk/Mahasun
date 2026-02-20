import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Suppliers() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;

    if (session?.loaded && !session.isAdmin) {
      navigate("/spices", { replace: true });
      return;
    }

    (async () => {
      try {
        const data = await apiFetch("/suppliers/", { method: "GET" });
        const r = Array.isArray(data?.rows) ? data.rows : [];
        if (alive) setRows(r);
      } catch (err) {
        if (alive) setError(err?.message || "Не вдалося завантажити постачальників");
      }
    })();

    return () => {
      alive = false;
    };
  }, [session?.loaded, session?.isAdmin, navigate]);

  const errorNode = useMemo(() => {
    if (!error) return null;
    return (
      <div className="error-message" role="alert">
        <p>{error}</p>
      </div>
    );
  }, [error]);

  function openEdit(id) {
    navigate(`/suppliers/${id}/edit`);
  }

  function openSpices(id) {
    navigate(`/suppliers/${id}/spices`);
  }

  return (
    <main className="employees-page">
      <header className="page-header">
        <h1 className="visually-hidden">Постачальники</h1>
        <Link to="/suppliers/new" className="admin-add-btn" aria-label="Додати постачальника">+</Link>
      </header>

      {errorNode}

      <section className="long-list" id="suppliers-list">
        {rows.map((row) => {
          const values = Array.isArray(row.values) ? row.values : [];
          const id = row.id;

          return (
            <article
              key={id}
              className="long-card employee-card"
              role="button"
              tabIndex={0}
              onClick={() => openEdit(id)}
              onKeyDown={(e) => e.key === "Enter" && openEdit(id)}
            >
              <section className="card-details">
                <header className="employee-name">
                  <h2 className="employee-fullname">{values[1] || ""}</h2>
                </header>

                <div className="employee-info">
                  <p className="kv-line">
                    <span className="kv-label">Адреса:</span>{" "}
                    <span className="kv-value">{values[2] || ""}</span>
                  </p>
                  <p className="kv-line">
                    <span className="kv-label">Телефон:</span>{" "}
                    <span className="kv-value">{values[3] || ""}</span>
                  </p>

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn-main btn-outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openSpices(id);
                      }}
                    >
                      Спеції постачальника
                    </button>
                  </div>
                </div>
              </section>
            </article>
          );
        })}
      </section>
    </main>
  );
}
