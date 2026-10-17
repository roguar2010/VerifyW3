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

      // 1. Intentar abrir el modal oficial de StellarWalletsKit
      try {
        const modalResult = await StellarWalletsKit.authModal();
        if (modalResult?.address) {
          pubKey = modalResult.address;
        }
      } catch (modalErr) {
        // Si el usuario simplemente cerró la ventana emergente
        if (modalErr?.code === -1 && String(modalErr?.message).toLowerCase().includes('close')) {
          setIsConnecting(false);
          return;
        }

        // Si falló el render del modal, intentar conexión directa con el módulo de Freighter
        console.warn('authModal no completado, intentando conexión directa con Freighter:', modalErr);
        const freighter = new FreighterModule();
        const res = await freighter.getAddress();
        if (res?.address) {
          pubKey = res.address;
          try {
            StellarWalletsKit.setWallet(freighter.productId);
          } catch {
            /* noop */
          }
        } else {
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
