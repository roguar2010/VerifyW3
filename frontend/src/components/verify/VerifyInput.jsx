// =============================================================================
// ENTRADA DEL VALIDADOR          RESPONSABLE: Estefany / Ronald     HU-01, HU-02
// Captura la entrada (archivo PDF o código), calcula SHA-256 en navegador y llama al ledger.
// =============================================================================
import React, { useState, useRef } from 'react';

/**
 * Componente VerifyInput - Módulo de verificación de documentos
 * - Drag & Drop de PDFs
 * - Cálculo de hash SHA-256 en cliente
 * - Consulta a Stellar Soroban
 * - Visualización de resultados
 */
const VerifyInput = () => {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [hash, setHash] = useState(null);
  const fileInputRef = useRef(null);

  // ==================== FUNCIONES CRIPTOGRÁFICAS ====================
  /**
   * Calcula SHA-256 real usando Web Crypto API
   * @param {File} file - Archivo a hashear
   * @returns {Promise<string>} - Hash hexadecimal de 64 caracteres
   */
  const computeFileSHA256 = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error al calcular hash:', error);
      throw error;
    }
  };

  // ==================== CONSULTA A STELLAR ====================
  /**
   * Simula consulta al smart contract Soroban en Stellar
   * En producción, esto llamaría a la RPC de Soroban
   * @param {string} hash - Hash SHA-256 del documento
   * @returns {Promise<Object>} - Resultado de verificación
   */
  const queryStellarContract = async (hash) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // En producción: llamar a Stellar RPC
        // const result = await invokeContractFunction(contractId, 'verify', hash);

        // Por ahora simulamos basándonos en patrones del hash
        if (hash.includes('000') || Math.random() > 0.7) {
          resolve({
            status: 'valid',
            issuer: 'Universidad de Antioquia',
            state: 'Vigente',
            date: '24 Sep 2026',
          });
        } else if (hash.startsWith('d3b') || hash.startsWith('e2b')) {
          resolve({
            status: 'altered',
            reason: 'Discrepancia crítica en documento',
          });
        } else {
          resolve({
            status: 'revoked',
            reason: 'Sustitución por duplicado o sanción administrativa',
            date: '02 Oct 2026',
          });
        }
      }, 1000);
    });
  };

  // ==================== FORMATEO ====================
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // ==================== PROCESAMIENTO DE ARCHIVOS ====================
  /**
   * Procesa un archivo real (drag & drop o file input)
   */
  const processFile = async (selectedFile) => {
    if (!selectedFile || !selectedFile.type.includes('pdf')) {
      alert('Por favor, sube un archivo PDF válido.');
      return;
    }

    setFile(selectedFile);
    setIsScanning(true);
    setResult(null);

    try {
      // 1. Calcular hash SHA-256
      const calculatedHash = await computeFileSHA256(selectedFile);
      setHash(calculatedHash);

      // 2. Consultar Stellar
      const verificationResult = await queryStellarContract(calculatedHash);

      // 3. Mostrar resultado
      setResult({
        filename: selectedFile.name,
        size: formatFileSize(selectedFile.size),
        hash: calculatedHash,
        ...verificationResult,
      });
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Error al procesar el archivo: ' + error.message,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // ==================== ESCENARIOS DE DEMOSTRACIÓN ====================
  /**
   * Carga un escenario simulado desde /samples
   */
  const loadScenario = async (type) => {
    setIsScanning(true);
    setResult(null);

    const scenarios = {
      valid: {
        filename: 'diploma_ingenieria_2026.pdf',
        hash: '8f4e2c91b539c81d04ea7e66dfb37c02c6114b03512a9757a31b45f49e0b201a',
        size: '1.4 MB',
      },
      altered: {
        filename: 'diploma_modificado_notas.pdf',
        hash: 'd3b07384d113edec49eaa6238ad5ff00fc6b7a5a8e0f983a45c79b1836183ef9',
        size: '1.38 MB',
      },
      revoked: {
        filename: 'acta_disciplinaria_revocada.pdf',
        hash: 'e2b9c7a10f84523ad67914801127bc4351a9e384c20fe81b9534da20194bc021',
        size: '890 KB',
      },
    };

    const scenario = scenarios[type];
    setHash(scenario.hash);

    try {
      const verificationResult = await queryStellarContract(scenario.hash);
      setResult({
        ...scenario,
        ...verificationResult,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // ==================== EVENT HANDLERS ====================
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-cyan-500', 'bg-cyan-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-50');
    if (e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // ==================== RENDERIZADO ====================
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Verifica tu Título o Certificado
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Arrastra un PDF o usa los botones de prueba para verificar instantáneamente
        </p>
      </div>

      {/* Quick Test Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => loadScenario('valid')}
          className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/90 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-sm"
        >
          ✅ Título Original (Válido)
        </button>
        <button
          onClick={() => loadScenario('altered')}
          className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-950/90 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 font-bold text-sm"
        >
          ⚠️ Título Adulterado (Fraude)
        </button>
        <button
          onClick={() => loadScenario('revoked')}
          className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/90 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold text-sm"
        >
          🚫 Título Revocado
        </button>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 transition-all rounded-3xl p-12 text-center cursor-pointer bg-white/95 dark:bg-slate-900/95"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => e.target.files && processFile(e.target.files[0])}
          className="hidden"
        />

        <div className="space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center mx-auto text-cyan-600 dark:text-cyan-400 text-4xl">
            📄
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Arrastra aquí tu documento
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Soporta PDF, PNG o JPG • Sin envío a servidores
          </p>
          <p className="text-xs text-slate-500 font-mono">
            SHA-256 Client-Side • Cero privacidad comprometida
          </p>
        </div>
      </div>

      {/* Scanning State */}
      {isScanning && (
        <div className="bg-white dark:bg-slate-900 border border-cyan-500 p-7 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-lg text-cyan-600 dark:text-cyan-300">
              Consultando Stellar...
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-2/3 animate-pulse" />
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && !isScanning && (
        <ResultCard result={result} />
      )}
    </div>
  );
};

/**
 * Componente auxiliar para mostrar resultados
 */
const ResultCard = ({ result }) => {
  if (result.status === 'error') {
    return (
      <div className="bg-red-950/70 border-2 border-red-500 rounded-3xl p-8 text-white space-y-4">
        <h3 className="text-2xl font-bold">❌ Error</h3>
        <p>{result.message}</p>
      </div>
    );
  }

  if (result.status === 'valid') {
    return (
      <div className="bg-gradient-to-b from-emerald-950/70 to-slate-900 border-2 border-emerald-500 rounded-3xl p-8 text-white space-y-6 shadow-2xl">
        <div className="flex items-center gap-4 pb-4 border-b border-emerald-800/60">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 text-4xl font-black">
            ✓
          </div>
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold mb-2">
              Auténtico y Vigente
            </div>
            <h3 className="text-2xl font-black">Certificado Oficial Verificado</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-bold uppercase block">
              Institución Emisora
            </span>
            <strong className="text-slate-100 text-lg mt-1 block">
              {result.issuer}
            </strong>
            <span className="text-xs text-emerald-400 mt-1 block font-semibold">
              🏛️ Registro Oficial SNIES
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-bold uppercase block">
              Archivo Evaluado
            </span>
            <strong className="text-slate-200 font-mono text-sm mt-1 block truncate">
              {result.filename}
            </strong>
            <span className="text-xs text-slate-400 mt-1 block">
              Tamaño: {result.size}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs text-slate-400 font-bold uppercase block">
              Estado en Stellar
            </span>
            <strong className="text-emerald-400 text-lg mt-1 block">
              {result.state}
            </strong>
            <span className="text-xs text-slate-400 mt-1 block">
              Fecha: {result.date}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400">Hash SHA-256 calculado:</div>
          <div className="text-cyan-400 break-all select-all font-bold text-sm">
            {result.hash}
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'altered') {
    return (
      <div className="bg-gradient-to-b from-rose-950/80 to-slate-900 border-2 border-rose-500 rounded-3xl p-8 text-white space-y-6 shadow-2xl">
        <div className="flex items-center gap-4 pb-4 border-b border-rose-800/60">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 text-4xl font-black">
            ✕
          </div>
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-rose-500 text-slate-950 text-xs font-bold mb-2">
              Alerta de Fraude
            </div>
            <h3 className="text-2xl font-black">El documento ha sido alterado</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-2">
          <p className="font-bold text-lg">
            ⚠️ La huella no coincide con ningún título oficial emitido.
          </p>
          <p className="text-sm text-rose-300">
            {result.reason} Esto puede deberse a alteraciones en calificaciones, nombres o fechas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400">Hash del documento sospechoso:</div>
          <div className="text-rose-400 break-all select-all font-bold text-sm">
            {result.hash}
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'revoked') {
    return (
      <div className="bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-500 rounded-3xl p-8 text-white space-y-6 shadow-2xl">
        <div className="flex items-center gap-4 pb-4 border-b border-amber-800/60">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 text-4xl font-black">
            !
          </div>
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold mb-2">
              Título Revocado
            </div>
            <h3 className="text-2xl font-black">Credencial sin Validez Actual</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 space-y-2">
          <p className="font-bold text-lg">
            El documento fue auténtico en el pasado, pero fue revocado.
          </p>
          <p className="text-sm text-amber-300">
            Motivo: {result.reason}
            <br />
            Fecha de revocación: {result.date}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
          <div className="text-slate-400">Hash histórico en Stellar Ledger:</div>
          <div className="text-amber-400 break-all select-all font-bold text-sm">
            {result.hash}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyInput;