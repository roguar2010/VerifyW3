// =============================================================================
// MAPEO DE ERRORES HUMANOS (Sesión 7: Integración de Interfaz y Wallets)
// Traduce excepciones crudas de Soroban RPC, XDR y Wallets a mensajes legibles.
// =============================================================================

export function mapSorobanError(error) {
  if (!error) return 'Ocurrió un error desconocido.';
  const msg = typeof error === 'string' ? error : error.message || error.toString();

  // 1. Rechazo de firma por el usuario en Freighter / Wallet
  if (
    msg.includes('-4') ||
    msg.toLowerCase().includes('user declined') ||
    msg.toLowerCase().includes('user rejected') ||
    msg.toLowerCase().includes('cancelled') ||
    msg.toLowerCase().includes('canceled')
  ) {
    return 'Cancelaste la firma en tu wallet.';
  }

  // 2. Cuenta no encontrada o sin fondos (falta fondear con Friendbot)
  if (
    msg.toLowerCase().includes('account not found') ||
    msg.toLowerCase().includes('op_underfunded') ||
    msg.toLowerCase().includes('underfunded')
  ) {
    return 'Tu cuenta todavía no tiene fondos en Stellar Testnet. Puedes fondearla gratis usando el Friendbot de Stellar.';
  }

  // 3. Discrepancia de red (Wallet en Mainnet en lugar de Testnet)
  if (
    msg.toLowerCase().includes('network mismatch') ||
    msg.toLowerCase().includes('network passphrase')
  ) {
    return 'Tu wallet está configurada en una red distinta. Por favor cambia la red a Stellar Testnet en tu billetera.';
  }

  // 4. Códigos de error del Smart Contract VerifyW3 (#[contracterror])
  if (msg.includes('Error(Contract, #1)') || msg.includes('AlreadyInitialized')) {
    return 'El contrato ya se encuentra inicializado.';
  }
  if (msg.includes('Error(Contract, #2)') || msg.includes('RecordAlreadyExists')) {
    return '⚠️ Este documento (hash SHA-256) ya ha sido emitido y registrado previamente en el ledger.';
  }
  if (msg.includes('Error(Contract, #3)') || msg.includes('CodeAlreadyExists')) {
    return '⚠️ El código de verificación especificado ya está asociado a otra credencial.';
  }
  if (msg.includes('Error(Contract, #4)') || msg.includes('RecordNotFound')) {
    return 'No se encontró ningún registro para este hash o código en el ledger de Stellar.';
  }
  if (msg.includes('Error(Contract, #5)') || msg.includes('NotAuthorized')) {
    return '🚫 Transacción rechazada: Solo la institución que emitió originalmente esta credencial tiene autorización para revocarla.';
  }
  if (msg.includes('Error(Contract, #6)') || msg.includes('AlreadyRevoked')) {
    return 'Esta credencial ya fue revocada previamente en el ledger.';
  }

  // 5. Errores de simulación o expiración
  if (msg.toLowerCase().includes('simulation failed')) {
    return 'La simulación de la transacción falló en el nodo RPC de Stellar. Verifica los datos enviados.';
  }

  return `Error en la red Stellar: ${msg}`;
}
