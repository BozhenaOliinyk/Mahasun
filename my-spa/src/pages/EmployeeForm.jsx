import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

function formToObject(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

export default function EmployeeForm() {
  const { session } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const empId = Number(id);

  const [error, setError] = useState("");
  const [outlets, setOutlets] = useState([]);
  const [initial, setInitial] = useState(null);

  useEffect(() => {
    let alive = true;

    if (session?.loaded && !session.isAdmin) {
      navigate("/spices", { replace: true });
      return;
    }

    (async () => {
      try {
        const outletsData = await apiFetch("/outlets/", { method: "GET" });
        const rows = Array.isArray(outletsData?.rows) ? outletsData.rows : [];
        if (alive) setOutlets(rows);
      } catch {
        if (alive) setOutlets([]);
      }

      if (!isEdit) return;

      try {
        const obj = await apiFetch(`/employees/${empId}/`, { method: "GET" });
        if (alive) setInitial(obj);
      } catch (err) {
        if (alive) setError(err?.message || "Не вдалося завантажити працівника");
      }
    })();

    return () => {
      alive = false;
    };
  }, [session?.loaded, session?.isAdmin, navigate, isEdit, empId]);

  const title = useMemo(() => {
    return isEdit ? "Редагувати дані працівника" : "Додати працівника";
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
        await apiFetch(`/employees/${empId}/edit/`, { method: "POST", body: payload });
      } else {
        await apiFetch("/employees/new/", { method: "POST", body: payload });
      }
      navigate("/employees");
    } catch (err) {
      setError(err?.message || "Не вдалося зберегти");
    }
  }

  async function onDelete() {
    const ok = window.confirm("Видалити працівника?");
    if (!ok) return;

    try {
      await apiFetch(`/employees/${empId}/delete/`, { method: "POST", body: {} });
      navigate("/employees");
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
            <legend className="visually-hidden">Працівник</legend>

            <div className="form-group">
              <label htmlFor="id_last_name">Прізвище</label>
              <input id="id_last_name" name="last_name" type="text" required defaultValue={initial?.last_name || ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_first_name">Ім'я</label>
              <input id="id_first_name" name="first_name" type="text" required defaultValue={initial?.first_name || ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_fathers_name">По батькові</label>
              <input id="id_fathers_name" name="fathers_name" type="text" defaultValue={initial?.fathers_name || ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_position">Посада</label>
              <input id="id_position" name="position" type="text" defaultValue={initial?.position || ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_shift">Зміна (номер)</label>
              <input id="id_shift" name="shift" type="number" defaultValue={initial?.shift ?? ""} />
            </div>

            <div className="form-group">
              <label htmlFor="id_outlet">Торгова точка</label>
              <select
                name="outlet_id"
                id="id_outlet"
                required
                className="full-width-select"
                defaultValue={initial?.outlet_id ? String(initial.outlet_id) : ""}
              >
                <option value="">-- Оберіть точку --</option>
                {outlets.map((r) => {
                  const v = Array.isArray(r.values) ? r.values : [];
                  return (
                    <option key={r.id} value={String(r.id)}>
                      {v[1] || ""} ({v[2] || ""})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="id_phone">Номер телефону</label>
              <input id="id_phone" name="phone_number" type="text" defaultValue={initial?.phone_number || ""} />
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
          <Link to="/employees" className="btn-main btn-outline" >Скасувати</Link>
        </nav>
      </section>
    </main>
  );
}
