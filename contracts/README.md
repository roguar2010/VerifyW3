# Workspace de Smart Contracts · VerifyW3 (Stellar Soroban)

Este directorio contiene el espacio de trabajo de contratos inteligentes desarrollados en **Rust** para el proyecto **VerifyW3**, desplegados sobre la red **Stellar Testnet** utilizando la plataforma **Soroban**.

---

## 📁 Estructura del Proyecto

```text
contracts/
├── Cargo.toml               # Configuración del workspace raíz de Cargo
├── README.md                # Visión general del workspace (este archivo)
├── AGENTS.md                # Instrucciones técnicas de compilación, testing y despliegue
└── contracts/
    └── verifyw3/            # Smart Contract principal de VerifyW3
        ├── Cargo.toml       # Dependencias específicas de verifyw3 (soroban-sdk)
        └── src/
            ├── lib.rs       # Lógica del contrato (5 patrones canónicos de Soroban)
            └── test.rs      # Batería de pruebas unitarias (5/5 tests aprobados)
```

---

## ⚙️ Características Técnicas del Contrato (`verifyw3`)

El contrato inteligente implementa la arquitectura de verificación documental inmutable aplicando los 5 patrones canónicos de Soroban:

1. **Tipos Personalizados (`Custom Types`):** Modelado de datos estructurados para registros de credenciales (`CredentialRecord`), estados (`CredentialStatus`: *Active* / *Revoked*) y claves tipadas de almacenamiento (`DataKey`).
2. **Almacenamiento Persistente (`Storage`):** Almacenamiento en ledger con doble indexación eficiente en tiempo constante $O(1)$ por huella criptográfica SHA-256 (`BytesN<32>`) y por código alfanumérico (`String`). Incluye extensión dinámica de tiempo de vida (`extend_ttl`).
3. **Autenticación Estricta (`Auth`):** Verificación criptográfica con `issuer.require_auth()` tanto en la emisión como en la revocación de certificados.
4. **Manejo Tipado de Errores (`Errors`):** Errores claros y predecibles (`ContractError::DuplicateCredential`, `ContractError::UnauthorizedIssuer`, `ContractError::AlreadyRevoked`).
5. **Eventos de Red (`Events`):** Publicación de eventos en el ledger mediante la macro `#[contractevent]` (`CredentialIssued`, `CredentialRevoked`, `ContractInitialized`).

---

## 🚀 Comandos Rápidos

### 1. Compilación a WebAssembly (WASM)
Compila el contrato generando el bytecode optimizado para la máquina virtual de Soroban:
```bash
stellar contract build --manifest-path Cargo.toml
```
*El binario resultante se genera en:* `contracts/target/wasm32v1-none/release/verifyw3.wasm`

### 2. Ejecución de Pruebas Unitarias
Ejecuta la suite de pruebas automatizadas en el entorno simulado de Soroban:
```bash
cargo test --manifest-path Cargo.toml
```

---

## 🌐 Despliegue en Stellar Testnet

* **ID del Contrato:** `CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL`
* **Explorador Público (Stellar Expert):**  
  [https://stellar.expert/explorer/testnet/contract/CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL](https://stellar.expert/explorer/testnet/contract/CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL)
* **Cuenta Administradora (Deployer):** `GCWIEQFTOTDCIKNTDZMWUNRXOJJ2BX7CH7DD3EAVSLZJ5LRLBO3V6MQ5`
