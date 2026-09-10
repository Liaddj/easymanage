function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 11h16" />
      </svg>
    );
  }
  if (name === "me") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19.2c1.4-3 4-4.6 7-4.6s5.6 1.6 7 4.6" />
      </svg>
    );
  }
  if (name === "today") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 1.7" />
      </svg>
    );
  }
  if (name === "hours") {
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <rect x="4" y="6" width="16" height="13" rx="2" />
        <path d="M8 6V4M16 6V4M4 10h16" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="15" r="3" />
      <path d="M12 9h3.5A2.5 2.5 0 0 1 18 11.5V12" />
    </svg>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <nav className="tabbar" aria-label="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab ${active === tab.id ? "on" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <Icon name={tab.icon} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default function Shell({ title, action, children, tabs, tab, onTab, login }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>{title}</h1>
        {action}
      </header>
      <main className={`content ${login ? "login" : ""}`}>{children}</main>
      {tabs ? <TabBar tabs={tabs} active={tab} onChange={onTab} /> : null}
    </div>
  );
}
