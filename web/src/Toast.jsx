import { useEffect, useState } from "react";

let push = () => {};

export function toast(message, kind = "ok") {
  push({ id: Date.now() + Math.random(), message, kind });
}

export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    push = (item) => {
      setItems((cur) => [...cur.slice(-2), item]);
      setTimeout(() => {
        setItems((cur) => cur.filter((x) => x.id !== item.id));
      }, 2400);
    };
    return () => {
      push = () => {};
    };
  }, []);

  if (!items.length) return null;
  return (
    <div className="toasts" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast ${item.kind}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
}
