#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    String,
};


/// Constantes para administración de ciclo de vida (TTL) en Stellar Soroban.
/// 1 ledger ≈ 5 segundos en Stellar. 1 día ≈ 17,280 ledgers.
const DAY_IN_LEDGERS: u32 = 17_280;
const BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS; // 30 días
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT - DAY_IN_LEDGERS;

/// Estado de una credencial en el ledger.
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Status {
    Active = 1,
    Revoked = 2,
}

/// Registro inmutable on-chain de una credencial académica / certificado.
/// Enfoque de Privacidad por Diseño: solo contiene el hash criptográfico,
/// el URI a metadatos (IPFS) y firmas de emisión.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialRecord {
    pub issuer: Address,
    pub hash: BytesN<32>,
    pub code: String,
    pub metadata_uri: String,
    pub issued_at: u64,
    pub status: Status,
}

/// Claves de almacenamiento para el contrato.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // Almacena CredentialRecord indexado por su SHA-256 (BytesN<32>)
    RecordByHash(BytesN<32>),
    // Índice secundario: mapea código único (ej: "VW3-2026-9A7F") al hash BytesN<32>
    HashByCode(String),
    // Dirección del administrador inicial
    Admin,
    // Contador total de credenciales emitidas
    Count,
}

/// Evento emitido al registrar una credencial on-chain en el ledger.
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialIssued {
    pub hash: BytesN<32>,
    pub issuer: Address,
    pub code: String,
    pub metadata_uri: String,
    pub timestamp: u64,
}

/// Evento emitido al revocar una credencial on-chain.
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CredentialRevoked {
    pub hash: BytesN<32>,
    pub issuer: Address,
    pub timestamp: u64,
}


/// Códigos de error del contrato, traducibles directamente por el frontend.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    RecordAlreadyExists = 2,
    CodeAlreadyExists = 3,
    RecordNotFound = 4,
    NotAuthorized = 5,
    AlreadyRevoked = 6,
}

#[contract]
pub struct VerifyW3Contract;

#[contractimpl]
impl VerifyW3Contract {
    /// Inicializa el contrato definiendo la cuenta administradora inicial.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Count, &0u64);
        env.storage().instance().extend_ttl(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(())
    }

    /// Obtiene la dirección del administrador del contrato.
    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ContractError::RecordNotFound)
    }

    /// Emite una nueva credencial en el ledger.
    /// Requiere la firma criptográfica obligatoria de la institución emisora (`issuer.require_auth()`).
    pub fn issue_credential(
        env: Env,
        issuer: Address,
        hash: BytesN<32>,
        code: String,
        metadata_uri: String,
    ) -> Result<(), ContractError> {
        issuer.require_auth();

        let record_key = DataKey::RecordByHash(hash.clone());
        let code_key = DataKey::HashByCode(code.clone());

        // Validar que el hash no haya sido registrado previamente
        if env.storage().persistent().has(&record_key) {
            return Err(ContractError::RecordAlreadyExists);
        }

        // Validar que el código único no haya sido utilizado
        if env.storage().persistent().has(&code_key) {
            return Err(ContractError::CodeAlreadyExists);
        }

        let record = CredentialRecord {
            issuer: issuer.clone(),
            hash: hash.clone(),
            code: code.clone(),
            metadata_uri: metadata_uri.clone(),
            issued_at: env.ledger().timestamp(),
            status: Status::Active,
        };

        // Guardar registro principal y su índice por código
        env.storage().persistent().set(&record_key, &record);
        env.storage().persistent().set(&code_key, &hash);

        // Extender TTL de las claves de almacenamiento
        env.storage()
            .persistent()
            .extend_ttl(&record_key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage()
            .persistent()
            .extend_ttl(&code_key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        // Incrementar contador global
        let current_count: u64 = env.storage().instance().get(&DataKey::Count).unwrap_or(0);
        env.storage().instance().set(&DataKey::Count, &(current_count + 1));
        env.storage().instance().extend_ttl(LIFETIME_THRESHOLD, BUMP_AMOUNT);

        // Publicar evento auditable en el ledger
        CredentialIssued {
            hash,
            issuer,
            code,
            metadata_uri,
            timestamp: record.issued_at,
        }
        .publish(&env);


        Ok(())
    }

    /// Verifica una credencial académica a partir de su hash SHA-256 (32 bytes).
    /// Consulta pública y gratuita (no requiere wallet ni firma mediante RPC simulation).
    pub fn verify_credential(env: Env, hash: BytesN<32>) -> Result<CredentialRecord, ContractError> {
        let record_key = DataKey::RecordByHash(hash);
        let record: CredentialRecord = env
            .storage()
            .persistent()
            .get(&record_key)
            .ok_or(ContractError::RecordNotFound)?;

        env.storage()
            .persistent()
            .extend_ttl(&record_key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(record)
    }

    /// Verifica una credencial a partir de su código alfanumérico único (ej: "VW3-2026-9A7F").
    pub fn verify_by_code(env: Env, code: String) -> Result<CredentialRecord, ContractError> {
        let code_key = DataKey::HashByCode(code);
        let hash: BytesN<32> = env
            .storage()
            .persistent()
            .get(&code_key)
            .ok_or(ContractError::RecordNotFound)?;

        let record_key = DataKey::RecordByHash(hash);
        let record: CredentialRecord = env
            .storage()
            .persistent()
            .get(&record_key)
            .ok_or(ContractError::RecordNotFound)?;

        env.storage()
            .persistent()
            .extend_ttl(&record_key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(record)
    }

    /// Revoca una credencial previamente emitida.
    /// Requiere la firma del emisor original (`caller.require_auth()`).
    pub fn revoke_credential(
        env: Env,
        caller: Address,
        hash: BytesN<32>,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let record_key = DataKey::RecordByHash(hash.clone());
        let mut record: CredentialRecord = env
            .storage()
            .persistent()
            .get(&record_key)
            .ok_or(ContractError::RecordNotFound)?;

        // Solo el emisor original puede revocar el certificado
        if record.issuer != caller {
            return Err(ContractError::NotAuthorized);
        }

        // Si ya está revocado, reportar el error específico
        if record.status == Status::Revoked {
            return Err(ContractError::AlreadyRevoked);
        }

        record.status = Status::Revoked;

        env.storage().persistent().set(&record_key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&record_key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        let timestamp = env.ledger().timestamp();

        // Publicar evento de revocación
        CredentialRevoked {
            hash,
            issuer: caller,
            timestamp,
        }
        .publish(&env);


        Ok(())
    }

    /// Retorna el número total de certificados emitidos en el contrato.
    pub fn get_total_issued(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Count).unwrap_or(0)
    }
}

mod test;
