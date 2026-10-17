// =============================================================================
// ENTRADA DEL VALIDADOR          RESPONSABLE: Ronald / Tefy         HU-01, HU-02
// Captura la entrada (archivo PDF o código único), calcula SHA-256 en cliente
// y consulta el contrato Soroban en Stellar Testnet.
// =============================================================================
import { useState, useRef } from 'react';
import { verifyByHash, verifyByCode } from '../../services/ledger';
import { sha256File, formatFileSize } from '../../lib/hash';

export default function VerifyInput({ onStart, onResult }) {
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'code'
  const [codeInput, setCodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Escenarios rápidos de prueba
  const DEMO_SCENARIOS = [
    {
      label: '🌐 Testnet Soroban (VW3-TESTNET-001)',
      type: 'code',
      value: 'VW3-TESTNET-001',
      desc: 'Registro on-chain verificado en Stellar Testnet',
    },
    {
      label: '✅ Título Vigente (Demo)',
      type: 'hash',
      value: '8f4e2c91b539c81d04ea7e66dfb37c02c6114b03512a9757a31b45f49e0b201a',
      fileName: 'diploma_ingenieria_udea.pdf',
      fileSize: '1.4 MB',
    },
    {
      label: '⚠️ Título Adulterado (Fraude)',
      type: 'hash',
      value: 'd3b07384d113edec49eaa6238ad5ff00fc6b7a5a8e0f983a45c79b1836183ef9',
      fileName: 'diploma_adulterado_notas.pdf',
      fileSize: '1.38 MB',
    },
    {
      label: '🚫 Título Revocado',
      type: 'hash',
      value: 'e2b9c7a10f84523ad67914801127bc4351a9e384c20fe81b9534da20194bc021',
      fileName: 'acta_disciplinaria_revocada.pdf',
      fileSize: '890 KB',
    },
  ];

  // Ejecución de verificación por Archivo
  const handleFileProcess = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Por favor selecciona un archivo PDF válido.');
      return;
    }

    onStart?.();
    setIsScanning(true);

    try {
      const calculatedHash = await sha256File(file);
      const result = await verifyByHash(calculatedHash);
      onResult?.({
        result,
        file: { name: file.name, size: formatFileSize(file.size) },
        hash: calculatedHash,
        code: result?.credential?.code || null,
      });
    } catch (err) {
      console.error('Error al procesar archivo:', err);
      onResult?.({
        result: { verdict: 'NOT_FOUND', credential: null, institution: null },
        file: { name: file.name, size: formatFileSize(file.size) },
        hash: null,
        code: null,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Ejecución de verificación por Código
  const handleCodeSubmit = async (e) => {
    e?.preventDefault();
    const clean = codeInput.trim();
    if (!clean) return;

    onStart?.();
    setIsScanning(true);

    try {
      const result = await verifyByCode(clean);
      onResult?.({
        result,
        file: null,
        hash: result?.credential?.hash || null,
        code: clean,
      });
    } catch (err) {
      console.error('Error consultando código:', err);
      onResult?.({
        result: { verdict: 'NOT_FOUND', credential: null, institution: null },
        file: null,
        hash: null,
        code: clean,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Lanzar escenario de demostración
  const triggerScenario = async (scenario) => {
    onStart?.();
    setIsScanning(true);

    try {
      if (scenario.type === 'code') {
        setActiveTab('code');
        setCodeInput(scenario.value);
        const result = await verifyByCode(scenario.value);
        onResult?.({
          result,
          file: null,
          hash: result?.credential?.hash || null,
          code: scenario.value,
        });
      } else {
        setActiveTab('file');
        const result = await verifyByHash(scenario.value);
        onResult?.({
          result,
          file: { name: scenario.fileName, size: scenario.fileSize },
          hash: scenario.value,
          code: result?.credential?.code || null,
        });
      }
    } catch (err) {
      console.error('Error en escenario:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de modo: Archivo vs Código */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'file'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>📄</span>
          <span>Por Archivo PDF</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`py-3 px-6 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
            activeTab === 'code'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>🔢</span>
          <span>Por Código de Credencial</span>
        </button>
      </div>

      {/* Contenido pestaña: ARCHIVO */}
      {activeTab === 'file' && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm ${
            dragActive
              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-cyan-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => handleFileProcess(e.target.files[0])}
            className="hidden"
          />
          <div className="space-y-3">
            <span className="text-5xl block animate-bounce-subtle">📄</span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Arrastra aquí tu título o diploma en PDF
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              El hash criptográfico SHA-256 se calcula en tu navegador. Tus notas y datos personales nunca se envían a ningún servidor ni salen de tu equipo.
            </p>
            <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              O haz clic para examinar archivos
            </span>
          </div>
        </div>
      )}

      {/* Contenido pestaña: CÓDIGO */}
      {activeTab === 'code' && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Ingresa el código único (Ej: VW3-TESTNET-001 o VW3-2026-1042)"
              className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isScanning || !codeInput.trim()}
              className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-md transition disabled:opacity-50"
            >
              Consultar en Red
            </button>
          </div>
        </form>
      )}

      {/* Indicador de consulta / simulación en curso */}
      {isScanning && (
        <div className="p-4 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 flex items-center gap-3 animate-pulse">
          <div className="w-5 h-5 border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs sm:text-sm font-semibold text-cyan-800 dark:text-cyan-200">
            Consultando Smart Contract VerifyW3 en Stellar Testnet (Soroban RPC)...
          </span>
        </div>
      )}

      {/* Botones de Escenarios Rápidos */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
          Casos de prueba preconfigurados:
        </span>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => triggerScenario(sc)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-cyan-400 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}