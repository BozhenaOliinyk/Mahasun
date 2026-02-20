import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function formToObject(form) {
  const fd = new FormData(form);
  return Object.fromEntries(fd.entries());
}

export default function Login() {
  const { login, refreshSession, session } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const errorNode = useMemo(() => {
    if (!error) return null;
    return (
      <div className="error-message" role="alert">
        <p>{error}</p>
      </div>
    );
  }, [error]);

  useEffect(() => {
    if (session?.loaded && session.isAdmin) {
      navigate("/spices", { replace: true });
    }
  }, [session?.loaded, session?.isAdmin, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await login(formToObject(e.currentTarget));
      await refreshSession();
      navigate("/spices", { replace: true });
    } catch (err) {
      setError(err?.message || "Помилка входу");
    }
  }

  return (
    <main className="auth-container">
      <section className="auth-box">
        <header className="auth-header">
          <h2>Вхід</h2>
        </header>

        {errorNode}

        <form className="auth-form" onSubmit={onSubmit}>
          <fieldset className="form-fieldset">
            <legend className="visually-hidden">Дані для входу</legend>

            <div className="form-group">
              <input type="email" name="email" placeholder="Пошта" aria-label="Пошта" required />
            </div>

            <div className="form-group">
              <input type="password" name="password" placeholder="Пароль" aria-label="Пароль" required />
            </div>
          </fieldset>

          <footer className="form-actions">
            <button type="submit" className="btn-main">Ввійти</button>
          </footer>
        </form>

        <nav className="auth-navigation">
          <Link to="/register" className="btn-main btn-outline">Зареєструватись</Link>
          <Link to="/spices" className="btn-main btn-outline btn-block">Скасувати</Link>
        </nav>
      </section>
    </main>
  );
}