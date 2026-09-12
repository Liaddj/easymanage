export default function AppShell({ children }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-visible px-2.5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
      {children}
    </div>
  );
}
