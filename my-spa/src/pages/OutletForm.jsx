import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

function formToObject(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

export default function OutletForm() {
  const { session } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const outletId = Number(id);

  const [error, setError] = useState("");
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    let alive = true;

    if (session?.loaded && !session.isAdmin) {
      navigate("/outlets", { replace: true });
      return;
    }

    if (!isEdit) return;

    (async () => {
      try {
        const obj = await apiFetch(`/outlets/${outletId}/`, { method: "GET" });
        if (alive) setInitial(obj);
      } catch (err) {
        if (alive) setError(err?.message || "Не вдалося завантажити точку");
      }
    })();

    return () => {
      alive = false;
    };
  }, [session?.loaded, session?.isAdmin, navigate, isEdit, outletId]);

  const title = useMemo(() => {
    return isEdit ? "Редагувати торгову точку" : "Додати торгову точку";
  }, [isEdit]);

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
        await apiFetch(`/outlets/${outletId}/edit/`, { method: "POST", body: payload });
      } else {
        await apiFetch("/outlets/new/", { method: "POST", body: payload });
      }
      navigate("/outlets");
    } catch (err) {
      setError(err?.message || "Не вдалося зберегти");
    }
  }

  async function onDelete() {
    const ok = window.confirm("Видалити торгову точку?");
    if (!ok) return;

    try {
      await apiFetch(`/outlets/${outletId}/delete/`, { method: "POST", body: {} });
      navigate("/outlets");
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
            <legend className="visually-hidden">Торгова точка</legend>

            <div className="form-group">
              <label htmlFor="id_name">Назва точки</label>
              <input id="id_name" name="name" type="text" required defaultValue={initial?.name || ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_address">Адреса</label>
              <input id="id_address" name="address" type="text" required defaultValue={initial?.address || ""} />
            </div>
          </fieldset>

          <footer className="form-actions">
            <button type="submit" className="btn-main">Зберегти</button>
          </footer>
        </form>

        {isEdit && (
          <aside className="danger-zone">
            <button type="button" className="btn-delete" onClick={onDelete}>Видалити</button>
          </aside>
        )}

        <nav className="navigation-actions">
          <Link to="/outlets" className="btn-main btn-outline">Скасувати</Link>
        </nav>
      </section>
    </main>
  );
}
