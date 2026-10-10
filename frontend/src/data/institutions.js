// Directorio base de instituciones acreditadas (HU-05). Datos de demostración.
// En la semana 4 esta lista saldrá del contrato (lista curada de emisores).
export const INSTITUTIONS = [
  {
    address: 'GDEMOUDEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    name: 'Universidad de Antioquia',
    country: 'Colombia',
    domain: 'udea.edu.co',
  },
  {
    address: 'GDEMOUNALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    name: 'Universidad Nacional de Colombia',
    country: 'Colombia',
    domain: 'unal.edu.co',
  },
  {
    address: 'GDEMOSENAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    name: 'SENA',
    country: 'Colombia',
    domain: 'sena.edu.co',
  },
];

// Cuenta que NO está en el directorio. Sirve para probar:
//  - HU-04 escenario 2 (un usuario ajeno intenta revocar -> rechazado)
//  - HU-05 escenario 2 (emisor no reconocido)
export const OUTSIDER_ACCOUNT = {
  address: 'GFAKEPATITOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  label: 'Instituto Patito (no acreditado)',
};

export const shortAddress = (a = '') => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
