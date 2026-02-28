import React, {useEffect, useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {apiFetch} from "../api/client";
import {useAuth} from "../context/AuthContext.jsx";

function pickCardImage(type) {
    const t = String(type || "").toLowerCase();
    if (t.includes("pro")) return "/static/images/pro_card.jpg";
    if (t.includes("advanced")) return "/static/images/adv_card.jpg";
    return "/static/images/new_card.jpg";
}

export default function Cards() {
    const {session} = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState("");
    const [rows, setRows] = useState([]);
    const [myCardId, setMyCardId] = useState(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const data = await apiFetch("/cards/", {method: "GET"});
                const r = Array.isArray(data?.rows) ? data.rows : [];
                if (!alive) return;

                setRows(r);

                const idFromApi = data?.my_card_id ?? null;
                setMyCardId(typeof idFromApi === "number" ? idFromApi : (idFromApi ? Number(idFromApi) : null));
            } catch (err) {
                if (alive) setError(err?.message || "Не вдалося завантажити картки");
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const errorNode = useMemo(() => {
        if (!error) return null;
        return (
            <div className="error-message" role="alert">
                <p>{error}</p>
            </div>
        );
    }, [error]);

    function openEdit(id) {
        if (!session.isAdmin) return;
        navigate(`/cards/${id}/edit`);
    }

    return (
        <main className="content-container">
            <header className="page-header">
                <h1 className="visually-hidden">Бонусні картки</h1>

                {session.isAdmin && (
                    <Link to="/cards/new" className="admin-add-btn" aria-label="Додати нову картку">
                        +
                    </Link>
                )}
            </header>

            {errorNode}

            <section className="long-list" id="cards-list">
                {rows.map((row) => {
                    const values = Array.isArray(row.values) ? row.values : [];
                    const id = row.id;
                    const type = values[1] || "";

                    const isMine = !session.isAdmin && myCardId != null && Number(id) === Number(myCardId);

                    return (
                        <article
                            key={id}
                            className={`long-card bonus-card-full ${isMine ? "bonus-card-mine" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => openEdit(id)}
                            onKeyDown={(e) => e.key === "Enter" && openEdit(id)}
                            aria-label={isMine ? "Моя бонусна картка" : "Бонусна картка"}
                        >
                            <figure className="card-image-wrapper">
                                <img src={pickCardImage(type)} alt={`Візуалізація картки ${type}`}/>
                            </figure>

                            <div className="bonus-info">
                                <div className="bonus-info-block">
                                    <header className="card-title">
                                        <h2>
                                            {String(type).toUpperCase()}
                                        </h2>
                                    </header>

                                    <section className="card-details">
                                        <p>
                                            Відсоток нарахування бонусів:{" "}
                                            <span className="highlight-value">{values[2] || ""}%</span>
                                        </p>
                                        <p>
                                            Знижка(%): <span className="highlight-value">{values[3] || ""}%</span>
                                        </p>
                                    </section>
                                </div>

                                <p>{!session.isAdmin && isMine ?
                                    <span className="mine-badge">Моя</span> : null}</p>
                            </div>
                        </article>
                    );
                })}
            </section>
        </main>
    );
}