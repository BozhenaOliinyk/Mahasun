import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

function formToObject(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

export default function CardForm() {
  const { session } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const cardId = Number(id);

  const [error, setError] = useState("");
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    let alive = true;

    if (!isEdit) return;

    (async () => {
      try {
        const obj = await apiFetch(`/cards/${cardId}/`, { method: "GET" });
        if (alive) setInitial(obj);
      } catch (err) {
        if (alive) setError(err?.message || "Не вдалося завантажити картку");
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEdit, cardId]);

  const title = useMemo(() => {
    return isEdit ? "Редагувати бонусну картку" : "Додати бонусну картку";
  }, [isEdit]);

  if (session?.loaded && !session.isAdmin) {
    navigate("/cards", { replace: true });
  }

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
        await apiFetch(`/cards/${cardId}/edit/`, { method: "POST", body: payload });
      } else {
        await apiFetch("/cards/new/", { method: "POST", body: payload });
      }
      navigate("/cards");
    } catch (err) {
      setError(err?.message || "Не вдалося зберегти");
    }
  }

  async function onDelete() {
    const ok = window.confirm("Видалити картку?");
    if (!ok) return;

    try {
      await apiFetch(`/cards/${cardId}/delete/`, { method: "POST", body: {} });
      navigate("/cards");
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
            <legend className="visually-hidden">Бонусна картка</legend>

            <div className="form-group">
              <label htmlFor="id_type">Тип картки</label>
              <input id="id_type" name="type" type="text" required defaultValue={initial?.type || ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_bonus">Нарахування бонусів (%)</label>
              <input id="id_bonus" name="bonus_percent" type="number" required defaultValue={initial?.bonus_percent ?? ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_discount">Знижка (%)</label>
              <input id="id_discount" name="discount" type="number" required defaultValue={initial?.discount ?? ""} />
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
          <Link to="/cards" className="btn-main btn-outline">Скасувати</Link>
        </nav>
      </section>
    </main>
  );
}
