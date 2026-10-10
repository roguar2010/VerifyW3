import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './Header';

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-xl px-2 py-2.5 flex justify-around">
      {NAV_ITEMS.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            `px-3 py-1 text-xs transition ${isActive ? 'text-cyan-500 font-bold' : 'text-slate-500 dark:text-slate-400 font-semibold'}`
          }
        >
          {n.short}
        </NavLink>
      ))}
    </nav>
  );
}
