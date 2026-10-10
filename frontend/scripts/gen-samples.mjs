// Genera PDFs de ejemplo en public/samples y src/data/seed.json con sus hashes SHA-256.
// Uso: npm run samples   (solo hace falta si cambian los ejemplos)
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'samples');
mkdirSync(outDir, { recursive: true });

function makePdf(lines) {
  const esc = (s) => s.replace(/[\()]/g, '\$&');
  const text = lines
    .map((l, i) => `BT /F1 ${i === 0 ? 20 : 13} Tf 60 ${760 - i * 30} Td (${esc(l)}) Tj ET`)
    .join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, '0')} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const samples = [
  { file: 'diploma_valido.pdf', lines: ['DIPLOMA DE EJEMPLO', 'Se certifica que Persona Ejemplo Uno', 'aprobo el programa Ingenieria de Sistemas', 'Nota final: 4.5 / 5.0', 'Fecha de grado: 24 de septiembre de 2026'] },
  { file: 'diploma_adulterado.pdf', lines: ['DIPLOMA DE EJEMPLO', 'Se certifica que Persona Ejemplo Uno', 'aprobo el programa Ingenieria de Sistemas', 'Nota final: 5.0 / 5.0', 'Fecha de grado: 24 de septiembre de 2026'] },
  { file: 'diploma_revocado.pdf', lines: ['CERTIFICADO DE EJEMPLO', 'Se certifica que Persona Ejemplo Dos', 'aprobo el curso Analitica de Datos', 'Fecha: 10 de agosto de 2026'] },
  { file: 'diploma_emisor_desconocido.pdf', lines: ['CERTIFICADO DE EJEMPLO', 'Instituto Patito (no acreditado)', 'Se certifica que Persona Ejemplo Tres', 'aprobo el curso Blockchain Avanzado'] },
];

const hashes = {};
for (const s of samples) {
  const buf = makePdf(s.lines);
  writeFileSync(join(outDir, s.file), buf);
  hashes[s.file] = createHash('sha256').update(buf).digest('hex');
}

const seed = {
  generatedBy: 'scripts/gen-samples.mjs',
  credentials: [
    { hash: hashes['diploma_valido.pdf'], code: 'VW3-2026-0001', issuer: 'GDEMOUDEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', issuedAt: '2026-09-24T15:00:00Z', status: 'ACTIVE', revokedAt: null },
    { hash: hashes['diploma_revocado.pdf'], code: 'VW3-2026-0002', issuer: 'GDEMOUNALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', issuedAt: '2026-08-10T15:00:00Z', status: 'REVOKED', revokedAt: '2026-10-02T14:30:00Z' },
    { hash: hashes['diploma_emisor_desconocido.pdf'], code: 'VW3-2026-0003', issuer: 'GFAKEPATITOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', issuedAt: '2026-09-01T15:00:00Z', status: 'ACTIVE', revokedAt: null },
  ],
};
mkdirSync(join(root, 'src', 'data'), { recursive: true });
writeFileSync(join(root, 'src', 'data', 'seed.json'), JSON.stringify(seed, null, 2) + '\n');
console.log('Ejemplos generados:', hashes);
