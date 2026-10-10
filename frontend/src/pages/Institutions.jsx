// Directorio de instituciones acreditadas — HU-05 y "Directorio base" del alcance del MVP.
import PageHeader from '../components/ui/PageHeader';
import { listInstitutions } from '../services/ledger';
import { shortAddress } from '../data/institutions';

export default function Institutions() {
  const institutions = listInstitutions();

  return (
    <div className="space-y-10">
      <PageHeader
        badge="🏛️ Directorio"
        title="Instituciones"
        highlight="acreditadas"
        subtitle="Solo los emisores de esta lista se muestran como verificados en el validador."
      />

      {institutions.length === 0 ? (
        <p className="text-center text-slate-500">Aún no hay instituciones acreditadas.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {institutions.map((i) => (
            <li
              key={i.address}
              className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 p-6 rounded-3xl space-y-3 shadow-md backdrop-blur-sm transition"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                ✓ Emisor verificado
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{i.name}</h3>
              <dl className="text-sm space-y-1.5 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">País</dt>
                  <dd>{i.country}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">Dominio</dt>
                  <dd>
                    <a
                      href={`https://${i.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      {i.domain}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold">Cuenta Stellar</dt>
                  <dd className="font-mono text-xs" title={i.address}>
                    {shortAddress(i.address)}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
