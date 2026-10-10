// Pantalla Validador público (HU-01, HU-02, HU-05).
// Se reparte en dos componentes para trabajar en paralelo sin conflictos:
//   VerifyInput  -> Tefy    (captura: archivo/código, hash, consulta al ledger)
//   ResultCard   -> Nicolás (dictamen: vigente / revocado / adulterado + emisor)
import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import VerifyInput from '../components/verify/VerifyInput';
import ResultCard from '../components/verify/ResultCard';

export default function Verify() {
  const [outcome, setOutcome] = useState(null); // { result, file, hash, code } | null

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <PageHeader
        badge="⚡ Verificación criptográfica instantánea (< 60 s)"
        title="Comprueba la autenticidad de títulos"
        highlight="sin intermediarios"
        subtitle="Arrastra el certificado o escribe su código. La huella se calcula en tu navegador."
      />
      <VerifyInput onStart={() => setOutcome(null)} onResult={setOutcome} />
      {outcome && <ResultCard {...outcome} />}
    </div>
  );
}
