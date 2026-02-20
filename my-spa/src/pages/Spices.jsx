import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

function buildFullName(value) {
    return String(value || '');
}

export default function Spices() {
    const navigate = useNavigate();
    const { session } = useAuth();

    const [rows, setRows] = useState([]);
    const [favIds, setFavIds] = useState(new Set());
    const [error, setError] = useState('');

    const load = async () => {
        setError('');
        try {
            const data = await apiFetch('/spices/', { method: 'GET' });
            const r = Array.isArray(data.rows) ? data.rows : [];
            const fav = Array.isArray(data.fav_ids) ? data.fav_ids : [];
            setRows(r);
            setFavIds(new Set(fav));
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onToggleFav = async (spiceId) => {
        if (session.isAdmin) return;
        if (!session.hasClientSession) {
            navigate('/login');
            return;
        }

        try {
            await apiFetch(`/favorites/add_del/${spiceId}/`, { method: 'POST', body: {} });
            setFavIds((prev) => {
                const next = new Set(prev);
                if (next.has(spiceId)) next.delete(spiceId);
                else next.add(spiceId);
                return next;
            });
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <main className="catalog-page">
            <header className="page-header">
                <h1 className="visually-hidden">Каталог спецій</h1>
                {session.isAdmin ? (
                    <Link to="/spices/add" className="admin-add-btn" aria-label="Додати спецію">+</Link>
                ) : null}
            </header>

            {error ? (
                <div className="error-message" role="alert">
                    <p>{error}</p>
                </div>
            ) : null}

            <section className="spice-grid">
                {rows.map((row) => {
                    const values = Array.isArray(row.values) ? row.values : [];
                    const spiceId = row.id;

                    const name = buildFullName(values[1]);
                    const type = String(values[2] || '');
                    const purpose = String(values[3] || '');
                    const price = String(values[4] || '');

                    return (
                        <article
                            key={spiceId}
                            className="spice-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                                if (session.isAdmin) navigate(`/spices/edit/${spiceId}`);
                            }}
                            onKeyDown={(e) => {
                                if (session.isAdmin && e.key === 'Enter') navigate(`/spices/edit/${spiceId}`);
                            }}
                        >
                            <figure className="spice-image-container">
                                <img
                                    src="/static/images/placeholder.jpg"
                                    className="spice-img"
                                    alt={name}
                                />
                            </figure>

                            <div className="spice-content">
                                <header className="spice-header">
                                    <h3 className="spice-title">{name}</h3>
                                </header>

                                <p className="spice-meta">{type}</p>
                                <p className="spice-meta">{purpose}</p>

                                <footer className="spice-footer">
                                    <p className="spice-price">
                                        <span>{price}</span> <span className="price-unit">грн / 100 гр</span>
                                    </p>
                                </footer>
                            </div>

                            {!session.isAdmin ? (
                                <a
                                    href="#"
                                    className={`fav-heart-btn ${favIds.has(spiceId) ? 'active' : ''}`}
                                    aria-label="Додати в обране"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onToggleFav(spiceId);
                                    }}
                                >
                                    ❤
                                </a>
                            ) : null}
                        </article>
                    );
                })}
            </section>
        </main>
    );
}
