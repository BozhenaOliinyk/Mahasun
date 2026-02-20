import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { session } = useAuth();

    return (
        <nav className="nav-menu">
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
        </nav>
    );
}
