import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FavoritesPanel({ isOpen, onChanged }) {
    const { session } = useAuth();
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!isOpen) return;

        if (!session.hasClientSession || session.isAdmin) {
            setItems([]);
            setError('');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const data = await apiFetch('/favorites/', { method: 'GET' });
            const favorites = Array.isArray(data.favorites) ? data.favorites : [];
            setItems(favorites);
        } catch {
            setError('Не вдалося завантажити улюблені.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [isOpen, session.hasClientSession, session.isAdmin]);

    useEffect(() => {
        load();
    }, [load]);

    const onDelete = async (spiceId) => {
        try {
            await apiFetch(`/favorites/add_del/${spiceId}/`, { method: 'POST', body: {} });
            await load();
            if (onChanged) onChanged();
        } catch (err) {
            alert(err.message);
        }
    };

    const showGuest = (!session.hasClientSession || session.isAdmin);

    return (
        <aside className="overlay">
            <section className="fav-window">
                <header className="fav-header">
                    <h2>Улюблені</h2>
                </header>

                <div className="fav-scroll-area">
                    {showGuest ? (
                        <div className="fav-guest">
                            <p className="fav-guest-title">Улюблені доступні після входу</p>
                            <p className="fav-guest-text">
                                Будь ласка, увійдіть або зареєструйтесь, щоб додавати спеції в улюблені.
                            </p>
                            <div className="fav-guest-actions">
                                <Link className="btn-main" to="/login">Увійти</Link>
                                <Link className="btn-main btn-outline" to="/register">Зареєструватись</Link>
                            </div>
                        </div>
                    ) : null}

                    {!showGuest && loading ? <p className="empty-msg">Завантаження…</p> : null}
                    {!showGuest && error ? <p className="empty-msg">{error}</p> : null}

                    {!showGuest && !loading && !error && items.length === 0 ? (
                        <p className="empty-msg">У списку ще немає спецій</p>
                    ) : null}

                    {!showGuest && !loading && !error ? items.map((fav) => (
                        <article className="fav-item" key={fav.spice_id}>
                            <span className="fav-name">{fav.name}, </span>
                            <p className="fav-price">{fav.price} грн / 100 гр</p>
                            <a
                                href="#"
                                className="fav-delete-heart"
                                title="Видалити з улюблених"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onDelete(Number(fav.spice_id));
                                }}
                            >
                                ❤
                            </a>
                        </article>
                    )) : null}
                </div>

                <footer className="fav-footer">
                    <label htmlFor="fav-toggle" className="btn-main btn-outline">Закрити</label>
                </footer>
            </section>
        </aside>
    );
}
