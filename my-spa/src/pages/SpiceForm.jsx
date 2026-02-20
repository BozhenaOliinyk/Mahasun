import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';

export default function SpiceForm({ mode }) {
    const navigate = useNavigate();
    const params = useParams();
    const id = Number(params.id);

    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        type: '',
        purpose: '',
        price: '',
        supplier_name: '',
    });

    const isEdit = (mode === 'edit');

    useEffect(() => {
        if (!isEdit) return;

        (async () => {
            setError('');
            try {
                const obj = await apiFetch(`/spices/${id}/`, { method: 'GET' });
                setForm({
                    name: obj.name || '',
                    type: obj.type || '',
                    purpose: obj.purpose || '',
                    price: String(obj.price ?? ''),
                    supplier_name: obj.current_supplier || '',
                });
            } catch (err) {
                setError(err.message);
            }
        })();
    }, [isEdit, id]);

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isEdit) {
                await apiFetch(`/spices/edit/${id}/`, { method: 'POST', body: form });
            } else {
                await apiFetch('/spices/add/', { method: 'POST', body: form });
            }
            navigate('/spices');
        } catch (err) {
            setError(err.message || 'Не вдалося зберегти');
        }
    };

    const onDelete = async () => {
        if (!confirm('Видалити спецію?')) return;
        try {
            await apiFetch(`/spices/delete/${id}/`, { method: 'POST', body: {} });
            navigate('/spices');
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <main className="edit-container">
            <header className="form-header">
                <h2>{isEdit ? 'Редагування спеції' : 'Створення спеції'}</h2>
            </header>

            <figure className="edit-preview">
                <img src="/static/images/placeholder.jpg" className="edit-image-big" alt="Прев'ю спеції" />
            </figure>

            <section className="form-section">
                {error ? (
                    <div className="error-message" role="alert">
                        <p>{error}</p>
                    </div>
                ) : null}

                <form className="edit-form" onSubmit={onSubmit}>
                    <fieldset className="form-fieldset">
                        <legend className="visually-hidden">Спеція</legend>

                        <div className="form-group">
                            <label htmlFor="id_name">Назва спеції</label>
                            <input
                                type="text"
                                id="id_name"
                                name="name"
                                required
                                value={form.name}
                                onChange={(e) => setField('name', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_type">Вид спеції</label>
                            <textarea
                                id="id_type"
                                name="type"
                                rows={4}
                                value={form.type}
                                onChange={(e) => setField('type', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_purpose">Призначення</label>
                            <textarea
                                id="id_purpose"
                                name="purpose"
                                rows={4}
                                value={form.purpose}
                                onChange={(e) => setField('purpose', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_price">Ціна (грн / 100 гр)</label>
                            <input
                                type="number"
                                id="id_price"
                                step="0.01"
                                name="price"
                                required
                                value={form.price}
                                onChange={(e) => setField('price', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="id_supplier">Назва постачальника</label>
                            <input
                                type="text"
                                id="id_supplier"
                                name="supplier_name"
                                placeholder="Введіть назву постачальника"
                                value={form.supplier_name}
                                onChange={(e) => setField('supplier_name', e.target.value)}
                            />
                        </div>
                    </fieldset>

                    <footer className="form-actions">
                        <button type="submit" className="btn-main">Зберегти</button>
                    </footer>
                </form>

                {isEdit ? (
                    <aside className="danger-zone">
                        <button type="button" className="btn-delete" onClick={onDelete}>Видалити</button>
                    </aside>
                ) : null}

                <nav className="navigation-actions">
                    <Link to="/spices" className="btn-main btn-outline btn-block">Скасувати</Link>
                </nav>
            </section>
        </main>
    );
}
