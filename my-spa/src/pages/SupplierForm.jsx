import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

function formToObject(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

export default function SupplierForm() {
  const { session } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const supplierId = Number(id);

  const [error, setError] = useState("");
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    if (session?.loaded && !session.isAdmin) {
      navigate("/spices", { replace: true });
    }
  }, [session?.loaded, session?.isAdmin, navigate]);

  useEffect(() => {
    let alive = true;

    if (!isEdit) return;

    (async () => {
      try {
        const obj = await apiFetch(`/suppliers/${supplierId}/`, { method: "GET" });
        if (!alive) return;
        setInitial(obj);
      } catch (err) {
        if (!alive) return;
        setError(err?.message || "Не вдалося завантажити постачальника");
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEdit, supplierId]);

  const title = useMemo(() => {
    return isEdit ? "Редагування постачальника" : "Створення постачальника";
  }, [isEdit]);

  const spices = useMemo(() => {
    return Array.isArray(initial?.spices) ? initial.spices : [];
  }, [initial]);

  const errorNode = useMemo(() => {
    if (!error) return null;
    return (
      <div className="error-message" role="alert">
        <p>{error}</p>
      </div>
    );
  }, [error]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = formToObject(e.currentTarget);

    try {
      if (isEdit) {
        await apiFetch(`/suppliers/${supplierId}/edit/`, { method: "POST", body: payload });
      } else {
        await apiFetch("/suppliers/new/", { method: "POST", body: payload });
      }
      navigate("/suppliers");
    } catch (err) {
      setError(err?.message || "Не вдалося зберегти");
    }
  }

  async function onDelete() {
    const ok = window.confirm("Видалити постачальника?");
    if (!ok) return;

    try {
      await apiFetch(`/suppliers/${supplierId}/delete/`, { method: "POST", body: {} });
      navigate("/suppliers");
    } catch (err) {
      window.alert(err?.message || "Не вдалося видалити");
    }
  }

  if (isEdit && !initial && !error) return null;

  return (
    <main className="edit-container">
      <header className="form-header">
        <h2>{title}</h2>
      </header>

      <section className="form-section">
        {errorNode}

        <form className="edit-form" onSubmit={onSubmit}>
          <fieldset className="form-fieldset">
            <legend className="visually-hidden">Постачальник</legend>

            <div className="form-group">
              <label htmlFor="id_name">Назва мережі</label>
              <input
                id="id_name"
                name="name"
                type="text"
                required
                defaultValue={initial?.name || ""}
              />
            </div>

            <div className="form-group">
              <label htmlFor="id_address">Адреса</label>
              <input
                id="id_address"
                name="address"
                type="text"
                defaultValue={initial?.address || ""}
              />
            </div>

            <div className="form-group">
              <label htmlFor="id_phone">Номер телефону</label>
              <input
                id="id_phone"
                name="phone_number"
                type="text"
                defaultValue={initial?.phone_number || ""}
              />
            </div>
          </fieldset>

          {isEdit && (
            <aside className="supplier-inventory" style={{ marginTop: 16 }}>
              <h3 className="section-title">Спеції від цього постачальника:</h3>

              {spices.length === 0 ? (
                <p className="muted">Немає прив’язаних спецій.</p>
              ) : (
                <ul className="inline-list">
                  {spices.map((s, idx) => (
                    <li key={`${s}-${idx}`} className="inline-list__item">
                      {String(s)}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          <footer className="form-actions">
            <button type="submit" className="btn-main">
              Зберегти
            </button>
          </footer>
        </form>

        {isEdit && (
          <aside className="danger-zone">
            <button type="button" className="btn-delete" onClick={onDelete}>
              Видалити
            </button>
          </aside>
        )}

        <nav className="navigation-actions">
          <Link to="/suppliers" className="btn-main btn-outline" data-route>
            Скасувати
          </Link>
        </nav>
      </section>
    </main>
  );
}
