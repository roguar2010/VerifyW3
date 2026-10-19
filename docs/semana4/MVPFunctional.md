# Entregable 4: MVP Funcional · VerifyW3
**Curso:** Blockchain Builders 101 — Blockchain Acceleration Foundation (BAF)  
**Proyecto:** VerifyW3 — Verificación Criptográfica de Títulos y Certificados Académicos  
**Fecha de Entrega:** 17 de Octubre de 2026  
**Red:** Stellar Testnet (Soroban Smart Contracts)  
**URL del sitio web:** [https://verify-w3.vercel.app/](https://verify-w3.vercel.app/)  

---

## 1. Aprendizajes y ajustes priorizados

Durante la transición de las interfaces estáticas al MVP funcional conectado en tiempo real con contratos inteligentes en Stellar Soroban, consolidamos tres aprendizajes determinantes para la arquitectura del proyecto:

1. **Separación arquitectónica entre verificación y emisión (0-Gas Public Verification):** Confirmamos que más del 90% de los usuarios de VerifyW3 son reclutadores de talento y empresas evaluadoras que no disponen de billeteras cripto ni deben asumir fricción financiera. Al implementar la verificación mediante el método `simulateTransaction` en los nodos Soroban RPC, logramos consultas criptográficas instantáneas (< 2 segundos), completamente gratuitas y sin requerir instalación de extensiones ni saldos de XLM para validar la autenticidad de un título.
2. **Ciclo de vida transaccional asíncrono y los 5 estados de UI:** La interacción directa con la extensión Freighter y el consenso de la red Stellar demostró que un indicador de carga genérico genera incertidumbre en los emisores institucionales. Resultó imperativo implementar de forma explícita los 5 estados de interfaz recomendados en los estándares Web3: simulación previa en nodo, espera de firma en wallet, envío al ledger con sondeo reactivo, confirmación inmutable con enlace a Stellar Expert y mapeo humanizado de errores on-chain (`DUPLICATE_CREDENTIAL`, `UNAUTHORIZED_ISSUER`).
3. **Doble indexación en almacenamiento Soroban:** Detectamos que verificar exclusivamente por el hash SHA-256 de 32 bytes limitaba la usabilidad en diplomas impresos que cuentan con identificadores alfanuméricos cortos. Diseñamos en Rust un patrón de almacenamiento con doble clave (`DataKey::Credential(BytesN<32>)` y `DataKey::CodeIndex(String)`) utilizando punteros de referencia livianos, garantizando consultas en tiempo constante $O(1)$ sin duplicar estructuras de datos pesadas en el ledger ni elevar los costos de gas.

---

## 2. Riesgos y pendientes

A pesar del despliegue exitoso del contrato en Testnet y su integración integral con el cliente web, identificamos riesgos técnicos y operativos que han sido priorizados en el backlog antes de la fase de Mainnet:

1. **Gestión de State Archival y TTL en Soroban:** En el modelo de almacenamiento persistente de Soroban, cada entrada del ledger posee un tiempo de vida (*Time-To-Live* o TTL) que expira si no es extendido periódicamente. Aunque nuestro contrato implementa llamadas automáticas a `extend_ttl` durante la emisión y consulta, existe el riesgo de que certificaciones con muy baja frecuencia de validación queden archivadas tras meses de inactividad. Para mitigar esto, priorizamos el desarrollo de un servicio guardián (*keeper*) que audite y renueve automáticamente el TTL de todas las credenciales activas del directorio.
2. **Seguridad y rotación de llaves institucionales:** Actualmente, la identidad de cada entidad educativa está ligada a la firma ed25519 de su clave pública registrada en el contrato. Si una universidad pierde el acceso a su clave privada o sufre una vulnerabilidad interna, no existe un mecanismo descentralizado de recuperación o gobernanza para transferir su acreditación sin desplegar una actualización del contrato. La implementación de cuentas multifirma institucionales (*Multisig*) y contratos de delegación de firmas constituye el principal pendiente de seguridad para la Semana 5.
3. **Disponibilidad y persistencia de metadatos en IPFS:** Las credenciales almacenadas vinculan una URI de IPFS con atributos académicos complementarios. Aunque la huella matemática SHA-256 que garantiza la inmutabilidad reside permanentemente en el ledger de Soroban, la degradación de servicios de fijación descentralizados (*pinning services* como Filecoin o Pinata) podría comprometer la visualización de datos secundarios si el documento original no está disponible localmente.
4. **Resiliencia ante congestión de nodos RPC públicos:** En momentos de alta demanda en los endpoints públicos de Stellar Testnet, el sondeo transaccional (`getTransaction`) puede experimentar latencias elevadas. Es necesario integrar un grupo redundante de proveedores RPC (como Blockdaemon y NowNodes) con reintentos basados en retroceso exponencial (*exponential backoff*).

---

## 3. Plan de validación con usuarios

Siguiendo la metodología de validación (esquema de 7 partes y umbrales fijados antes de observar), estructuramos el plan para validar las dos hipótesis críticas del Problem Brief con 5 personas por perfil (regla de saturación del ~85% de problemas observados):

### Experimento 1: Validador Público (Reclutadores de Talento Humano)
1. **Hipótesis y criterio:** Creemos que los analistas de selección verificarán títulos de candidatos en la web sin requerir billeteras ni capacitación previa, porque hoy tardan semanas solicitando confirmación a universidades; lo sabremos si al menos 4 de 5 analistas completan la verificación en menos de 60 segundos dictaminando la autenticidad con éxito (Umbral fijo: 4 de 5).
2. **A quién:** 5 reclutadores de empresas de contratación de talento tech en Colombia contactados a través de la red profesional del equipo.
3. **Escenario (no instrucción):** *"Un candidato finalista adjunta su diploma universitario en PDF y necesitas comprobar con certeza si el documento es verídico o fue alterado antes de enviarle la oferta laboral"*.
4. **Qué se registra y cómo:** Sesión remota de 30 minutos (pantalla compartida con permiso previo) aplicando la técnica de *pensar en voz alta*. Una persona del equipo modera sin guiar (*"¿Qué esperabas que pasara?"*) y otra registra en matriz de 4 campos: *Qué hizo*, *Qué dijo*, *En qué paso* y *Qué significa* (separando observación de interpretación).
5. **Métricas:** ¿Completó el flujo? (Sí/No), ¿Dónde abandonó o dudó? (Carga, cálculo de hash, lectura del resultado semafórico) y tiempo transcurrido.
6. **Cuándo y quién:** Dos semanas posteriores al despliegue; moderado por el equipo fundador.
7. **Decisión según resultado:**
   - **$\ge$ 4 de 5 (Cierta):** Continuar con la arquitectura actual de consulta RPC sin gas.
   - **$\le$ 2 de 5 (Falsa):** Rediseñar la interfaz de consulta y simplificar la tarjeta de veredicto.
   - **3 de 5 (No concluyente):** Ajustar textos explicativos y repetir con 3 personas adicionales.

### Experimento 2: Portal Institucional (Emisores Universitarios)
1. **Hipótesis y criterio:** Creemos que los funcionarios de admisiones registrarán títulos en Stellar Testnet usando la billetera institucional, porque hoy el trámite manual por ventanilla es costoso y lento; lo sabremos si 4 de 5 funcionarios conectan la billetera, firman y emiten una credencial sin asistencia técnica externa (Umbral fijo: 4 de 5).
2. **A quién:** 5 funcionarios de secretaría académica de instituciones educativas aliadas.
3. **Escenario (no instrucción):** *"Acabas de expedir un diploma de grado y necesitas registrar su huella oficial en la red para que sea inalterable y consultable públicamente"*.
4. **Qué se registra y cómo:** Sesión individual con grabación autorizada analizando las fricciones en los 5 momentos clave: conectar billetera, cargar PDF, entender qué se firma en Freighter, esperar la confirmación de red y entender mensajes de error.
5. **Métricas:** Tasa de éxito de emisión (Sí/No), abandonos por paso y tiempo de confirmación percibido.
6. **Cuándo y quién:** Semana previa al demo day final; liderado por el equipo de desarrollo.
7. **Decisión según resultado:**
   - **$\ge$ 4 de 5 (Cierta):** Mantener el flujo actual de emisión y firma.
   - **$\le$ 2 de 5 (Falsa):** Implementar delegación de firmas o abstraer la interacción de la billetera.
   - **3 de 5 (No concluyente):** Ajustar los mensajes de espera en los 5 estados de UI y repetir la prueba.

---

## 4. Evidencias y enlaces públicos verificables

### A. Smart Contract en Stellar Testnet (Soroban)
- **ID del Contrato:** `CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL`
- **Explorador Público (Stellar Expert):**  
  [https://stellar.expert/explorer/testnet/contract/CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL](https://stellar.expert/explorer/testnet/contract/CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL)
- **Cuenta Administradora / Deployer:**  
  [`GCWIEQFTOTDCIKNTDZMWUNRXOJJ2BX7CH7DD3EAVSLZJ5LRLBO3V6MQ5`](https://stellar.expert/explorer/testnet/account/GCWIEQFTOTDCIKNTDZMWUNRXOJJ2BX7CH7DD3EAVSLZJ5LRLBO3V6MQ5)
- **Hash WASM Instalado:** `7776dc2079ff1e4cbde6bafacc46ba7ad516d25dcd3d89bbe3bae6b88dc8d68f` (7,426 bytes)

### B. Transacciones On-Chain Verificadas en el Ledger
1. **Subida de Bytecode WASM:**  
   [`d933e2940a87625f9f28a7f8a4ceb6a18dc6a6b85eb7b8c27249e0931120b758`](https://stellar.expert/explorer/testnet/tx/d933e2940a87625f9f28a7f8a4ceb6a18dc6a6b85eb7b8c27249e0931120b758)
2. **Despliegue e Instanciación del Contrato:**  
   [`4fc00441bb60cb24a105a535c7081529c6bbf85c63ec3d2988a62189192276e1`](https://stellar.expert/explorer/testnet/tx/4fc00441bb60cb24a105a535c7081529c6bbf85c63ec3d2988a62189192276e1)
3. **Inicialización Institucional (`initialize`):**  
   [`4c26cabc353ea8e2cad2c4b9daefa753ec4015e35d7212e6c233f9fcf4d2f615`](https://stellar.expert/explorer/testnet/tx/4c26cabc353ea8e2cad2c4b9daefa753ec4015e35d7212e6c233f9fcf4d2f615)
4. **Emisión de Credencial Oficial (`issue_credential` - Código: `VW3-TESTNET-001`):**  
   [`ea4ee60f565a2451d327d2d8e4aba9e04104dee2e3429c3086849478ec5c366a`](https://stellar.expert/explorer/testnet/tx/ea4ee60f565a2451d327d2d8e4aba9e04104dee2e3429c3086849478ec5c366a)
5. **Revocación de Credencial en Ledger (`revoke_credential`):**  
   [`b1c8689fe86d7d733bead19329d62b3af77f887708dd30e6aedf75f5efc2644c`](https://stellar.expert/explorer/testnet/tx/b1c8689fe86d7d733bead19329d62b3af77f887708dd30e6aedf75f5efc2644c)

### C. Patrones Soroban Implementados en el Smart Contract (`verifyw3`)
- **`Custom Types`:** Estructuras `CredentialRecord`, `CredentialStatus` (Active/Revoked), `DataKey` serializadas en XDR.
- **`Storage`:** Uso eficiente de almacenamiento persistente (`env.storage().persistent()`) con extensión dinámica de TTL (`extend_ttl`).
- **`Auth`:** Verificación criptográfica estricta con `issuer.require_auth()` en emisión y revocación.
- **`Errors`:** Enumeración `ContractError` con códigos tipados para `NotInitialized`, `AlreadyInitialized`, `UnauthorizedIssuer`, `CredentialNotFound`, `AlreadyRevoked` y `DuplicateCredential`.
- **`Events`:** Emisión canónica con `#[contractevent]` (`CredentialIssued`, `CredentialRevoked`, `ContractInitialized`).

### D. Pruebas Unitarias Automatizadas en Rust
Ejecución con `cargo test --manifest-path contracts/Cargo.toml`:
```text
running 5 tests
test test::test_initialize ... ok
test test::test_issue_and_verify_by_hash_and_code ... ok
test test::test_prevent_duplicate_hash_or_code ... ok
test test::test_record_not_found ... ok
test test::test_revocation_lifecycle ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s
```

### E. Integración Frontend y Estados de UI
- **URL del sitio web (Vercel):** [https://verify-w3.vercel.app/](https://verify-w3.vercel.app/)
- **Billetera y SDKs:** `@creit.tech/stellar-wallets-kit` v2.7.1 y `@stellar/stellar-sdk` v13.0.0.
- **5 Estados de Experiencia de Usuario implementados en la vista de emisión:**
  1. *Idle:* Formulario limpio con cálculo local de SHA-256.
  2. *Simulating:* Simulación previa del costo de gas y precondiciones en Soroban RPC.
  3. *Waiting for signature:* Solicitud interactiva en la extensión Freighter Wallet.
  4. *Submitting:* Transmisión al ledger con sondeo reactivo de confirmación.
  5. *Confirmed:* Despliegue de credencial con link directo a la transacción en Stellar Expert.
  6. *Error Mapping:* Traducción transparente de excepciones de red y códigos de error del contrato a mensajes legibles en español.

### F. Video Demostrativo del MVP Funcional
- **Enlace del Video:** `https://drive.google.com/drive/folders/1uOJ37d1OnnVb3iwqD1SlfYiIgJC9rmnh?usp=sharing`
- **Contenido del Video (Duración: 3 minutos):**
  1. *0:00 - 0:45:* Presentación del problema y arquitectura de VerifyW3 en Stellar Soroban.
  2. *0:45 - 1:30:* Conexión de Freighter Wallet y emisión de credencial on-chain con los 5 estados de UI.
  3. *1:30 - 2:15:* Verificación pública instantánea (0 gas, sin wallet) por archivo PDF y código alfanumérico.
  4. *2:15 - 3:00:* Flujo de revocación inmutable y verificación en el explorador Stellar Expert.

### G. Anexo Técnico: Benchmark de Smart Contracts en Stellar
- **Reporte Ejecutivo en PDF:** [`Benchmark_Stellar_Smart_Contracts.pdf`](./Benchmark_Stellar_Smart_Contracts.pdf)
- **Alcance del Análisis:** Evaluación comparativa de iniciativas premiadas en el Stellar Community Fund (SCF) y hackathons del ecosistema Stellar (Acta, Attest Protocol, Chaincerts, Stellaroid Earn), contrastando modelos de custodia, estándares W3C y justificando los 5 patrones canónicos de Soroban implementados en VerifyW3.

