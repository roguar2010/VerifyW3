import { createContext, useContext, useState, useEffect } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { getInstitution } from '../services/ledger';

const WalletContext = createContext(null);

let isKitInitialized = false;

function initKit() {
  if (typeof window === 'undefined') return;
  if (!isKitInitialized) {
    try {
      StellarWalletsKit.init({
        network: Networks.TESTNET,
        modules: [new FreighterModule()],
        authModal: {
          showInstallLabel: false, // Desactivar la etiqueta que bloquea el clic con "Install ↗"
          hideUnsupportedWallets: false,
        },
      });
      isKitInitialized = true;
    } catch (err) {
      console.warn('Advertencia al inicializar StellarWalletsKit:', err);
    }
  }
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(() => {
    try {
      return localStorage.getItem('verifyw3-wallet') || null;
    } catch {
      return null;
    }
  });

  const [isWalletKitConnected, setIsWalletKitConnected] = useState(() => {
    try {
      return localStorage.getItem('verifyw3-wallet-iskit') === 'true';
    } catch {
      return false;
    }
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // Inicializar el kit en el montaje del componente
  useEffect(() => {
    initKit();
  }, []);

  const saveAddress = (addr, isKit = false) => {
    setAddress(addr);
    setIsWalletKitConnected(isKit);
    try {
      if (addr) {
        localStorage.setItem('verifyw3-wallet', addr);
        localStorage.setItem('verifyw3-wallet-iskit', isKit ? 'true' : 'false');
      } else {
        localStorage.removeItem('verifyw3-wallet');
        localStorage.removeItem('verifyw3-wallet-iskit');
      }
    } catch {
      /* noop */
    }
  };

  // Conexión real con Freighter / Stellar Wallets Kit
  const connectWallet = async () => {
    setIsConnecting(true);
    setWalletError(null);
    initKit();

    try {
      let pubKey = null;

      // 1. Intentar conexión directa con la extensión inyectada en window (evita retardos de carga de Vercel)
      if (typeof window !== 'undefined') {
        const injected = window.freighter || (window.stellar?.provider === 'freighter' ? window.stellar : null);
        if (injected) {
          try {
            if (injected.requestAccess) {
              const accessResult = await injected.requestAccess();
              if (!accessResult?.error) {
                const pkResult = await (injected.getPublicKey ? injected.getPublicKey() : injected.getAddress());
                const detectedAddr = typeof pkResult === 'string' ? pkResult : pkResult?.address || pkResult?.publicKey;
                if (detectedAddr) {
                  pubKey = detectedAddr;
                  try {
                    StellarWalletsKit.setWallet('freighter');
                  } catch {
                    /* noop */
                  }
                }
              }
            }
          } catch (injectErr) {
            console.warn('Acceso directo con window.freighter falló, usando módulo del kit:', injectErr);
          }
        }
      }

      // 2. Si no se detectó por window directo, probar con FreighterModule oficial
      if (!pubKey) {
        try {
          const freighter = new FreighterModule();
          const res = await freighter.getAddress();
          if (res?.address) {
            pubKey = res.address;
            try {
              StellarWalletsKit.setWallet(freighter.productId);
            } catch {
              /* noop */
            }
          }
        } catch (modErr) {
          console.warn('FreighterModule.getAddress no disponible de inmediato, abriendo modal:', modErr);
        }
      }

      // 3. Fallback: Abrir el modal visual de StellarWalletsKit
      if (!pubKey) {
        try {
          const modalResult = await StellarWalletsKit.authModal();
          if (modalResult?.address) {
            pubKey = modalResult.address;
          }
        } catch (modalErr) {
          if (modalErr?.code === -1 && String(modalErr?.message).toLowerCase().includes('close')) {
            setIsConnecting(false);
            return;
          }
          throw modalErr;
        }
      }

      if (pubKey) {
        saveAddress(pubKey, true);
        setWalletError(null);
      } else {
        throw new Error('No se pudo obtener la clave pública de la billetera.');
      }
    } catch (err) {
      console.error('Error al conectar con Freighter:', err);
      const msg =
        err?.message ||
        'Error al conectar con Freighter. Asegúrate de tener la extensión instalada, desbloqueada y en Stellar Testnet.';
      setWalletError(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  // Conexión manual simulada para pruebas institucionales preconfiguradas
  const connectSimulated = (addr) => {
    saveAddress(addr, false);
    setWalletError(null);
  };

  const disconnect = () => {
    saveAddress(null, false);
    setWalletError(null);
    try {
      StellarWalletsKit.disconnect();
    } catch {
      /* noop */
    }
  };

  // Firma de transacción XDR mediante Freighter o el módulo activo
  const signTransaction = async (xdr) => {
    initKit();
    const networkPassphrase = 'Test SDF Network ; September 2015';

    // 1. Probar primero con la extensión inyectada en window
    if (typeof window !== 'undefined') {
      const injected = window.freighter || (window.stellar?.provider === 'freighter' ? window.stellar : null);
      if (injected) {
        // Asegurar que la sesión de la extensión esté autorizada en esta pestaña
        try {
          if (injected.isConnected) {
            const isConn = await injected.isConnected();
            if (!isConn && injected.requestAccess) {
              await injected.requestAccess();
            }
          } else if (injected.requestAccess) {
            await injected.requestAccess();
          }
        } catch (connErr) {
          console.warn('Verificación previa de Freighter:', connErr);
        }

        if (injected.signTransaction) {
          try {
            const res = await injected.signTransaction(xdr, { networkPassphrase });
            const signed = typeof res === 'string' ? res : res?.signedTxXdr || res?.signedXDR || res?.signedXdr;
            if (signed) return signed;
          } catch (e) {
            // Si Freighter responde que no está conectado o está bloqueado, solicitar acceso y reintentar
            if (String(e?.message).toLowerCase().includes('not connected') && injected.requestAccess) {
              try {
                await injected.requestAccess();
                const retryRes = await injected.signTransaction(xdr, { networkPassphrase });
                const retrySigned = typeof retryRes === 'string' ? retryRes : retryRes?.signedTxXdr || retryRes?.signedXDR || retryRes?.signedXdr;
                if (retrySigned) return retrySigned;
              } catch (retryErr) {
                console.warn('Reintento con requestAccess falló:', retryErr);
              }
            }
            console.warn('Firma directa con window.freighter falló, probando StellarWalletsKit:', e);
          }
        }
      }
    }

    // 2. Probar mediante StellarWalletsKit
    try {
      const result = await StellarWalletsKit.signTransaction(xdr, { networkPassphrase });
      return result.signedTxXdr || result.signedXDR || result.signedXdr || result;
    } catch (err) {
      console.warn('Fallback a FreighterModule directo para firmar:', err);
      const freighter = new FreighterModule();
      const res = await freighter.signTransaction(xdr, { networkPassphrase });
      return res.signedTxXdr || res.signedXDR || res.signedXdr || res;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        institution: address ? getInstitution(address) : null,
        isConnecting,
        walletError,
        isWalletKitConnected,
        connect: connectSimulated,
        connectWallet,
        disconnect,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
