import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSession } from "../hooks/useSession";
import FavoritesPanel from "./FavoritesPanel";
import MobileMenu from "./MobileMenu";
import Navbar from "./Navbar";

function avatarFor(session) {
  if (session.isAdmin) {
    return { href: "/login", src: "/static/images/admin_icon.jpg", alt: "Адмін" };
  }
  if (session.hasClientSession) {
    return { href: "/profile", src: "/static/images/user_avatar.jpg", alt: "Профіль" };
  }
  return { href: "/login", src: "/static/images/default_user.jpg", alt: "User" };
}

export default function Layout() {
  const { session, logout } = useAuth();
  const { loadSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const [favOpen, setFavOpen] = useState(false);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    setFavOpen(false);
  }, [location.pathname]);

  const profile = useMemo(() => avatarFor(session), [session]);

  const openFav = () => {
    if (session.isAdmin) return;
    setFavOpen(true);
  };

  const onFavChanged = () => {};

  const onProfileClick = useCallback(async () => {
    if (session.isAdmin) {
      try {
        await logout();
      } finally {
        navigate("/login", { replace: true });
      }
      return;
    }

    navigate(profile.href);
  }, [session.isAdmin, logout, navigate, profile.href]);

  return (
    <>
      <link rel="stylesheet" href="/static/css/style.css" />

      <div className="app">
        <input type="checkbox" id="mobile-menu-toggle" className="visually-hidden" />
        <input
          type="checkbox"
          id="fav-toggle"
          className="visually-hidden"
          checked={favOpen}
          onChange={(e) => setFavOpen(e.target.checked)}
        />
        <input type="checkbox" id="menu-toggle" className="visually-hidden" />

        <header className="main-header">
          <div className="logo-container">
            <Link to="/spices" aria-label="Turkish Mahasyn">
              <img src="/static/images/spices_logo.png" alt="Logo" />
            </Link>
          </div>

          <Navbar />

          <section className="header-actions">
            {!session.isAdmin ? (
              <button type="button" className="heart-btn" aria-label="Улюблені" onClick={openFav}>
                ❤
              </button>
            ) : null}

            <div className="profile-area">
              <a
                className="btn-link"
                aria-label={session.isAdmin ? "Вийти" : "Профіль"}
                onClick={onProfileClick}
              >
                <img id="profile-avatar" src={profile.src} alt={profile.alt} />
              </a>
            </div>

            <label htmlFor="menu-toggle" className="burger-btn" aria-label="Меню">
              ☰
            </label>
          </section>
        </header>

        {favOpen ? <FavoritesPanel isOpen={favOpen} onChanged={onFavChanged} /> : null}

        <MobileMenu />

        <main id="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}