// =============================================================================
// ENTRADA DEL VALIDADOR          RESPONSABLE: Tefy (Estefany)      HU-01 (+ código del Blueprint)
// El resultado (ResultCard) lo hace Nicolás: aquí SOLO captura la entrada y llama al ledger.
//
// Contrato con Verify.jsx (no cambiarlo sin avisar):
//   props.onStart()                       -> llamar al empezar (limpia el resultado anterior)
//   props.onResult({ result, file, hash, code })
//        result = lo que devuelve verifyByHash / verifyByCode (src/services/ledger.js)
//        file   = { name, size: formatFileSize(file.size) } | null
//        hash   = string | null   (SHA-256 calculado)
//        code   = string | null
//
// TODO:
//  [ ] Dropzone: drag & drop + click, solo PDF. hash = await sha256File(file)  (src/lib/hash.js)
//  [ ] Campo alterno: buscar por código de credencial -> verifyByCode(code)
//  [ ] Estados de carga ("Calculando hash…", "Consultando la red…") y manejo de errores
//  [ ] Aviso visible de privacidad: "el archivo nunca sale de tu navegador" (HU-01 esc.3)
//  [ ] Botones de prueba rápida: fetch('/samples/diploma_valido.pdf') -> blob -> new File(...)
//        y pasarlo por el MISMO flujo real. Ejemplos: diploma_valido, diploma_adulterado,
//        diploma_revocado, diploma_emisor_desconocido (.pdf)
//  [ ] Accesibilidad básica (label del input, foco) y responsive móvil
// =============================================================================
export default function VerifyInput() {
  return (
    <div className="max-w-2xl mx-auto p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
      🚧 Pendiente — ver TODO al inicio de <code>src/components/verify/VerifyInput.jsx</code>
    </div>
  );
}
