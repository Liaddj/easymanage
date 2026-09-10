import { useState } from "react";
import { api } from "../api.js";

export default function Login({ lang, tr, onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register({ email, password, name, role: "client" });
      onAuthed(result);
    } catch (err) {
      setError(err.message === "invalid_credentials" ? tr("badLogin") : tr("error"));
    } finally {
      setBusy(false);
    }
  }

  async function demo(kind) {
    setBusy(true);
    setError("");
    try {
      const creds =
        kind === "coach"
          ? { email: "coach@flow.demo", password: "demo123" }
          : { email: "client@flow.demo", password: "demo123" };
      onAuthed(await api.login(creds.email, creds.password));
    } catch {
      setError(tr("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-grid">
      <section className="hero">
        <p className="note">{tr("closedNote")}</p>
        <h1>{tr("tagline")}</h1>
        <p className="lede">{tr("noPayment")}</p>
        <p className="note">{tr("tzNote")}</p>
        <p className="note">{tr("calNote")}</p>
      </section>

      <section className="card stack">
        <h2 style={{ margin: 0 }}>{mode === "login" ? tr("loginTitle") : tr("register")}</h2>
        <form className="stack" onSubmit={submit}>
          {mode === "register" ? (
            <label>
              {tr("name")}
              <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </label>
          ) : null}
          <label>
            {tr("email")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
          </label>
          <label>
            {tr("password")}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn full" disabled={busy} type="submit">
            {mode === "login" ? tr("enter") : tr("createAccount")}
          </button>
        </form>
        <div className="note" style={{ textAlign: "center" }}>
          {tr("or")}
        </div>
        <button className="btn secondary full" type="button" disabled={busy} onClick={() => demo("coach")}>
          {tr("demoCoach")}
        </button>
        <button className="btn clay full" type="button" disabled={busy} onClick={() => demo("client")}>
          {tr("demoClient")}
        </button>
        <button
          className="ghost"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? tr("register") : tr("backLogin")}
        </button>
        <p className="meta">
          {lang === "he"
            ? "חשבונות הדגמה: coach@flow.demo / client@flow.demo · הסיסמה demo123"
            : "Demo accounts: coach@flow.demo / client@flow.demo · password demo123"}
        </p>
      </section>
    </div>
  );
}
