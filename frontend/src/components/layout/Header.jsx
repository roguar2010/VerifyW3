import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import { shortAddress } from '../../data/institutions';

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', short: 'Inicio', end: true },
  { to: '/verificar', label: 'Validador', short: 'Validador' },
  { to: '/emisor', label: 'Portal Emisor', short: 'Emisor' },
  { to: '/instituciones', label: 'Instituciones', short: 'Directorio' },
];

const linkClass = ({ isActive }) =>
  `px-4 py-2.5 rounded-xl text-sm lg:text-base font-semibold transition-all ${
    isActive
      ? 'bg-cyan-500 text-white dark:text-slate-950 font-bold shadow-md'
      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
  }`;

export default function Header() {
  const { dark, toggle } = useTheme();
  const { address } = useWallet();

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3.5">
          <img src="/logo.svg" alt="VerifyW3" className="w-11 h-11 drop-shadow-md animate-float" />
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">VerifyW3</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-inner">
          {NAV_ITEMS.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggle}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-amber-400 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            {dark ? (
              <SunIcon className="w-5 h-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <MoonIcon className="w-5 h-5 text-slate-700 dark:text-slate-200 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Se mantiene visible en todas las páginas: recordatorio de que solo usamos testnet */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            Stellar Testnet
          </div>

          {address && (
            <Link
              to="/emisor"
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300"
            >
              🔑 {shortAddress(address)}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SunIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.93 4.93l2.12 2.12" />
      <path d="M16.95 16.95l2.12 2.12" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.93 19.07l2.12-2.12" />
      <path d="M16.95 7.05l2.12-2.12" />
    </svg>
  );
}

function MoonIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

