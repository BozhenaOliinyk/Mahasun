import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useSession } from '../hooks/useSession';

export default function Register() {
    const navigate = useNavigate();
    const { loadSession } = useSession();

    const [form, setForm] = useState({
        email: '',
        password: '',
        last_name: '',
        first_name: '',
        fathers_name: '',
        phone_number: '',
    });
    const [error, setError] = useState('');

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await apiFetch('/register/', { method: 'POST', body: form });
            await loadSession();
            navigate('/profile');
        } catch (err) {
            setError(err.message || 'Помилка реєстрації');
        }
    };

    return (
        <main className="auth-container">
            <section className="auth-box">
                <header className="auth-header">
                    <h2>Реєстрація</h2>
                </header>

                {error ? (
                    <div className="error-message" role="alert">
                        <p>{error}</p>
                    </div>
                ) : null}

                <form className="auth-form" onSubmit={onSubmit}>
                    <fieldset className="form-fieldset">
                        <legend className="visually-hidden">Реєстраційні дані</legend>

                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="Пошта"
                                aria-label="Пошта"
                                required
                                value={form.email}
                                onChange={(e2) => setField('email', e2.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Пароль"
                                aria-label="Пароль"
                                required
                                value={form.password}
                                onChange={(e2) => setField('password', e2.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="last_name"
                                placeholder="Прізвище"
                                aria-label="Прізвище"
                                required
                                value={form.last_name}
                                onChange={(e2) => setField('last_name', e2.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="first_name"
                                placeholder="Ім'я"
                                aria-label="Ім'я"
                                required
                                value={form.first_name}
                                onChange={(e2) => setField('first_name', e2.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="fathers_name"
                                placeholder="По батькові"
                                aria-label="По батькові"
                                value={form.fathers_name}
                                onChange={(e2) => setField('fathers_name', e2.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="phone_number"
                                placeholder="Номер телефону"
                                aria-label="Номер телефону"
                                required
                                value={form.phone_number}
                                onChange={(e2) => setField('phone_number', e2.target.value)}
                            />
                        </div>
                    </fieldset>

                    <footer className="form-actions">
                        <button type="submit" className="btn-main">Зареєструватись</button>
                    </footer>
                </form>

                <nav className="auth-navigation">
                    <Link className="btn-main btn-outline" to="/login">Ввійти</Link>
                    <Link className="btn-main btn-outline btn-block" to="/spices">Скасувати</Link>
                </nav>
            </section>
        </main>
    );
}
