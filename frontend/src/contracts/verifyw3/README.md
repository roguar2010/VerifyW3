# VerifyW3 · Cliente TypeScript / JavaScript para Soroban

Librería cliente generada automáticamente para interactuar desde aplicaciones web con el Smart Contract **`verifyw3`** desplegado en **Stellar Testnet** mediante el protocolo **Soroban RPC**.

---

## 📌 Configuración de Red y Despliegue

* **Red:** Stellar Testnet (`Test SDF Network ; September 2015`)
* **RPC Endpoint:** `https://soroban-testnet.stellar.org`
* **ID del Contrato:** `CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL`
* **Explorador Público:** [Ver en Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL)

Esta librería fue generada con la herramienta oficial de bindings de Soroban:

```bash
stellar contract bindings typescript \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --contract-id CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL \
  --output-dir ./frontend/src/contracts/verifyw3
```

---

## 💡 Métodos Exportados

El cliente expone funciones fuertemente tipadas correspondientes a la interfaz del Smart Contract:

| Método | Tipo | Descripción |
| :--- | :--- | :--- |
| `initialize({ admin })` | Transacción | Inicializa el contrato con la cuenta administradora. |
| `issue_credential({ issuer, hash, code, metadata_uri })` | Transacción | Registra una nueva credencial en el ledger (requiere firma del emisor). |
| `verify_credential({ hash })` | Consulta (0 Gas) | Devuelve el registro de la credencial asociada al hash SHA-256. |
| `verify_by_code({ code })` | Consulta (0 Gas) | Consulta la credencial asociada a su código alfanumérico único. |
| `revoke_credential({ issuer, hash })` | Transacción | Marca una credencial como revocada (solo el emisor original puede firmar). |

---

## 💻 Ejemplo de Uso en React / JavaScript

```javascript
import { Contract, networks } from './contracts/verifyw3';

// 1. Instanciar el cliente del contrato
const verifyContract = new Contract({
  ...networks.testnet,
  rpcUrl: 'https://soroban-testnet.stellar.org',
});

// 2. Consulta de solo lectura (gratuita, sin wallet requerida)
export async function consultarPorCodigo(codigo) {
  try {
    const { result } = await verifyContract.verify_by_code({ code: codigo });
    console.log('Credencial encontrada:', result);
    return result;
  } catch (error) {
    console.error('Credencial no encontrada o error de red:', error);
    return null;
  }
}
```

---

## 🛡️ Manejo de Tipos y Seguridad

* **Serialización XDR:** El cliente convierte automáticamente los tipos de JavaScript a estructuras nativas XDR de Soroban y viceversa.
* **Firmas Criptográficas:** Las operaciones de escritura (`issue_credential`, `revoke_credential`) devuelven transacciones preparadas para ser autorizadas mediante **Freighter Wallet** a través de `@creit.tech/stellar-wallets-kit`.
