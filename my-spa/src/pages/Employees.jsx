import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function Employees() {
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
        const data = await apiFetch("/employees/", { method: "GET" });
        const r = Array.isArray(data?.rows) ? data.rows : [];
        if (alive) setRows(r);
      } catch (err) {
        if (alive) setError(err?.message || "Не вдалося завантажити працівників");
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
    navigate(`/employees/${id}/edit`);
  }

  return (
    <main className="employees-page">
      <header className="page-header">
        <h1 className="visually-hidden">Список працівників</h1>
        <Link to="/employees/new" className="admin-add-btn" aria-label="Додати працівника">+</Link>
      </header>

      {errorNode}

      <section className="long-list" id="employees-list">
        {rows.map((row) => {
          const values = Array.isArray(row.values) ? row.values : [];
          const id = row.id;

          const fullname = `${values[1] || ""} ${values[2] || ""} ${values[3] || ""}`.trim();
          const position = values[4] || "";
          const shift = values[5] ? `Зміна: ${values[5]}` : "";
          const outlet = values[6] || "";
          const phone = values[7] || "";

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
                  <h2 className="employee-fullname">{fullname}</h2>
                </header>

                <div className="employee-info">
                  <p className="kv-line">
                    <span className="kv-label">Посада:</span>{" "}
                    <span className="kv-value">{position}</span>{" "}
                    <span className="kv-muted">{shift}</span>
                  </p>

                  <p className="kv-line">
                    <span className="kv-label">Торгова точка:</span>{" "}
                    <span className="kv-value">{outlet}</span>
                  </p>

                  <p className="kv-line">
                    <span className="kv-value">{phone}</span>
                  </p>
                </div>
              </section>
            </article>
          );
        })}
      </section>
    </main>
  );
}
