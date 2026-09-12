export default function AppShell({ children }) {
  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.4rem,env(safe-area-inset-top))] sm:px-4">
      {children}
    </div>
  );
}
