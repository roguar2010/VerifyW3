import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDYUNDPXQ4NIR2K4AJQFL6MVJR7BAQ3R5REIZ5EGJ2TFPGCXF4JO4GTL",
  }
} as const

/**
 * Estado de una credencial en el ledger.
 */
export enum Status {
  Active = 1,
  Revoked = 2,
}

/**
 * Códigos de error del contrato, traducibles directamente por el frontend.
 */
export const ContractError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"RecordAlreadyExists"},
  3: {message:"CodeAlreadyExists"},
  4: {message:"RecordNotFound"},
  5: {message:"NotAuthorized"},
  6: {message:"AlreadyRevoked"}
}


/**
 * Registro inmutable on-chain de una credencial académica / certificado.
 * Enfoque de Privacidad por Diseño: solo contiene el hash criptográfico,
 * el URI a metadatos (IPFS) y firmas de emisión.
 */
export interface CredentialRecord {
  code: string;
  hash: Buffer;
  issued_at: u64;
  issuer: string;
  metadata_uri: string;
  status: Status;
}



export interface Client {
  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Obtiene la dirección del administrador del contrato.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Inicializa el contrato definiendo la cuenta administradora inicial.
   */
  initialize: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a verify_by_code transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verifica una credencial a partir de su código alfanumérico único (ej: "VW3-2026-9A7F").
   */
  verify_by_code: ({code}: {code: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<CredentialRecord>>>

  /**
   * Construct and simulate a get_total_issued transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna el número total de certificados emitidos en el contrato.
   */
  get_total_issued: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a issue_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Emite una nueva credencial en el ledger.
   * Requiere la firma criptográfica obligatoria de la institución emisora (`issuer.require_auth()`).
   */
  issue_credential: ({issuer, hash, code, metadata_uri}: {issuer: string, hash: Buffer, code: string, metadata_uri: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a revoke_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoca una credencial previamente emitida.
   * Requiere la firma del emisor original (`caller.require_auth()`).
   */
  revoke_credential: ({caller, hash}: {caller: string, hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a verify_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verifica una credencial académica a partir de su hash SHA-256 (32 bytes).
   * Consulta pública y gratuita (no requiere wallet ni firma mediante RPC simulation).
   */
  verify_credential: ({hash}: {hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<CredentialRecord>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAwAAACZFc3RhZG8gZGUgdW5hIGNyZWRlbmNpYWwgZW4gZWwgbGVkZ2VyLgAAAAAAAAAAAAZTdGF0dXMAAAAAAAIAAAAAAAAABkFjdGl2ZQAAAAAAAQAAAAAAAAAHUmV2b2tlZAAAAAAC",
        "AAAABAAAAElDw7NkaWdvcyBkZSBlcnJvciBkZWwgY29udHJhdG8sIHRyYWR1Y2libGVzIGRpcmVjdGFtZW50ZSBwb3IgZWwgZnJvbnRlbmQuAAAAAAAAAAAAAA1Db250cmFjdEVycm9yAAAAAAAABgAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAABNSZWNvcmRBbHJlYWR5RXhpc3RzAAAAAAIAAAAAAAAAEUNvZGVBbHJlYWR5RXhpc3RzAAAAAAAAAwAAAAAAAAAOUmVjb3JkTm90Rm91bmQAAAAAAAQAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAAFAAAAAAAAAA5BbHJlYWR5UmV2b2tlZAAAAAAABg==",
        "AAAAAQAAAMBSZWdpc3RybyBpbm11dGFibGUgb24tY2hhaW4gZGUgdW5hIGNyZWRlbmNpYWwgYWNhZMOpbWljYSAvIGNlcnRpZmljYWRvLgpFbmZvcXVlIGRlIFByaXZhY2lkYWQgcG9yIERpc2XDsW86IHNvbG8gY29udGllbmUgZWwgaGFzaCBjcmlwdG9ncsOhZmljbywKZWwgVVJJIGEgbWV0YWRhdG9zIChJUEZTKSB5IGZpcm1hcyBkZSBlbWlzacOzbi4AAAAAAAAAEENyZWRlbnRpYWxSZWNvcmQAAAAGAAAAAAAAAARjb2RlAAAAEAAAAAAAAAAEaGFzaAAAA+4AAAAgAAAAAAAAAAlpc3N1ZWRfYXQAAAAAAAAGAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAADG1ldGFkYXRhX3VyaQAAABAAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAZTdGF0dXMAAA==",
        "AAAABQAAAEFFdmVudG8gZW1pdGlkbyBhbCByZWdpc3RyYXIgdW5hIGNyZWRlbmNpYWwgb24tY2hhaW4gZW4gZWwgbGVkZ2VyLgAAAAAAAAAAAAAQQ3JlZGVudGlhbElzc3VlZAAAAAEAAAARY3JlZGVudGlhbF9pc3N1ZWQAAAAAAAAFAAAAAAAAAARoYXNoAAAD7gAAACAAAAAAAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAAAAAAAARjb2RlAAAAEAAAAAAAAAAAAAAADG1ldGFkYXRhX3VyaQAAABAAAAAAAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAGAAAAAAAAAAI=",
        "AAAABQAAADJFdmVudG8gZW1pdGlkbyBhbCByZXZvY2FyIHVuYSBjcmVkZW5jaWFsIG9uLWNoYWluLgAAAAAAAAAAABFDcmVkZW50aWFsUmV2b2tlZAAAAAAAAAEAAAASY3JlZGVudGlhbF9yZXZva2VkAAAAAAADAAAAAAAAAARoYXNoAAAD7gAAACAAAAAAAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAGAAAAAAAAAAI=",
        "AAAAAAAAADVPYnRpZW5lIGxhIGRpcmVjY2nDs24gZGVsIGFkbWluaXN0cmFkb3IgZGVsIGNvbnRyYXRvLgAAAAAAAAlnZXRfYWRtaW4AAAAAAAAAAAAAAQAAA+kAAAATAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAENJbmljaWFsaXphIGVsIGNvbnRyYXRvIGRlZmluaWVuZG8gbGEgY3VlbnRhIGFkbWluaXN0cmFkb3JhIGluaWNpYWwuAAAAAAppbml0aWFsaXplAAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAD6QAAAAIAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=",
        "AAAAAAAAAFpWZXJpZmljYSB1bmEgY3JlZGVuY2lhbCBhIHBhcnRpciBkZSBzdSBjw7NkaWdvIGFsZmFudW3DqXJpY28gw7puaWNvIChlajogIlZXMy0yMDI2LTlBN0YiKS4AAAAAAA52ZXJpZnlfYnlfY29kZQAAAAAAAQAAAAAAAAAEY29kZQAAABAAAAABAAAD6QAAB9AAAAAQQ3JlZGVudGlhbFJlY29yZAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAEFSZXRvcm5hIGVsIG7Dum1lcm8gdG90YWwgZGUgY2VydGlmaWNhZG9zIGVtaXRpZG9zIGVuIGVsIGNvbnRyYXRvLgAAAAAAABBnZXRfdG90YWxfaXNzdWVkAAAAAAAAAAEAAAAG",
        "AAAAAAAAAItFbWl0ZSB1bmEgbnVldmEgY3JlZGVuY2lhbCBlbiBlbCBsZWRnZXIuClJlcXVpZXJlIGxhIGZpcm1hIGNyaXB0b2dyw6FmaWNhIG9ibGlnYXRvcmlhIGRlIGxhIGluc3RpdHVjacOzbiBlbWlzb3JhIChgaXNzdWVyLnJlcXVpcmVfYXV0aCgpYCkuAAAAABBpc3N1ZV9jcmVkZW50aWFsAAAABAAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAARoYXNoAAAD7gAAACAAAAAAAAAABGNvZGUAAAAQAAAAAAAAAAxtZXRhZGF0YV91cmkAAAAQAAAAAQAAA+kAAAACAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAAAAAGtSZXZvY2EgdW5hIGNyZWRlbmNpYWwgcHJldmlhbWVudGUgZW1pdGlkYS4KUmVxdWllcmUgbGEgZmlybWEgZGVsIGVtaXNvciBvcmlnaW5hbCAoYGNhbGxlci5yZXF1aXJlX2F1dGgoKWApLgAAAAARcmV2b2tlX2NyZWRlbnRpYWwAAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABGhhc2gAAAPuAAAAIAAAAAEAAAPpAAAAAgAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAJ5WZXJpZmljYSB1bmEgY3JlZGVuY2lhbCBhY2Fkw6ltaWNhIGEgcGFydGlyIGRlIHN1IGhhc2ggU0hBLTI1NiAoMzIgYnl0ZXMpLgpDb25zdWx0YSBww7pibGljYSB5IGdyYXR1aXRhIChubyByZXF1aWVyZSB3YWxsZXQgbmkgZmlybWEgbWVkaWFudGUgUlBDIHNpbXVsYXRpb24pLgAAAAAAEXZlcmlmeV9jcmVkZW50aWFsAAAAAAAAAQAAAAAAAAAEaGFzaAAAA+4AAAAgAAAAAQAAA+kAAAfQAAAAEENyZWRlbnRpYWxSZWNvcmQAAAfQAAAADUNvbnRyYWN0RXJyb3IAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_admin: this.txFromJSON<Result<string>>,
        initialize: this.txFromJSON<Result<void>>,
        verify_by_code: this.txFromJSON<Result<CredentialRecord>>,
        get_total_issued: this.txFromJSON<u64>,
        issue_credential: this.txFromJSON<Result<void>>,
        revoke_credential: this.txFromJSON<Result<void>>,
        verify_credential: this.txFromJSON<Result<CredentialRecord>>
  }
}