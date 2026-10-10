// Billetera SIMULADA (en la semana 4 se cambia por Freighter / Stellar Wallets Kit).
// Expone: { address, institution, connect(address), disconnect() }
//   institution = null cuando la cuenta no está en el directorio de acreditadas.
import { createContext, useContext, useState } from 'react';
import { getInstitution } from '../services/ledger';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(() => {
    try {
      return localStorage.getItem('verifyw3-wallet') || null;
    } catch {
      return null;
    }
  });

  const connect = (addr) => {
    setAddress(addr);
    try {
      localStorage.setItem('verifyw3-wallet', addr);
    } catch {
      /* noop */
    }
  };
  const disconnect = () => {
    setAddress(null);
    try {
      localStorage.removeItem('verifyw3-wallet');
    } catch {
      /* noop */
    }
  };

  return (
    <WalletContext.Provider value={{ address, institution: address ? getInstitution(address) : null, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
