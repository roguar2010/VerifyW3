// =============================================================================
// ENTRADA DEL VALIDADOR          RESPONSABLE: Estefany / Ronald     HU-01, HU-02
// Captura la entrada (archivo PDF o código), calcula SHA-256 en navegador y llama al ledger.
// =============================================================================
import { useState, useRef } from 'react';
import { sha256File, formatFileSize } from '../../lib/hash';
import { verifyByHash, verifyByCode } from '../../services/ledger';

const SAMPLES = [
  { label: '✓ Válido', filename: 'diploma_valido.pdf', desc: 'Emisor acreditado y vigente' },
  { label: '⚠️ Adulterado', filename: 'diploma_adulterado.pdf', desc: 'Documento modificado' },
  { label: '✖ Revocado', filename: 'diploma_revocado.pdf', desc: 'Anulado por la universidad' },
  { label: '❓ Emisor desconocido', filename: 'diploma_emisor_desconocido.pdf', desc: 'Cuenta no acreditada' },
];

export default function VerifyInput({ onStart, onResult }) {
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Procesa un archivo File (sea arrastrado, subido o sample)
  const processFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido.');
      return;
    }

    setError('');
    onStart();
    setIsProcessing(true);

    try {
      setStatusMessage('Calculando huella SHA-256 en tu navegador...');
      const hash = await sha256File(file);

      setStatusMessage('Consultando inmutabilidad en Stellar Testnet...');
      const result = await verifyByHash(hash);

      onResult({
        result,
        file: { name: file.name, size: formatFileSize(file.size) },
        hash,
        code: result.credential ? result.credential.code : null,
      });
    } catch (err) {
      console.error(err);
      setError('Error al procesar el archivo o consultar el ledger.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // Manejo de búsqueda por código
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError('');
    onStart();
    setIsProcessing(true);

    try {
      setStatusMessage('Consultando código en la red de Stellar...');
      const result = await verifyByCode(code.trim());

      onResult({
        result,
        file: null,
        hash: result.credential ? result.credential.hash : null,
        code: code.trim(),
      });
    } catch (err) {
      console.error(err);
      setError('Error al consultar el código en el ledger.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // Cargar archivo de ejemplo
  const loadSample = async (filename) => {
    setError('');
    onStart();
    setIsProcessing(true);
    setStatusMessage(`Cargando muestra ${filename}...`);

    try {
      const response = await fetch(`/samples/${filename}`);
      if (!response.ok) throw new Error('No se pudo cargar el archivo de muestra.');
      const blob = await response.blob();
      const sampleFile = new File([blob], filename, { type: 'application/pdf' });
      await processFile(sampleFile);
    } catch (err) {
      setError(`Error al cargar el archivo de muestra: ${err.message}`);
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* TARJETA PRINCIPAL DE ENTRADA */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
        
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
              processFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500/80 bg-slate-50/60 dark:bg-slate-950/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => processFile(e.target.files?.[0])}
            className="hidden"
          />

          <div className="space-y-3">
            <span className="text-5xl inline-block transition transform group-hover:scale-110">
              📂
            </span>
            <div className="space-y-1">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Arrastra tu certificado PDF aquí o haz clic para examinar
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Solo archivos PDF. El cómputo criptográfico es 100% privado en tu navegador.
              </p>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-4 text-xs uppercase font-bold text-slate-400">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span>O consulta por código</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Formulario alternativo por código */}
        <form onSubmit={handleCodeSubmit} className="flex gap-2.5">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: VW3-2026-0001"
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isProcessing || !code.trim()}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition shadow-md whitespace-nowrap"
          >
            Verificar
          </button>
        </form>

        {/* Estado de carga */}
        {isProcessing && (
          <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center gap-3 text-cyan-800 dark:text-cyan-300 text-xs sm:text-sm font-semibold animate-pulse">
            <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold">
            ❌ {error}
          </div>
        )}

        {/* Garantía de privacidad visible */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <span>🔒</span>
          <span>
            <strong>Privacidad garantizada:</strong> Tu archivo nunca sale de tu equipo. Solo se consulta la huella.
          </span>
        </p>
      </div>

      {/* BOTONES DE PRUEBA RÁPIDA (DEMOS DE MUESTRA) */}
      <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            🧪 Pruebas rápidas (Demos del MVP):
          </span>
          <span className="text-[11px] text-slate-500">Haz clic para probar cada escenario</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample.filename}
              onClick={() => loadSample(sample.filename)}
              disabled={isProcessing}
              title={sample.desc}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-cyan-500 dark:hover:border-cyan-400 text-left transition group disabled:opacity-50"
            >
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                {sample.label}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">{sample.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
