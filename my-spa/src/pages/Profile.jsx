import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useSession } from '../hooks/useSession';

export default function Profile() {
    const navigate = useNavigate();
    const { loadSession } = useSession();

    const [error, setError] = useState('');
    const [bonus, setBonus] = useState({ type: '', count: '' });
    const [form, setForm] = useState({
        ln: '',
        fn: '',
        mn: '',
        phone: '',
    });

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch('/profile/', { method: 'GET' });
                setForm({
                    ln: data.last_name || '',
                    fn: data.first_name || '',
                    mn: data.fathers_name || '',
                    phone: data.phone_number || '',
                });
                setBonus({
                    type: data.bonus_card_type || '',
                    count: String(data.bonus_count ?? ''),
                });
            } catch (err) {
                setError(err.message);
            }
        })();
    }, []);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await apiFetch('/profile/', { method: 'POST', body: form });
            navigate('/profile');
        } catch (err) {
            setError(err.message || 'Не вдалося зберегти');
        }
    };

    const onLogout = async () => {
        try {
            await apiFetch('/logout/', { method: 'POST', body: {} });
        } catch {
            // ignore
        }
        await loadSession();
        navigate('/login');
    };

    return (
        <main className="profile-container">
            <section className="auth-box profile-box">
                <header className="auth-header">
                    <h2>Мій профіль</h2>
                </header>

                {error ? (
                    <div className="error-message" role="alert">
                        <p>{error}</p>
                    </div>
                ) : null}

                <form className="profile-form" onSubmit={onSubmit}>
                    <fieldset className="form-fieldset">
                        <legend className="visually-hidden">Дані користувача</legend>

                        <div className="form-group">
                            <label htmlFor="id_ln">Прізвище</label>
                            <input
                                type="text"
                                id="id_ln"
                                name="ln"
                                required
                                value={form.ln}
                                onChange={(e) => setField('ln', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_fn">Ім'я</label>
                            <input
                                type="text"
                                id="id_fn"
                                name="fn"
                                required
                                value={form.fn}
                                onChange={(e) => setField('fn', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_mn">По батькові</label>
                            <input
                                type="text"
                                id="id_mn"
                                name="mn"
                                value={form.mn}
                                onChange={(e) => setField('mn', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_phone">Телефон</label>
                            <input
                                type="text"
                                id="id_phone"
                                name="phone"
                                required
                                value={form.phone}
                                onChange={(e) => setField('phone', e.target.value)}
                            />
                        </div>
                    </fieldset>

                    <aside className="loyalty-info">
                        <p>Тип картки: <strong>{bonus.type}</strong></p>
                        <p>Нараховано бонусів: <strong className="accent-text">{bonus.count}</strong></p>
                    </aside>

                    <footer className="form-actions">
                        <button type="submit" className="btn-main">Зберегти зміни</button>
                    </footer>
                </form>

                <nav className="profile-actions">
                    <button type="button" className="btn-main btn-delete" onClick={onLogout}>
                        Вийти з акаунту
                    </button>
                </nav>
            </section>
        </main>
    );
}
