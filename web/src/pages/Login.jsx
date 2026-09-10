import { useState } from "react";
import { api } from "../api.js";
import Shell from "../Shell.jsx";

export default function Login({ lang, tr, onAuthed, action }) {
  const [more, setMore] = useState(false);
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
    <Shell title={tr("brand")} action={action} login>
      <div className="pane">
        <h2 className="large-title">{tr("tagline")}</h2>
        <p className="lede">{tr("tzNote")}</p>

        <p className="section-label">{tr("demoAs")}</p>
        <div className="demo-row">
          <button className="btn" type="button" disabled={busy} onClick={() => demo("coach")}>
            {tr("demoCoach")}
          </button>
          <button className="btn secondary" type="button" disabled={busy} onClick={() => demo("client")}>
            {tr("demoClient")}
          </button>
        </div>

        <button className="ghost" type="button" style={{ marginTop: 22 }} onClick={() => setMore(!more)}>
          {tr("moreEmail")}
        </button>

        {more ? (
          <form className="stack" style={{ marginTop: 14 }} onSubmit={submit}>
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
          </form>
        ) : error ? (
          <p className="error">{error}</p>
        ) : null}
      </div>
    </Shell>
  );
}
