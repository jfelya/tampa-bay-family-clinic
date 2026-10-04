import { readFileSync } from 'node:fs';
import YAML from 'yaml';

const files = [
  'en/immigration-medical-exam-tampa',
  'es/examen-medico-de-inmigracion',
  'en/physical-exam-dot',
  'es/examen-fisico-dot',
  'en/medical-marijuana-doctors',
  'es/medicos-de-marihuana-medicinal',
  'en/laboratory-testing',
  'es/pruebas-de-laboratorio',
  'en/covid-19-testing',
  'es/pruebas-de-covid-19',
  'en/our-services',
  'es/nuestros-servicios',
  'en/insurances-accepted',
  'es/seguros-aceptados',
  'en/privacy-policy',
  'es/politica-de-privacidad',
];

for (const f of files) {
  const raw = readFileSync(`src/content/pages/${f}.md`, 'utf8');
  const fm = YAML.parse(raw.replace(/^---\n/, '').replace(/\n---\n$/, ''));
  console.log(`===== ${f} | ${fm.title}`);
  console.log(`  desc: ${(fm.description || '').slice(0, 90)}`);
  fm.sections.forEach((s, i) => {
    let extra = '';
    if (s.type === 'contentSection') extra = ` | body:${(s.body || '').length}ch${s.images ? ' imgs:' + s.images.length : ''}${s.id ? ' id:' + s.id : ''}`;
    if (s.type === 'featureList') extra = ` | items:${s.items.map((x) => x.title).join(', ').slice(0, 90)}`;
    if (s.type === 'faq') extra = ` | q:${s.items.length}`;
    if (s.type === 'cta') extra = ` | action:${s.actions[0] && s.actions[0].label}`;
    if (s.type === 'form') extra = ` | source:${s.source}`;
    if (s.type === 'richText') extra = ` | body:${(s.body || '').length}ch`;
    if (s.type === 'serviceGrid') extra = ` | items:${s.items ? s.items.length : 0}`;
    if (s.type === 'stats') extra = ` | stats:${s.items.length}`;
    if (s.type === 'anchorNav') extra = ` | anchors:${s.items.length}`;
    console.log(`   ${i}. ${s.type}${s.heading ? ' "' + s.heading.slice(0, 75) + '"' : ''}${extra}`);
  });
}
