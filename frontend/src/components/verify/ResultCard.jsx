// Tarjeta de resultado del validador — RESPONSABLE: Nicolás
// HU-02 (vigencia/revocación) y HU-05 (legitimidad del emisor). También el veredicto "adulterado" de HU-01.
//
// Props:
//   result = { verdict: 'VALID' | 'REVOKED' | 'NOT_FOUND', credential, institution }   (viene de ledger.js)
//   file   = { name, size } | null      (si se verificó por archivo; size ya formateado)
//   hash   = string | null              (SHA-256 calculado localmente)
//   code   = string | null              (si se verificó por código)
import { formatDate } from '../../lib/hash';

const THEMES = {
  VALID: {
    box: 'from-emerald-950/70 border-emerald-500',
    icon: '✓',
    iconBox: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400',
    pill: 'bg-emerald-500',
    pillText: 'Auténtico y vigente',
    title: 'Certificado verificado',
    hash: 'text-cyan-400',
    divider: 'border-emerald-800/60',
  },
  REVOKED: {
    box: 'from-amber-950/80 border-amber-500',
    icon: '!',
    iconBox: 'bg-amber-500/20 border-amber-500/60 text-amber-400',
    pill: 'bg-amber-500',
    pillText: 'Revocado',
    title: 'Credencial sin validez actual',
    hash: 'text-amber-400',
    divider: 'border-amber-800/60',
  },
  NOT_FOUND: {
    box: 'from-rose-950/80 border-rose-500',
    icon: '✕',
    iconBox: 'bg-rose-500/20 border-rose-500/60 text-rose-400',
    pill: 'bg-rose-500',
    pillText: 'Alerta de fraude',
    title: 'El documento ha sido adulterado o no está registrado',
    hash: 'text-rose-400',
    divider: 'border-rose-800/60',
  },
};

function Field({ label, children }) {
  return (
    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
      <span className="text-xs text-slate-400 font-bold uppercase block">{label}</span>
      {children}
    </div>
  );
}

function IssuerBlock({ institution }) {
  if (institution) {
    return (
      <Field label="Institución emisora">
        <strong className="text-slate-100 text-lg mt-1 block">{institution.name}</strong>
        <span className="text-xs text-slate-400 block mt-1">
          {institution.country} · {institution.domain}
        </span>
        <span className="text-xs text-emerald-400 mt-1 block font-semibold">🏛️ Emisor acreditado en el directorio</span>
      </Field>
    );
  }
  return (
    <Field label="Institución emisora">
      <strong className="text-amber-300 text-lg mt-1 block">Emisor no verificado</strong>
      <span className="text-xs text-amber-400 mt-1 block font-semibold">
        ⚠️ Esta entidad no figura en el directorio de instituciones acreditadas de VerifyW3.
      </span>
    </Field>
  );
}

export default function ResultCard({ result, file, hash, code }) {
  if (!result) return null;
  const { verdict, credential, institution } = result;
  const t = THEMES[verdict];
  const found = verdict !== 'NOT_FOUND';

  return (
    <div role="status" className={`bg-gradient-to-b ${t.box} to-slate-900 border-2 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 text-white`}>
      <div className={`flex items-center gap-4 border-b pb-6 ${t.divider}`}>
        <div className={`w-16 h-16 shrink-0 rounded-2xl border flex items-center justify-center text-3xl font-black ${t.iconBox}`}>{t.icon}</div>
        <div>
          <span className={`text-xs uppercase font-extrabold tracking-wider px-3 py-1 rounded-full text-slate-950 ${t.pill}`}>{t.pillText}</span>
          <h3 className="text-2xl sm:text-3xl font-black mt-2">{t.title}</h3>
        </div>
      </div>

      {verdict === 'NOT_FOUND' && (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-2">
          <p className="font-bold text-lg">⚠️ {code && !hash ? 'No existe ninguna credencial con ese código.' : 'La huella del archivo no coincide con ningún registro válido.'}</p>
          <p className="text-sm text-rose-300">
            Esto ocurre cuando se alteran notas, nombres, firmas o fechas del PDF original, o cuando el documento nunca fue registrado por una institución.
          </p>
        </div>
      )}

      {verdict === 'REVOKED' && (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 space-y-1">
          <p className="font-bold text-lg">🚫 La institución emisora anuló esta credencial el {formatDate(credential.revokedAt)}.</p>
          <p className="text-sm text-amber-300">El registro histórico se conserva; ya no debe aceptarse como válida.</p>
        </div>
      )}

      {found && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <IssuerBlock institution={institution} />
          <Field label="Estado en Stellar">
            <strong className={`text-lg mt-1 block ${verdict === 'VALID' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {verdict === 'VALID' ? 'Vigente' : 'Revocada'}
            </strong>
            <span className="text-xs text-slate-400 mt-1 block">Expedida el {formatDate(credential.issuedAt)}</span>
            {verdict === 'REVOKED' && <span className="text-xs text-amber-400 mt-0.5 block">Anulada el {formatDate(credential.revokedAt)}</span>}
          </Field>
          <Field label={file ? 'Archivo evaluado' : 'Código consultado'}>
            <strong className="text-slate-200 font-mono text-sm mt-1 block truncate" title={file?.name ?? credential.code}>
              {file?.name ?? credential.code}
            </strong>
            <span className="text-xs text-slate-400 mt-1 block">{file ? `Tamaño: ${file.size}` : 'Consulta por código'}</span>
          </Field>
        </div>
      )}

      {hash && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
          <div className="text-slate-400">Huella SHA-256 calculada en tu navegador:</div>
          <div className={`break-all select-all font-semibold text-sm ${t.hash}`}>{hash}</div>
        </div>
      )}
    </div>
  );
}
