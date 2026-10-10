// =============================================================================
// PANTALLA: Portal del emisor        RESPONSABLE: Ronald
// HU-03 (registro/emisión), HU-04 (revocación)
//
// TODO:
//  [ ] Conexión de billetera simulada con useWallet() (src/context/WalletContext.jsx):
//        selector con las instituciones de INSTITUTIONS + OUTSIDER_ACCOUNT (src/data/institutions.js).
//        Sin billetera conectada, el formulario no se muestra.
//  [ ] Formulario de emisión (HU-03): código de credencial (sugerir uno tipo VW3-2026-XXXX)
//        + adjuntar PDF -> sha256File() -> mostrar el hash. NO pedir ni guardar nombre del egresado
//        (la privacidad exige que solo viaje el hash).
//  [ ] Botón "Firmar y publicar" -> registerCredential({hash, code, issuer: address}).
//        Éxito: recibo con tx, ledger, estado "Vigente" y tiempo (< 5 s).             [HU-03 esc.1]
//        LedgerError 'DUPLICATE': mensaje "el documento ya existe".                   [HU-03 esc.2]
//  [ ] Listado "Mis credenciales" -> listCredentialsByIssuer(address), con estado y fechas.
//  [ ] Botón "Revocar" por fila (con confirmación) -> revokeCredential({hash, caller: address}).
//        Éxito: la fila pasa a "Revocada" y se conserva la fecha de emisión.          [HU-04 esc.1]
//  [ ] Para probar HU-04 esc.2: conectar como OUTSIDER_ACCOUNT y revocar una credencial ajena
//        (campo "revocar por hash/código") -> mostrar error NOT_ISSUER.               [HU-04 esc.2]
//  [ ] Mostrar mensajes de LedgerError (err.code / err.message) en la UI.
// =============================================================================
import PageHeader from '../components/ui/PageHeader';

export default function Issue() {
  return (
    <div className="space-y-10">
      <PageHeader
        badge="🏛️ Portal institucional"
        title="Panel de emisión y revocación"
        subtitle="Registra la huella de cada certificado con tu firma institucional."
      />
      <div className="max-w-2xl mx-auto p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
        🚧 Pantalla pendiente — ver TODO al inicio de <code>src/pages/Issue.jsx</code>
      </div>
    </div>
  );
}
