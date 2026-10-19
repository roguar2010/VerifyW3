// =============================================================================
// PANTALLA: Portal del emisor        RESPONSABLE: Ronald Guarín
// Implementación completa de HU-03 (Registro/Emisión) y HU-04 (Revocación)
// Conexión real a Soroban Smart Contract con los 5 estados de UI obligatorios.
// =============================================================================
import { useState, useEffect, useRef } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { useWallet } from '../context/WalletContext';
import { INSTITUTIONS, OUTSIDER_ACCOUNT, shortAddress } from '../data/institutions';
import {
  registerCredential,
  revokeCredential,
  listCredentialsByIssuer,
  LedgerError,
  CONTRACT_ID,
} from '../services/ledger';
import { sha256File, formatFileSize, formatDate } from '../lib/hash';

export default function Issue() {
  const {
    address,
    institution,
    isWalletKitConnected,
    isConnecting,
    walletError,
    connect,
    connectWallet,
    disconnect,
    signTransaction,
  } = useWallet();

  // Estados del formulario de emisión y ciclo de vida de UI (Sesión 7)
  const [code, setCode] = useState('');
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Estados de transacción: 'idle' | 'simulating' | 'waiting_signature' | 'submitting' | 'confirmed' | 'error'
  const [txStage, setTxStage] = useState('idle');
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [formError, setFormError] = useState('');

  // Estados de la lista de credenciales y revocación
  const [credentials, setCredentials] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [revokingHash, setRevokingHash] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null); // Credencial seleccionada para modal de confirmación
  const [revokeStage, setRevokeStage] = useState('idle');
  const [revokeError, setRevokeError] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState(null);

  // Estados para prueba de seguridad / revocación forzada (HU-04 Escenario 2)
  const [testHash, setTestHash] = useState('');
  const [testRevoking, setTestRevoking] = useState(false);
  const [testMessage, setTestMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Generador de código sugerido
  const generateSuggestedCode = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `VW3-2026-${randomDigits}`;
  };

  useEffect(() => {
    if (!code) {
      setCode(generateSuggestedCode());
    }
  }, []);

  // Cargar credenciales del emisor conectado
  const loadCredentials = async (addr) => {
    if (!addr) {
      setCredentials([]);
      return;
    }
    setIsLoadingList(true);
    try {
      const list = await listCredentialsByIssuer(addr);
      setCredentials(list);
    } catch (err) {
      console.error('Error cargando credenciales:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadCredentials(address);
    } else {
      setCredentials([]);
    }
    setPublishSuccess(null);
    setTxStage('idle');
    setFormError('');
    setRevokeError('');
    setRevokeSuccess(null);
    setTestMessage(null);
  }, [address]);

  // Manejo de archivo y cálculo SHA-256
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setFormError('Por favor selecciona un archivo PDF válido.');
      return;
    }
    setFormError('');
    setPublishSuccess(null);
    setTxStage('idle');
    setFile({
      name: selectedFile.name,
      size: formatFileSize(selectedFile.size),
    });
    setIsHashing(true);
    try {
      const calculatedHash = await sha256File(selectedFile);
      setHash(calculatedHash);
    } catch (err) {
      setFormError('Error al calcular el hash criptográfico del archivo.');
    } finally {
      setIsHashing(false);
    }
  };

  // Manejo de Drag and Drop
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Enviar formulario de emisión (HU-03)
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!address) {
      setFormError('Debes conectar una billetera institucional antes de publicar.');
      return;
    }
    if (!code.trim()) {
      setFormError('El código de credencial es obligatorio.');
      return;
    }
    if (!hash) {
      setFormError('Debes adjuntar un archivo PDF para calcular su huella criptográfica.');
      return;
    }

    setFormError('');
    setPublishSuccess(null);
    setTxStage('simulating');

    try {
      const result = await registerCredential({
        hash,
        code: code.trim(),
        issuer: address,
        signTransaction: isWalletKitConnected ? signTransaction : null,
        onProgress: (stage) => setTxStage(stage),
      });

      setPublishSuccess(result);
      setTxStage('confirmed');

      // Resetear archivo y regenerar código
      setFile(null);
      setHash('');
      setCode(generateSuggestedCode());
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Recargar lista
      await loadCredentials(address);
    } catch (err) {
      setTxStage('error');
      if (err instanceof LedgerError) {
        if (err.code === 'DUPLICATE') {
          setFormError('⚠️ El documento (o su código de credencial) ya ha sido registrado previamente.');
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(err.message || 'Ocurrió un error inesperado al registrar en la red.');
      }
    }
  };

  // Cerrar modal de revocación con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && revokeTarget) {
        setRevokeTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revokeTarget]);

  // Abrir modal popup de confirmación de revocación (HU-04)
  const openRevokeModal = (credential) => {
    setRevokeTarget(credential);
  };

  // Ejecutar revocación una vez confirmada en el modal popup
  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    const credHash = revokeTarget.hash;
    setRevokeTarget(null);

    setRevokingHash(credHash);
    setRevokeError('');
    setRevokeSuccess(null);
    setRevokeStage('simulating');

    try {
      const result = await revokeCredential({
        hash: credHash,
        caller: address,
        signTransaction: isWalletKitConnected ? signTransaction : null,
        onProgress: (stage) => setRevokeStage(stage),
      });

      setRevokeSuccess(result);
      setRevokeStage('confirmed');
      await loadCredentials(address);
    } catch (err) {
      setRevokeStage('error');
      if (err instanceof LedgerError) {
        setRevokeError(`No se pudo revocar: ${err.message}`);
      } else {
        setRevokeError(err.message || 'Error inesperado al revocar.');
      }
    } finally {
      setRevokingHash(null);
    }
  };

  // Probar revocación forzada (para probar HU-04 Escenario 2 / Not Issuer)
  const handleTestRevoke = async (e) => {
    e.preventDefault();
    if (!testHash.trim()) return;
    setTestRevoking(true);
    setTestMessage(null);

    try {
      await revokeCredential({
        hash: testHash.trim(),
        caller: address,
        signTransaction: isWalletKitConnected ? signTransaction : null,
      });
      setTestMessage({ type: 'success', text: 'Credencial revocada con éxito.' });
      setTestHash('');
      await loadCredentials(address);
    } catch (err) {
      if (err instanceof LedgerError) {
        setTestMessage({
          type: 'error',
          text: `[${err.code}] ${err.message}`,
        });
      } else {
        setTestMessage({ type: 'error', text: err.message || 'Error inesperado.' });
      }
    } finally {
      setTestRevoking(false);
    }
  };

  const isBusy = txStage === 'simulating' || txStage === 'waiting_signature' || txStage === 'submitting';

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      <PageHeader
        badge="🏛️ Portal Institucional · Stellar Soroban"
        title="Panel de emisión y"
        highlight="revocación"
        subtitle="Registra la huella de títulos y diplomas con la firma oficial de tu institución en Stellar Testnet."
      />

      {/* SECCIÓN 1: SELECTOR DE BILLETERA / IDENTIDAD INSTITUCIONAL */}
      <section className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🔐</span> Identidad y Billetera Institucional
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Firma transacciones directamente con Freighter Wallet o selecciona una institución acreditada.
            </p>
          </div>
          {address && (
            <button
              onClick={disconnect}
              className="self-start sm:self-auto text-xs px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 dark:text-slate-300 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 transition font-semibold"
            >
              Desconectar billetera
            </button>
          )}
        </div>

        {walletError && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            ⚠️ {walletError}
          </div>
        )}

        {!address ? (
          <div className="space-y-5">
            {/* Opción 1: Conexión Real con Extensión Web3 (Freighter) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-transparent border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1">
                  Recomendado para evaluación completa
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Conectar con Freighter (Wallet Web3 Stellar)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Usa tu extensión oficial de Stellar en navegador para firmar transacciones on-chain.
                </p>
              </div>
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-md transition disabled:opacity-50 shrink-0"
              >
                {isConnecting ? 'Abriendo Freighter...' : '🚀 Conectar Freighter Wallet'}
              </button>
            </div>

            {/* Opción 2: Selector Rápido de Instituciones Acreditadas */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                O selecciona una identidad pre-acreditada para pruebas rápidas:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INSTITUTIONS.map((inst) => (
                  <button
                    key={inst.address}
                    onClick={() => connect(inst.address)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 text-left transition flex items-start justify-between gap-3 group"
                  >
                    <div>
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-1.5">
                        ✓ Acreditada
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 text-sm">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">{shortAddress(inst.address)}</p>
                    </div>
                    <span className="text-cyan-500 font-bold text-sm">Conectar →</span>
                  </button>
                ))}

                {/* Botón para probar cuenta no acreditada (Outsider) */}
                <button
                  onClick={() => connect(OUTSIDER_ACCOUNT.address)}
                  className="p-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 text-left transition flex items-start justify-between gap-3 group sm:col-span-2"
                >
                  <div>
                    <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 mb-1.5">
                      ⚠️ Cuenta de prueba (No acreditada)
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {OUTSIDER_ACCOUNT.label}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">{shortAddress(OUTSIDER_ACCOUNT.address)}</p>
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">Conectar (Prueba) →</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <span className="font-black text-slate-900 dark:text-white text-base">
                  {institution
                    ? institution.name
                    : address === OUTSIDER_ACCOUNT.address
                    ? OUTSIDER_ACCOUNT.label
                    : 'Billetera Freighter (Emisor Testnet)'}
                </span>
                {institution ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Emisor Verificado
                  </span>
                ) : address === OUTSIDER_ACCOUNT.address ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    No Acreditado
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                    Emisor Activo (Testnet)
                  </span>
                )}
                {isWalletKitConnected && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    🔌 Freighter Conectado
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                Dirección Stellar: <span className="font-bold select-all">{address}</span>
              </p>
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 space-y-1 text-right">
              <div>Red: <span className="font-bold text-amber-600 dark:text-amber-400">Stellar Testnet</span></div>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline block"
              >
                Contrato VerifyW3 en Stellar Expert ↗
              </a>
            </div>
          </div>
        )}
      </section>

      {/* Si no hay billetera conectada, mostrar bloqueo amigable */}
      {!address ? (
        <div className="p-10 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <span className="text-4xl">🔒</span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Billetera requerida para emitir
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Por seguridad e inmutabilidad, solo emisores autenticados mediante una firma institucional pueden registrar o revocar certificados en la red.
          </p>
        </div>
      ) : (
        <>
          {/* SECCIÓN 2: FORMULARIO DE EMISIÓN (HU-03) */}
          <section className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md backdrop-blur-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-xs font-bold mb-2">
                ⚡ HU-03: Registro y Emisión
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Emitir nueva credencial verificable
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Calcula la huella digital del documento y regístrala en el ledger con la firma de tu institución.
              </p>
            </div>

            {/* Aviso de Privacidad y Cumplimiento */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
              <span className="text-base">🛡️</span>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">Garantía de privacidad (Habeas Data):</strong>{' '}
                El archivo PDF se procesa de forma local en tu navegador. El nombre del egresado, calificaciones y datos personales <em>nunca viajan a la red ni se almacenan en servidores</em>. Únicamente la huella matemática SHA-256 queda grabada en el ledger.
              </div>
            </div>

            <form onSubmit={handlePublish} className="space-y-6">
              {/* Campo de Código */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="cred-code" className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Código único de la credencial:
                  </label>
                  <button
                    type="button"
                    onClick={() => setCode(generateSuggestedCode())}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    🎲 Regenerar código sugerido
                  </button>
                </div>
                <input
                  id="cred-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: VW3-2026-1042"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {/* Dropzone / Carga de archivo PDF */}
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Certificado digital en PDF:
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition group ${
                    dragActive
                      ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30 ring-2 ring-cyan-400/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="space-y-2">
                    <span className="text-3xl inline-block group-hover:scale-110 transition">📄</span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {file ? file.name : 'Haz clic o arrastra el diploma en PDF aquí'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {file ? `Tamaño: ${file.size}` : 'Solo archivos PDF (máx. 25 MB)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Indicador de cálculo o hash calculado */}
              {isHashing && (
                <div className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 font-semibold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                  Calculando huella SHA-256 en tu navegador...
                </div>
              )}

              {hash && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Huella SHA-256 calculada:
                  </span>
                  <p className="font-mono text-xs break-all text-cyan-700 dark:text-cyan-300 select-all">
                    {hash}
                  </p>
                </div>
              )}

              {/* ============================================================ */}
              {/* LOS 5 ESTADOS DE UI OBLIGATORIOS DE SESIÓN 7 */}
              {/* ============================================================ */}

              {/* Estado 2: Simulación previa */}
              {txStage === 'simulating' && (
                <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-cyan-800 dark:text-cyan-200">
                    <span className="font-bold block">Paso 1/3: Simulando transacción en Soroban</span>
                    <span>Validando precondiciones y estimando costo de gas antes de solicitar firma...</span>
                  </div>
                </div>
              )}

              {/* Estado 3: Esperando firma en Wallet */}
              {txStage === 'waiting_signature' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-bold block">Paso 2/3: Esperando firma en Freighter Wallet</span>
                    <span>Por favor abre tu extensión Freighter y autoriza la invocación del contrato.</span>
                  </div>
                </div>
              )}

              {/* Estado 4: Enviando y confirmando en la red */}
              {txStage === 'submitting' && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="text-xs text-indigo-800 dark:text-indigo-200">
                    <span className="font-bold block">Paso 3/3: Transacción enviada a Stellar Testnet</span>
                    <span>Esperando confirmación por consenso de validadores Soroban...</span>
                  </div>
                </div>
              )}

              {/* Estado 6 (Error): Mensajes de error amigables */}
              {formError && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold flex items-start gap-2">
                  <span className="text-base shrink-0">❌</span>
                  <div className="space-y-1">
                    <span className="font-bold block">No se pudo completar el registro:</span>
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isBusy || isHashing || !hash || !code}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-950 font-black text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Procesando en Stellar Testnet...</span>
                  </>
                ) : (
                  <>
                    <span>✍️ Firmar y Publicar en la Red Stellar</span>
                  </>
                )}
              </button>
            </form>

            {/* Estado 5: Recibo de Éxito de Publicación con Link a Stellar Expert */}
            {publishSuccess && (
              <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-base">
                  <span>🎉</span>
                  <span>Credencial registrada exitosamente en Stellar Testnet</span>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <dt className="text-slate-500 font-semibold">Código</dt>
                    <dd className="font-mono font-bold text-slate-800 dark:text-white">
                      {publishSuccess.credential.code}
                    </dd>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <dt className="text-slate-500 font-semibold">Estado On-Chain</dt>
                    <dd className="font-bold text-emerald-600 dark:text-emerald-400">
                      {publishSuccess.credential.onChain ? '✓ Grabado en Testnet' : 'Modo Demostración'}
                    </dd>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 sm:col-span-1">
                    <dt className="text-slate-500 font-semibold">Tx Hash / Identificador</dt>
                    <dd className="font-mono font-bold text-cyan-600 dark:text-cyan-400 truncate" title={publishSuccess.txId}>
                      {publishSuccess.txId}
                    </dd>
                  </div>
                </dl>

                {publishSuccess.explorerUrl && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Explorador público de la red:
                    </span>
                    <a
                      href={publishSuccess.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                    >
                      <span>Ver Transacción en Stellar Expert</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECCIÓN 3: LISTADO DE CREDENCIALES DEL EMISOR Y REVOCACIÓN (HU-04) */}
          <section className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md backdrop-blur-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
                  📋 Mis Credenciales Emitidas
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Historial y Control de Emisiones
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
                Total: {credentials.length} registro(s)
              </span>
            </div>

            {/* Progreso durante revocación */}
            {revokeStage !== 'idle' && revokeStage !== 'confirmed' && revokeStage !== 'error' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {revokeStage === 'simulating' && 'Simulando revocación en Soroban...'}
                  {revokeStage === 'waiting_signature' && 'Esperando firma de revocación en Freighter...'}
                  {revokeStage === 'submitting' && 'Enviando transacción de revocación a Stellar Testnet...'}
                </span>
              </div>
            )}

            {revokeSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3">
                <span>✓ Credencial revocada exitosamente en el ledger.</span>
                {revokeSuccess.explorerUrl && (
                  <a
                    href={revokeSuccess.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-emerald-700 dark:text-emerald-300 font-bold"
                  >
                    Ver en Stellar Expert ↗
                  </a>
                )}
              </div>
            )}

            {revokeError && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-semibold">
                ❌ {revokeError}
              </div>
            )}

            {isLoadingList ? (
              <p className="text-center text-sm text-slate-500 py-8">Cargando credenciales del ledger...</p>
            ) : credentials.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No hay credenciales registradas con esta cuenta institucional aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                      <th className="pb-3">Código</th>
                      <th className="pb-3">Huella SHA-256</th>
                      <th className="pb-3">Fecha de emisión</th>
                      <th className="pb-3">Estado</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {credentials.map((c) => (
                      <tr key={c.hash} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                          {c.code}
                        </td>
                        <td className="py-3.5 font-mono text-xs text-slate-500" title={c.hash}>
                          {c.hash.slice(0, 10)}…{c.hash.slice(-8)}
                        </td>
                        <td className="py-3.5 text-slate-600 dark:text-slate-400">
                          {formatDate(c.issuedAt)}
                        </td>
                        <td className="py-3.5">
                          {c.status === 'ACTIVE' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800">
                              ● Vigente
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold text-xs border border-red-300 dark:border-red-800">
                              ✖ Revocada
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {c.status === 'ACTIVE' ? (
                            <button
                              onClick={() => openRevokeModal(c)}
                              disabled={revokingHash === c.hash}
                              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-800 transition disabled:opacity-50"
                            >
                              {revokingHash === c.hash ? 'Revocando...' : 'Revocar'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Inmutable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* SECCIÓN 4: TEST DE SEGURIDAD (HU-04 Escenario 2: Intentar revocar credencial ajena) */}
          <section className="bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                🛡️ Control de Acceso y Seguridad (HU-04 Escenario 2)
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Prueba de rechazo: Revocar credencial con firma ajena
              </h3>
              <p className="text-xs text-slate-500">
                Demuestra que si una cuenta intenta revocar un certificado que no le pertenece, el ledger rechaza la transacción con error <code>NOT_ISSUER</code>.
              </p>
            </div>

            <form onSubmit={handleTestRevoke} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testHash}
                onChange={(e) => setTestHash(e.target.value)}
                placeholder="Pega el hash de cualquier credencial ajena para probar..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={testRevoking || !testHash.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {testRevoking ? 'Probando firma...' : 'Intentar Revocar'}
              </button>
            </form>

            {testMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  testMessage.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {testMessage.text}
              </div>
            )}
          </section>
        </>
      )}

      {/* MODAL / POPUP DE CONFIRMACIÓN DE REVOCACIÓN */}
      {revokeTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setRevokeTarget(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar esquina */}
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg p-1 transition"
              aria-label="Cerrar ventana de confirmación"
            >
              ✕
            </button>

            {/* Ícono de advertencia */}
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl mx-auto shadow-sm">
              ⚠️
            </div>

            {/* Título y descripción */}
            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                ¿Confirmar revocación de título?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta acción registrará una revocación permanente en el Smart Contract de Stellar Soroban.
              </p>
            </div>

            {/* Ficha técnica del título a revocar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Código único:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/70 dark:bg-slate-700/70 px-2 py-0.5 rounded-md">
                  {revokeTarget.code}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Huella SHA-256:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={revokeTarget.hash}>
                  {revokeTarget.hash.slice(0, 10)}…{revokeTarget.hash.slice(-8)}
                </span>
              </div>
              {revokeTarget.issuedAt && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Fecha emisión:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {formatDate(revokeTarget.issuedAt)}
                  </span>
                </div>
              )}
            </div>

            {/* Alerta de inmutabilidad */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <span className="text-base shrink-0">🛡️</span>
              <p className="leading-relaxed">
                <strong>Acción inmutable:</strong> Una vez firmada la transacción en Stellar Testnet, el diploma aparecerá como <strong>REVOCADO</strong> en cualquier verificación pública. Esta operación no se puede deshacer.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRevoke}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition flex items-center justify-center gap-1.5"
              >
                <span>🔥</span>
                <span>Sí, Revocar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
