import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, clearSession, hasToken, readUser, saveSession } from "./api.js";
import { t } from "./i18n.js";
import Shell from "./Shell.jsx";
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

  const langBtn = (
    <button className="ghost" type="button" onClick={() => setLang(lang === "he" ? "en" : "he")}>
      {tr("lang")}
    </button>
  );

  if (!ready) {
    return (
      <Shell title={tr("brand")} action={langBtn} login>
        <p className="loading">{lang === "he" ? "…" : "…"}</p>
      </Shell>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === "provider" ? "/coach" : "/client"} replace />
          ) : (
            <Login lang={lang} tr={tr} onAuthed={onAuthed} action={langBtn} />
          )
        }
      />
      <Route
        path="/coach"
        element={
          user?.role === "provider" ? (
            <Provider lang={lang} tr={tr} user={user} action={langBtn} onLogout={logout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/client"
        element={
          user?.role === "client" ? (
            <Client lang={lang} tr={tr} user={user} action={langBtn} onLogout={logout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
