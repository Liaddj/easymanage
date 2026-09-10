import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, clearSession, hasToken, readUser, saveSession } from "./api.js";
import { t } from "./i18n.js";
import Login from "./pages/Login.jsx";
import Provider from "./pages/Provider.jsx";
import Client from "./pages/Client.jsx";

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("flow_lang") || "he");
  const [user, setUser] = useState(() => readUser());
  const [ready, setReady] = useState(!hasToken());

  useEffect(() => {
    document.documentElement.lang = lang === "he" ? "he" : "en";
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    localStorage.setItem("flow_lang", lang);
  }, [lang]);

  useEffect(() => {
    if (!hasToken()) return;
    api
      .me()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("flow_user", JSON.stringify(data.user));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const tr = useMemo(() => (key) => t(lang, key), [lang]);

  function onAuthed(result) {
    saveSession(result);
    setUser(result.user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  if (!ready) {
    return (
      <div className="app-shell wrap">
        <p className="lede">{lang === "he" ? "טוען…" : "Loading…"}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="wrap">
        <header className="topbar">
          <div className="brand">
            <div className="mark">●</div>
            <div>
              <div>{tr("brand")}</div>
              <div className="userbar">
                {user ? `${tr("hello")} ${lang === "he" ? user.name : user.nameEn || user.name}` : tr("tagline")}
              </div>
            </div>
          </div>
          <div className="row">
            <button className="lang-btn" type="button" onClick={() => setLang(lang === "he" ? "en" : "he")}>
              {tr("lang")}
            </button>
            {user ? (
              <button className="ghost" type="button" onClick={logout}>
                {tr("logout")}
              </button>
            ) : null}
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.role === "provider" ? "/coach" : "/client"} replace />
              ) : (
                <Login lang={lang} tr={tr} onAuthed={onAuthed} />
              )
            }
          />
          <Route
            path="/coach"
            element={user?.role === "provider" ? <Provider lang={lang} tr={tr} user={user} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/client"
            element={user?.role === "client" ? <Client lang={lang} tr={tr} user={user} /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
