#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(VerifyW3Contract, ());
    let client = VerifyW3ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_total_issued(), 0);

    // Intento de reinicializar debe fallar
    let result = client.try_initialize(&admin);
    assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));
}

#[test]
fn test_issue_and_verify_by_hash_and_code() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(VerifyW3Contract, ());
    let client = VerifyW3ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let university = Address::generate(&env);
    let cert_hash = BytesN::from_array(&env, &[1u8; 32]);
    let code = String::from_str(&env, "VW3-2026-UDEA-001");
    let ipfs_uri = String::from_str(&env, "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");

    // 1. Emitir credencial
    client.issue_credential(&university, &cert_hash, &code, &ipfs_uri);
    assert_eq!(client.get_total_issued(), 1);

    // 2. Verificar por Hash
    let record = client.verify_credential(&cert_hash);
    assert_eq!(record.issuer, university);
    assert_eq!(record.hash, cert_hash);
    assert_eq!(record.code, code);
    assert_eq!(record.metadata_uri, ipfs_uri);
    assert_eq!(record.status, Status::Active);

    // 3. Verificar por Código alfanumérico
    let record_by_code = client.verify_by_code(&code);
    assert_eq!(record_by_code, record);
}

#[test]
fn test_prevent_duplicate_hash_or_code() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(VerifyW3Contract, ());
    let client = VerifyW3ContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let cert_hash = BytesN::from_array(&env, &[2u8; 32]);
    let code = String::from_str(&env, "VW3-2026-UNAL-002");
    let uri = String::from_str(&env, "ipfs://cid1");

    client.issue_credential(&issuer, &cert_hash, &code, &uri);

    // Intentar emitir con el mismo hash pero distinto código
    let diff_code = String::from_str(&env, "VW3-2026-UNAL-003");
    let err_hash = client.try_issue_credential(&issuer, &cert_hash, &diff_code, &uri);
    assert_eq!(err_hash, Err(Ok(ContractError::RecordAlreadyExists)));

    // Intentar emitir con distinto hash pero mismo código
    let diff_hash = BytesN::from_array(&env, &[3u8; 32]);
    let err_code = client.try_issue_credential(&issuer, &diff_hash, &code, &uri);
    assert_eq!(err_code, Err(Ok(ContractError::CodeAlreadyExists)));
}

#[test]
fn test_revocation_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(VerifyW3Contract, ());
    let client = VerifyW3ContractClient::new(&env, &contract_id);

    let issuer = Address::generate(&env);
    let cert_hash = BytesN::from_array(&env, &[4u8; 32]);
    let code = String::from_str(&env, "VW3-REVOKE-TEST");
    let uri = String::from_str(&env, "ipfs://cid-revoke");

    client.issue_credential(&issuer, &cert_hash, &code, &uri);

    // 1. Intento de revocación por un tercero no autorizado
    let hacker = Address::generate(&env);
    let err_unauth = client.try_revoke_credential(&hacker, &cert_hash);
    assert_eq!(err_unauth, Err(Ok(ContractError::NotAuthorized)));

    // 2. Revocación legítima por el emisor
    client.revoke_credential(&issuer, &cert_hash);

    let record = client.verify_credential(&cert_hash);
    assert_eq!(record.status, Status::Revoked);

    // 3. Intento de revocar una credencial ya revocada
    let err_already = client.try_revoke_credential(&issuer, &cert_hash);
    assert_eq!(err_already, Err(Ok(ContractError::AlreadyRevoked)));
}

#[test]
fn test_record_not_found() {
    let env = Env::default();
    let contract_id = env.register(VerifyW3Contract, ());
    let client = VerifyW3ContractClient::new(&env, &contract_id);

    let non_existent_hash = BytesN::from_array(&env, &[99u8; 32]);
    let err = client.try_verify_credential(&non_existent_hash);
    assert_eq!(err, Err(Ok(ContractError::RecordNotFound)));

    let non_existent_code = String::from_str(&env, "INVALID-CODE");
    let err_code = client.try_verify_by_code(&non_existent_code);
    assert_eq!(err_code, Err(Ok(ContractError::RecordNotFound)));
}
