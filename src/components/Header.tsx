interface HeaderProps {
  connected: boolean;
}

export function Header({ connected }: HeaderProps) {
  const isProd = import.meta.env.MODE === 'production';
  return (
    <header className="sticky top-0 z-20 bg-white/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-black/40">
      <div className="container-app flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-tight">Red Cross Live</span>
          {!isProd && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-brand-red">Dev</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="pill-live">
            <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-brand-red" />
            LIVE
          </span>
          <span
            aria-label={connected ? 'Connected' : 'Disconnected'}
            title={connected ? 'Connected' : 'Disconnected'}
            className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-400'}`}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;


