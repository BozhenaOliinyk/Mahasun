import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <main className="content-container">
            <header className="page-header">
                <h1>Сторінку не знайдено</h1>
            </header>
            <Link className="btn-main btn-outline" to="/spices">На головну</Link>
        </main>
    );
}
