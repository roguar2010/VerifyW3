// ============================================================================
// Ledger SIMULADO (reemplaza al contrato Soroban hasta la semana 4).
//
// IMPORTANTE para el equipo:
//  - La UI solo debe hablar con ESTE archivo, nunca tocar localStorage directo.
//  - Las firmas de las funciones son las que tendrá el cliente real de Soroban,
//    así la semana 4 solo se reescribe este archivo.
//  - Privacidad (HU-01 esc.3): on-chain solo viven hash, código, emisor, fechas y estado.
//    NUNCA guardar nombre del egresado ni datos personales.
// ============================================================================
import seed from '../data/seed.json';
import { INSTITUTIONS } from '../data/institutions';

const KEY = 'verifyw3-ledger-v1';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export class LedgerError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'DUPLICATE' | 'NOT_FOUND' | 'NOT_ISSUER' | 'ALREADY_REVOKED' | 'INVALID'
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* localStorage no disponible: se usa memoria */
  }
  return { credentials: structuredClone(seed.credentials) };
}

let state = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

// ---- Directorio de instituciones (HU-05) ----
export const listInstitutions = () => INSTITUTIONS;
export const getInstitution = (address) => INSTITUTIONS.find((i) => i.address === address) ?? null;

// ---- Consultas (HU-01, HU-02, HU-05) ----
// Devuelve { verdict, credential, institution }
//   verdict: 'VALID' | 'REVOKED' | 'NOT_FOUND'
//   institution: objeto del directorio, o null si el emisor NO está acreditado
function buildResult(credential) {
  if (!credential) return { verdict: 'NOT_FOUND', credential: null, institution: null };
  return {
    verdict: credential.status === 'REVOKED' ? 'REVOKED' : 'VALID',
    credential,
    institution: getInstitution(credential.issuer),
  };
}

export async function verifyByHash(hash) {
  await delay(900); // simula latencia de lectura RPC
  return buildResult(state.credentials.find((c) => c.hash === hash.toLowerCase()));
}

export async function verifyByCode(code) {
  await delay(900);
  return buildResult(state.credentials.find((c) => c.code.toLowerCase() === code.trim().toLowerCase()));
}

// ---- Escritura (HU-03, HU-04) ----
export async function registerCredential({ hash, code, issuer }) {
  await delay(1500); // simula firma + confirmación (< 5 s)
  if (!hash || !code || !issuer) throw new LedgerError('INVALID', 'Faltan datos para registrar.');
  const h = hash.toLowerCase();
  if (state.credentials.some((c) => c.hash === h || c.code.toLowerCase() === code.toLowerCase())) {
    throw new LedgerError('DUPLICATE', 'El documento (o su código) ya fue registrado.');
  }
  const credential = { hash: h, code, issuer, issuedAt: new Date().toISOString(), status: 'ACTIVE', revokedAt: null };
  state.credentials.push(credential);
  save();
  return { credential, ledger: 5_420_000 + state.credentials.length, txId: `${h.slice(0, 8)}…${h.slice(-6)}` };
}

// `caller` = dirección de la billetera que firma. Solo el emisor original puede revocar.
export async function revokeCredential({ hash, caller }) {
  await delay(1500);
  const c = state.credentials.find((x) => x.hash === hash.toLowerCase());
  if (!c) throw new LedgerError('NOT_FOUND', 'La credencial no existe.');
  if (c.issuer !== caller) {
    throw new LedgerError('NOT_ISSUER', 'Transacción revertida: la firma no corresponde al emisor original.');
  }
  if (c.status === 'REVOKED') throw new LedgerError('ALREADY_REVOKED', 'La credencial ya estaba revocada.');
  c.status = 'REVOKED';
  c.revokedAt = new Date().toISOString(); // issuedAt se conserva: el historial no se borra
  save();
  return { credential: c };
}

export async function listCredentialsByIssuer(issuer) {
  return state.credentials.filter((c) => c.issuer === issuer).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

// Útil para demos: vuelve al estado inicial (seed)
export function resetLedger() {
  state = { credentials: structuredClone(seed.credentials) };
  save();
}
