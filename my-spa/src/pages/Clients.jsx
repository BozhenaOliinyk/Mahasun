import React, {useEffect, useMemo, useState} from "react";
import {apiFetch} from "../api/client";
import {useAuth} from "../context/AuthContext.jsx";
import {Link, useNavigate} from "react-router-dom";

export default function Clients() {
    const {session} = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");

    useEffect(() => {
        let alive = true;

        if (session?.loaded && !session.isAdmin) {
            navigate("/spices", {replace: true});
            return;
        }

        (async () => {
            try {
                setError("");

                const query = q.trim();

                let url = "/clients/";
                if (query) {
                    const params = new URLSearchParams({q: query});
                    url = `/clients/search/?${params.toString()}`;
                }

                const data = await apiFetch(url, {method: "GET"});

                const r = Array.isArray(data?.rows) ? data.rows : [];
                if (alive) setRows(r);
            } catch (err) {
                if (alive) setError(err?.message || "Не вдалося завантажити клієнтів");
            }
        })();

        return () => {
            alive = false;
        };
    }, [session?.loaded, session?.isAdmin, navigate, q]);

    const errorNode = useMemo(() => {
        if (!error) return null;
        return (
            <div className="error-message" role="alert">
                <p>{error}</p>
            </div>
        );
    }, [error]);

    async function deleteClient(id) {
        const ok = window.confirm("Видалити клієнта?");
        if (!ok) return;

        try {
            await apiFetch(`/clients/${id}/delete/`, {method: "POST", body: {}});
            setRows((prev) => prev.filter((r) => r.id !== id));
        } catch (err) {
            window.alert(err?.message || "Не вдалося видалити клієнта");
        }
    }

    return (
        <main className="clients-page">
            <header className="page-title">
                <div className="page-header-clients">
                    <div>
                        <input className="search"
                               type="text"
                               value={q}
                               onChange={(e) => setQ(e.target.value)}
                               placeholder="Пошук клієнта"
                               aria-label="Пошук клієнта"
                        />
                    </div>
                </div>
            </header>

            {errorNode}

            <section className="long-list" id="clients-list">
                {rows.map((row) => {
                    const values = Array.isArray(row.values) ? row.values : [];
                    const id = row.id;

                    const fullName = `${values[1] || ""} ${values[2] || ""} ${values[3] || ""}`.trim();

                    return (
                        <article key={id} className="long-card client-card">
                            <section className="card-details">
                                <header className="client-name">
                                    <h2>{fullName}</h2>
                                </header>

                                <div className="client-info">
                                    <p>Тип картки: <strong>{values[4] || ""}</strong></p>
                                    <p>Кількість бонусів: <span className="bonus-count">{String(values[5] ?? "")}</span>
                                    </p>
                                    <p className="client-contact">{values[6] || ""}</p>
                                </div>
                            </section>

                            <footer className="card-actions">
                                <button className="btn-del-small" onClick={() => deleteClient(id)}>Видалити</button>
                            </footer>
                        </article>
                    );
                })}
            </section>
        </main>
    );
}
