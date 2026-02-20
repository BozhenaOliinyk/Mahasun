import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function SupplierSpices() {
  const { session } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const supplierId = Number(id);

  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (session?.loaded && !session.isAdmin) {
      navigate("/spices", { replace: true });
    }
  }, [session?.loaded, session?.isAdmin, navigate]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await apiFetch(`/suppliers/${supplierId}/spices/`, { method: "GET" });
        if (!alive) return;
        setData(res);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Не вдалося завантажити спеції постачальника");
      }
    })();

    return () => {
      alive = false;
    };
  }, [supplierId]);

  const errorNode = useMemo(() => {
    if (!error) return null;
    return (
      <div className="error-message" role="alert">
        <p>{error}</p>
      </div>
    );
  }, [error]);

  const supplierName = data?.supplier_name || "Постачальник";
  const spices = Array.isArray(data?.spices) ? data.spices : [];

  if (!data && !error) return null;

  return (
    <main className="content-container">
      <header className="page-header">
        <h1 className="visually-hidden">Спеції постачальника</h1>
      </header>

      {errorNode}

      {data && (
        <section className="long-list">
          <article className="long-card">
            <section className="card-details">
              <header className="outlet-title">
                <h2>{supplierName}</h2>
              </header>

              {spices.length === 0 ? (
                <p className="muted">Немає спецій.</p>
              ) : (
                <ul className="inline-list">
                  {spices.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="inline-list__item">
                      {String(s)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </article>
        </section>
      )}

      <nav className="navigation-actions">
        <Link to="/suppliers" className="btn-main btn-outline">
          Назад
        </Link>
      </nav>
    </main>
  );
}
