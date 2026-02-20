import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileMenu() {
    const { session } = useAuth();

    return (
        <aside className="mobile-menu-overlay" aria-hidden="true">
            <nav className="mobile-menu" aria-label="Мобільне меню">
                <div className="mobile-menu-top">
                    <div className="mobile-menu-profile">
                        <img
                            id="mobile-profile-avatar"
                            src={session.isAdmin ? '/static/images/admin_icon.jpg' : '/static/images/default_user.jpg'}
                            alt="Профіль"
                        />
                    </div>

                    <label htmlFor="menu-toggle" className="mobile-menu-close" aria-label="Закрити">✕</label>
                </div>

                <div className="mobile-menu-links">
                    <Link to="/spices">Спеції</Link>
                    <Link to="/cards">Бонусні картки</Link>
                    <Link to="/outlets">Торгові точки</Link>

                    {session.isAdmin ? (
                        <>
                            <Link to="/employees">Працівники</Link>
                            <Link to="/suppliers">Постачальники</Link>
                            <Link to="/clients">Клієнти</Link>
                        </>
                    ) : null}
                </div>
            </nav>
        </aside>
    );
}
