import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, saveSession } from "../api.js";
import { toast } from "../Toast.jsx";
import Shell from "../Shell.jsx";

export default function Join({ lang, tr, user, onAuthed, action }) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.inviteInfo(code).then(setInfo).catch(() => setError(tr("error")));
  }, [code]);

  useEffect(() => {
    if (user?.role === "client" && code) {
      api
        .redeemInvite(code)
        .then(() => {
          toast(tr("added"));
          navigate("/client", { replace: true });
        })
        .catch(() => {});
    }
  }, [user, code]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.register({ email, password, name, role: "client", inviteCode: code });
      saveSession(result);
      onAuthed(result);
      toast(tr("added"));
      navigate("/client", { replace: true });
    } catch (err) {
      setError(err.message === "email_taken" ? tr("badLogin") : tr("error"));
    } finally {
      setBusy(false);
    }
  }

  const coach = lang === "he" ? info?.provider?.name : info?.provider?.nameEn || info?.provider?.name;

  return (
    <Shell title={tr("joinCta")} action={action} login>
      <div className="pane">
        <h2 className="large-title">
          {tr("joinTitle")} {coach || "…"}
        </h2>
        <p className="lede">{tr("inviteHint")}</p>
        <form className="stack" onSubmit={submit}>
          <label>
            {tr("name")}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {tr("email")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            {tr("password")}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn full" disabled={busy} type="submit">
            {tr("joinCta")}
          </button>
        </form>
      </div>
    </Shell>
  );
}
