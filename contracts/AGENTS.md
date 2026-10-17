# Instrucciones Técnicas · Smart Contracts VerifyW3 (Soroban)

Este documento detalla las directrices de compilación, ejecución de pruebas, despliegue e invocación de contratos Soroban en el workspace de **VerifyW3**.

---

## 🛠️ Requisitos de Entorno

1. **Rust:** Versión 1.84.0 o superior instalada.
2. **Target WASM:** `wasm32v1-none` instalado mediante:
   ```bash
   rustup target add wasm32v1-none
   ```
3. **Stellar CLI:** Versión oficial compatible con Soroban (`stellar --version`).

---

## 🏗️ Compilación

Desde el directorio `contracts/` o la raíz del proyecto:

```bash
stellar contract build --manifest-path Cargo.toml
```

> [!NOTE]  
> Utiliza siempre `stellar contract build` en lugar de `cargo build --target wasm32v1-none`. La CLI de Stellar inyecta automáticamente los metadatos de entorno y las secciones personalizadas que el runtime de Soroban requiere.

El binario compilado se ubica en:
`target/wasm32v1-none/release/verifyw3.wasm` (tamaño aproximado: ~7.4 KB).

---

## 🧪 Pruebas Unitarias

Las pruebas unitarias corren localmente utilizando el entorno de pruebas provisto por `soroban-sdk::Env`:

```bash
cargo test --manifest-path Cargo.toml
```

Para probar exclusivamente el paquete `verifyw3`:
```bash
cargo test -p verifyw3
```

La suite valida 5 escenarios críticos de negocio:
1. `test_initialize`: Inicialización correcta con la cuenta administradora.
2. `test_issue_and_verify_by_hash_and_code`: Emisión y posterior consulta tanto por hash SHA-256 como por código alfanumérico.
3. `test_prevent_duplicate_hash_or_code`: Rechazo de credenciales o códigos duplicados.
4. `test_record_not_found`: Retorno de error controlado al consultar credenciales inexistentes.
5. `test_revocation_lifecycle`: Ciclo de vida completo de revocación institucional y rechazo ante firmas no autorizadas.

---

## 🚀 Despliegue e Invocación en Stellar Testnet

### 1. Despliegue del Bytecode
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/verifyw3.wasm \
  --source-account <IDENTIDAD_O_ALIAS> \
  --network testnet
```

### 2. Inicialización
```bash
stellar contract invoke \
  --id CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL \
  --network testnet \
  --source-account <IDENTIDAD> \
  -- initialize --admin <DIRECCION_ADMIN>
```

### 3. Emisión de Credencial (`issue_credential`)
```bash
stellar contract invoke \
  --id CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL \
  --network testnet \
  --source-account <DIRECCION_EMISOR> \
  -- issue_credential \
  --issuer <DIRECCION_EMISOR> \
  --hash <HASH_HEX_32_BYTES> \
  --code "VW3-2026-1001" \
  --metadata_uri "ipfs://bafy..."
```

### 4. Verificación de Solo Lectura (0 Gas)
```bash
# Por código:
stellar contract invoke \
  --id CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL \
  --network testnet \
  -- verify_by_code --code "VW3-2026-1001"

# Por hash:
stellar contract invoke \
  --id CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL \
  --network testnet \
  -- verify_credential --hash <HASH_HEX_32_BYTES>
```

### 5. Revocación Institucional (`revoke_credential`)
```bash
stellar contract invoke \
  --id CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL \
  --network testnet \
  --source-account <DIRECCION_EMISOR> \
  -- revoke_credential \
  --issuer <DIRECCION_EMISOR> \
  --hash <HASH_HEX_32_BYTES>
```
