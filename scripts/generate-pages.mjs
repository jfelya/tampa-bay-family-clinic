/**
 * Page generator — remaining 16 pages (8 EN/ES pairs).
 *
 * Reads the extracted outlines in `scripts/extracted/` and emits near-final
 * content entries into `src/content/pages/`. Copy is preserved verbatim; the
 * generator only restructures into section blocks. Run `npm run generate`
 * after refreshing the extraction. One-off tooling, not part of the build.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const load = (file) => JSON.parse(readFileSync(join(__dirname, 'extracted', `${file}.json`), 'utf8'));
const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const asset = (src) => 'legacy/' + src.split('/').pop();
const sentenceCase = (s) => {
  const lower = s.toLocaleLowerCase('es');
  return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
};
const normalizeHeading = (s) => clean(s).toLowerCase().replace(/[.,:;!?¡¿"'’]/g, '');

const UI = {
  en: { requestAppointment: 'Request an Appointment' },
  es: { requestAppointment: 'Solicitar una cita' },
};

const FORM = {
  en: {
    heading: 'Request An Appointment',
    body: 'Request a visit to Tampa Bay Family Clinic simply fill out the form below and we will contact you back regarding the service you require',
    aside: { heading: 'Get In Touch With Us', callLabel: 'Call us anytime', emailLabel: 'Email us' },
  },
  es: {
    heading: 'Solicitar una cita',
    body: 'Solicite una visita a Tampa Bay Family Clinic, simplemente complete el formulario a continuación y nos pondremos en contacto con usted con respecto al servicio que necesita.',
    aside: {
      heading: 'Contáctate con nosotros',
      callLabel: 'Llámenos en cualquier momento',
      emailLabel: 'Escríbenos',
    },
  },
};

/** Typo fixes approved by the client (see DEVELOPMENT-NOTES.md). */
const TYPO_FIXES = [
  [/SpirometryTest/g, 'Spirometry Test'],
  [/\bDot\b/g, 'DOT'],
];
const TYPO_FIXES_ES = [
  [/Socilitar/gi, 'Solicitar'],
  [/Teléfonico/gi, 'Telefónico'],
  [/Aplica para La /g, 'Aplica para la '],
  [/\bMedico\b/g, 'Médico'],
  [/\bmedico\b/g, 'médico'],
];
const fixTypos = (text, lang) => {
  let out = text;
  for (const [re, replacement] of TYPO_FIXES) out = out.replace(re, replacement);
  if (lang === 'es') {
    for (const [re, replacement] of TYPO_FIXES_ES) out = out.replace(re, replacement);
  }
  return out;
};

const TAIL_RE =
  /^(Request An? Appointment|Solicitar una cita|Socilitar una cita|Tampa Bay Family Clinic Services|Servicios - Tampa Bay Family Clinic|Your Family|Tu Centro de|Get In Touch With Us|Contáctate con nosotros|Phone Number|Número Telefónico|Copyright \d{4})$/i;

function cutTail(outline) {
  const i = outline.findIndex((n) => n.kind === 'heading' && TAIL_RE.test(clean(n.text)));
  return i > -1 ? outline.slice(0, i) : outline;
}

/** Merge only the exact split-heading pairs configured per page. */
function mergePairs(nodes, pairs = []) {
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.kind === 'heading') {
      const text = clean(n.text);
      const pair = pairs.find((p) => p.first === text);
      const next = nodes[i + 1];
      if (pair && next && next.kind === 'heading' && clean(next.text) === pair.second) {
        out.push({ ...n, text: pair.as ?? `${text} ${clean(next.text)}` });
        i++;
        continue;
      }
    }
    out.push(n);
  }
  return out;
}

function buildSections(nodes) {
  const sections = [];
  let current = null;

  const push = (block) => {
    if (!current) return;
    const last = current._blocks[current._blocks.length - 1];
    if (block.kind === 'li') {
      if (last && last.kind === 'ul') last.items.push(block.text);
      else current._blocks.push({ kind: 'ul', items: [block.text] });
    } else {
      current._blocks.push(block);
    }
  };

  for (const node of nodes) {
    if (node.kind === 'heading') {
      const text = clean(node.text);
      if (node.level >= 3 && current) {
        push({ kind: 'h', level: node.level, text });
        continue;
      }
      const prev = sections[sections.length - 1];
      if (prev && normalizeHeading(prev.heading) === normalizeHeading(text)) {
        current = prev;
        continue;
      }
      current = { type: 'contentSection', heading: text, _blocks: [], images: [], _links: [] };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    switch (node.kind) {
      case 'image':
        current.images.push({ src: asset(node.src), alt: '' });
        break;
      case 'listItem':
        push({ kind: 'li', text: clean(node.text) });
        break;
      case 'link':
        if (clean(node.text)) current._links.push({ text: clean(node.text), href: node.href });
        break;
      case 'text':
      case 'paragraph':
        push({ kind: 'p', text: clean(node.text) });
        break;
      case 'quote':
        push({ kind: 'q', text: clean(node.text) });
        break;
    }
  }
  return sections;
}

function renderBody(section, { includeLinks = true } = {}) {
  const parts = [];
  for (const b of section._blocks) {
    if (b.kind === 'p') parts.push(b.text);
    else if (b.kind === 'ul') parts.push(b.items.map((i) => `- ${i}`).join('\n'));
    else if (b.kind === 'h') parts.push(`${'#'.repeat(Math.min(b.level + 1, 6))} ${b.text}`);
    else if (b.kind === 'q') parts.push(`> ${b.text}`);
  }
  if (includeLinks) {
    for (const l of section._links) {
      if (!l.href || l.href.startsWith('#')) continue;
      parts.push(`[${l.text}](${l.href})`);
    }
  }
  return parts.join('\n\n');
}

function actionFromLink(section, lang) {
  const links = (section._links || []).filter((l) => l.text);
  const last = links[links.length - 1];
  if (!last) {
    return { label: UI[lang].requestAppointment, href: '#appointment', variant: 'accent', icon: 'calendar' };
  }
  let label = last.text;
  if (lang === 'es' && /^request an? appointment$/i.test(label)) label = UI.es.requestAppointment;
  else if (label === label.toUpperCase()) label = sentenceCase(label);
  return { label, href: '#appointment', variant: 'accent', icon: 'calendar' };
}

function toContentSections(sections, lang, { startToneIndex = 0 } = {}) {
  return sections.map((s, index) => ({
    type: 'contentSection',
    ...(s.id ? { id: s.id } : {}),
    heading: fixTypos(s.heading, lang),
    body: fixTypos(renderBody(s), lang),
    ...(s.images.length ? { images: s.images } : {}),
    tone: (index + startToneIndex) % 2 === 1 ? 'subtle' : 'default',
  }));
}

function buildHero(lang, heading, eyebrow) {
  return {
    type: 'hero',
    variant: 'page',
    ...(eyebrow ? { eyebrow } : {}),
    heading,
    actions: [
      { label: UI[lang].requestAppointment, href: '#appointment', variant: 'primary', icon: 'calendar' },
    ],
  };
}

function buildForm(lang, key) {
  const f = FORM[lang];
  return {
    type: 'form',
    variant: 'appointment',
    heading: f.heading,
    body: f.body,
    source: `${key}-appointment`,
    aside: f.aside,
    tone: 'subtle',
  };
}

function buildCta(section, lang) {
  const body = renderBody(section, { includeLinks: false });
  return {
    type: 'cta',
    heading: fixTypos(section.heading, lang),
    ...(body ? { body: fixTypos(body, lang) } : {}),
    actions: [actionFromLink(section, lang)],
  };
}

function splitHero(nodes) {
  const h1i = nodes.findIndex((n) => n.kind === 'heading' && n.level === 1);
  const heroHeading = clean(nodes[h1i].text);
  const eyebrowNode = nodes.slice(0, h1i).find((n) => n.kind === 'heading' && n.level === 2);
  const afterHero = nodes.slice(h1i + 1);
  const firstHeading = afterHero.findIndex((n) => n.kind === 'heading');
  return {
    heroHeading,
    eyebrow: eyebrowNode ? clean(eyebrowNode.text) : undefined,
    introNodes: firstHeading === -1 ? afterHero : afterHero.slice(0, firstHeading),
    rest: firstHeading === -1 ? [] : afterHero.slice(firstHeading),
  };
}

const introBodyOf = (introNodes) =>
  introNodes
    .filter((n) => n.kind === 'text' || n.kind === 'paragraph')
    .map((n) => clean(n.text))
    .join('\n\n');

function writePage(relative, page) {
  const yaml = YAML.stringify(page, { lineWidth: 0 });
  writeFileSync(join(ROOT, 'src', 'content', relative), `---\n${yaml}---\n`, 'utf8');
  console.log(`wrote ${relative}`);
}

const pathName = (slug, lang) => (lang === 'es' ? slug.replace(/^es\//, '') : slug);

/* ------------------------------------------------------------------ */
/* Service pages                                                       */
/* ------------------------------------------------------------------ */

function buildServicePage({ key, lang, file, slug, description, mergePairs: pairs = [], dropListItems = [] }) {
  const j = load(file);
  let nodes = mergePairs(cutTail(j.outline), pairs);
  nodes = nodes.map((n) => (n.text ? { ...n, text: clean(n.text) } : n));

  const { heroHeading, eyebrow, introNodes, rest } = splitHero(nodes);
  const sections = buildSections(rest);
  const last = sections.pop();
  const contentSections = toContentSections(sections, lang);

  if (dropListItems.length) {
    for (const section of contentSections) {
      for (const item of dropListItems) {
        section.body = section.body
          .replace(new RegExp(`^(- )?${item}$\\n?`, 'gm'), '')
          .replace(/\n{3,}/g, '\n\n');
      }
    }
  }

  const introBody = introBodyOf(introNodes);

  writePage(`pages/${lang === 'en' ? 'en' : 'es'}/${pathName(slug, lang)}.md`, {
    title: j.title,
    description: description ?? j.description,
    lang,
    translationKey: key,
    archetype: 'service',
    slug,
    seo: { title: j.title, canonical: `https://www.tampabayfamilyclinics.com/${slug}/` },
    sections: [
      buildHero(lang, heroHeading, eyebrow),
      ...(introBody
        ? [{ type: 'richText', container: 'default', body: fixTypos(introBody, lang), tone: 'default' }]
        : []),
      ...contentSections,
      buildCta(last, lang),
      buildForm(lang, key),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Feature extraction (MMJ)                                            */
/* ------------------------------------------------------------------ */

function extractFeatureByTitles(nodes, sectionHeading, titles) {
  const i = nodes.findIndex((n) => n.kind === 'heading' && clean(n.text) === sectionHeading);
  if (i === -1) return null;

  let intro = null;
  let j = i + 1;
  if (nodes[j] && (nodes[j].kind === 'paragraph' || nodes[j].kind === 'text')) {
    intro = clean(nodes[j].text);
    j++;
  }

  const items = [];
  let end = i + 1;
  for (const title of titles) {
    const k = nodes.findIndex((n, idx) => idx >= i && n.kind === 'heading' && clean(n.text) === title);
    if (k === -1) continue;
    const item = { title, description: '', image: undefined };
    let m = k + 1;
    while (m < nodes.length && nodes[m].kind !== 'heading') {
      if (nodes[m].kind === 'text' || nodes[m].kind === 'paragraph') {
        item.description += (item.description ? ' ' : '') + clean(nodes[m].text);
      } else if (nodes[m].kind === 'image' && !item.image) {
        item.image = asset(nodes[m].src);
      }
      m++;
    }
    items.push(item);
    end = Math.max(end, m);
  }
  return { items, intro, from: i, to: end };
}

function extractFaq(nodes, faqHeading, endHeading) {
  const i = nodes.findIndex((n) => n.kind === 'heading' && clean(n.text) === faqHeading);
  const end = nodes.findIndex((n, idx) => idx > i && n.kind === 'heading' && clean(n.text) === endHeading);
  if (i === -1 || end === -1) return null;
  const items = [];
  let j = i + 1;
  while (j < end) {
    if (nodes[j].kind === 'heading') {
      const question = clean(nodes[j].text);
      let answer = '';
      let k = j + 1;
      while (k < end && nodes[k].kind !== 'heading') {
        if (nodes[k].kind === 'text' || nodes[k].kind === 'paragraph') {
          answer += (answer ? '\n\n' : '') + clean(nodes[k].text);
        }
        k++;
      }
      items.push({ question, answer });
      j = k;
      continue;
    }
    j++;
  }
  return { items, from: i, to: end };
}

const removeRange = (nodes, from, to) => [...nodes.slice(0, from), ...nodes.slice(to)];

const MMJ = {
  en: {
    conditionsHeading: 'Qualifying conditions for MMJ use',
    conditions: [
      'PTSD',
      'Epilepsy/Seizures Disorders',
      "Parkinson's Disease",
      'Multiple Sclerosis',
      "Crohn's Disease",
      'Glaucoma',
      'Chronic muscle spasms',
      'HIV/AIDS',
      'Amyotrophic Lateral Sclerosis (ALS)',
      'Cancer',
      'Chronic pain',
    ],
    evalHeading: 'Evaluate',
    eval: ['Evaluate', 'Educate', 'Medicate'],
    faqHeading: 'Frequently Asked Questions',
    closing: 'We Make Getting Your Tampa, Florida Medical Marijuana Card Easy & Accessible!',
  },
  es: {
    conditionsHeading: 'Condiciones de calificación para el uso de MMJ',
    conditions: [
      'TEPT',
      'Epilepsia/trastornos convulsivos',
      'Enfermedad de Parkinson',
      'Esclerosis múltiple',
      'Enfermedad de Crohn',
      'Glaucoma',
      'Espasmos musculares crónicos',
      'VIH/SIDA',
      'Esclerosis lateral amiotrófica (ELA)',
      'Cáncer',
      'Dolor crónico',
    ],
    evalHeading: 'Evaluarse',
    eval: ['Evaluarse', 'Educarse', 'Medicarse'],
    faqHeading: 'Preguntas frecuentes',
    closing: '¡Hacemos que obtener su tarjeta de marihuana medicinal de Tampa, Florida sea fácil y accesible!',
  },
};

function buildMmjPage({ key, lang, file, slug, mergePairs: pairs = [] }) {
  const j = load(file);
  let nodes = mergePairs(cutTail(j.outline), pairs);
  nodes = nodes.map((n) => (n.text ? { ...n, text: clean(n.text) } : n));

  const cfg = MMJ[lang];

  const faq = extractFaq(nodes, cfg.faqHeading, cfg.closing);
  if (faq) nodes = removeRange(nodes, faq.from, faq.to);

  const conditions = extractFeatureByTitles(nodes, cfg.conditionsHeading, cfg.conditions);
  if (conditions) nodes = removeRange(nodes, conditions.from, conditions.to);

  const evalGroup = extractFeatureByTitles(nodes, cfg.evalHeading, cfg.eval);
  if (evalGroup) nodes = removeRange(nodes, evalGroup.from, evalGroup.to);

  const { heroHeading, eyebrow, introNodes, rest } = splitHero(nodes);
  const sections = buildSections(rest);
  const last = sections.pop();
  const contentSections = toContentSections(sections, lang);
  const introBody = introBodyOf(introNodes);

  const featureBlock = (group, tone) => ({
    type: 'featureList',
    columns: group.items.length <= 2 ? 2 : group.items.length === 3 ? 3 : 3,
    ...(group.intro ? { intro: fixTypos(group.intro, lang) } : {}),
    items: group.items.map((item) => ({
      title: fixTypos(item.title, lang),
      description: fixTypos(item.description, lang),
      ...(item.image ? { image: item.image } : {}),
    })),
    tone,
  });

  writePage(`pages/${lang === 'en' ? 'en' : 'es'}/${pathName(slug, lang)}.md`, {
    title: j.title,
    description: j.description,
    lang,
    translationKey: key,
    archetype: 'service',
    slug,
    seo: { title: j.title, canonical: `https://www.tampabayfamilyclinics.com/${slug}/` },
    sections: [
      buildHero(lang, heroHeading, eyebrow),
      ...(introBody
        ? [{ type: 'richText', container: 'default', body: fixTypos(introBody, lang), tone: 'default' }]
        : []),
      ...contentSections.slice(0, 1),
      ...(conditions ? [featureBlock(conditions, 'subtle')] : []),
      ...(evalGroup ? [featureBlock(evalGroup, 'default')] : []),
      ...contentSections.slice(1),
      ...(faq
        ? [
            {
              type: 'faq',
              heading: fixTypos(cfg.faqHeading, lang),
              items: faq.items.map((i) => ({
                question: fixTypos(i.question, lang),
                answer: fixTypos(i.answer, lang),
              })),
              tone: 'subtle',
            },
          ]
        : []),
      buildCta(last, lang),
      buildForm(lang, key),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Lab page (anchor nav)                                               */
/* ------------------------------------------------------------------ */

const LAB_ANCHORS = {
  en: [
    { match: 'Ekg Or Ecg Lab Test', label: 'EKG / ECG', id: 'ekg-lab-test' },
    { match: 'Drug Testing Service', label: 'Drug Testing', id: 'drug-testing' },
    { match: 'Spirometry Test', label: 'Spirometry', id: 'spirometry-test' },
    { match: 'Pap Smear Tests', label: 'Pap Smear', id: 'pap-smear-tests' },
    { match: 'Urine And Stool Tests', label: 'Urine & Stool', id: 'urine-and-stool-tests' },
    { match: 'Pregnancy Tests', label: 'Pregnancy', id: 'pregnancy-tests' },
    { match: 'Prenatal Tests', label: 'Prenatal', id: 'prenatal-tests' },
    { match: 'Blood Pressure Monitoring', label: 'Blood Pressure', id: 'blood-pressure-monitoring' },
  ],
  es: [
    { match: 'Prueba de laboratorio Ekg o Ecg', label: 'EKG / ECG', id: 'ekg-lab-test' },
    { match: 'Servicio de Pruebas de Drogas', label: 'Pruebas de drogas', id: 'drug-testing' },
    { match: 'Prueba De Espirometría', label: 'Espirometría', id: 'spirometry-test' },
    { match: 'Pruebas de Papanicolaou', label: 'Papanicolaou', id: 'pap-smear-tests' },
    { match: 'Pruebas de orina y heces', label: 'Orina y heces', id: 'urine-and-stool-tests' },
    { match: 'Pruebas de embarazo', label: 'Embarazo', id: 'pregnancy-tests' },
    { match: 'Pruebas Prenatales', label: 'Prenatal', id: 'prenatal-tests' },
    { match: 'Monitoreo de la presión arterial', label: 'Presión arterial', id: 'blood-pressure-monitoring' },
  ],
};

function buildLabPage({ key, lang, file, slug, mergePairs: pairs = [] }) {
  const j = load(file);
  let nodes = mergePairs(cutTail(j.outline), pairs);
  nodes = nodes.map((n) => (n.text ? { ...n, text: clean(n.text) } : n));

  const { heroHeading, eyebrow, introNodes, rest } = splitHero(nodes);
  const sections = buildSections(rest);
  const last = sections.pop();

  const anchors = LAB_ANCHORS[lang];
  const anchorItems = [];
  for (const section of sections) {
    const anchor = anchors.find((a) => section.heading.startsWith(a.match));
    if (anchor) {
      section.id = anchor.id;
      anchorItems.push({ label: anchor.label, href: `#${anchor.id}` });
    }
  }

  const contentSections = toContentSections(sections, lang);
  const introBody = introBodyOf(introNodes);

  writePage(`pages/${lang === 'en' ? 'en' : 'es'}/${pathName(slug, lang)}.md`, {
    title: j.title,
    description: j.description,
    lang,
    translationKey: key,
    archetype: 'service',
    slug,
    seo: { title: j.title, canonical: `https://www.tampabayfamilyclinics.com/${slug}/` },
    sections: [
      buildHero(lang, heroHeading, eyebrow),
      ...(introBody
        ? [{ type: 'richText', container: 'default', body: fixTypos(introBody, lang), tone: 'default' }]
        : []),
      { type: 'anchorNav', items: anchorItems, tone: 'default' },
      ...contentSections,
      buildCta(last, lang),
      buildForm(lang, key),
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Static-data pages                                                   */
/* ------------------------------------------------------------------ */

function buildServicesOverview({ key, lang, file, slug, description, heroHeading }) {
  const j = load(file);
  const o = j.outline;
  const items = [];
  let current = null;
  for (const n of o) {
    if (
      n.kind === 'heading' &&
      n.level === 1 &&
      !/^(Our Services|Nuestros Servicios)$/.test(clean(n.text)) &&
      !/^\d+%$/.test(clean(n.text))
    ) {
      current = { title: clean(n.text), description: '', image: undefined, href: '#' };
      items.push(current);
      continue;
    }
    if (n.kind === 'heading' && n.level === 1 && /^\d+%$/.test(clean(n.text))) break;
    if (!current) continue;
    if (n.kind === 'text' && !current.description) current.description = clean(n.text);
    if (n.kind === 'image' && !current.image) current.image = asset(n.src);
  }

  const hrefMap = {
    en: {
      'COVID-19 Testing': '/covid-19-testing/',
      'EKG Lab Test': '/laboratory-testing/',
      'Spirometry Test': '/laboratory-testing/',
      'Pregnancy Tests': '/laboratory-testing/',
      'Blood Testing': '/laboratory-testing/',
      'Drug Testing': '/laboratory-testing/',
      'Pap Smear Tests': '/laboratory-testing/',
      'Prenatal Tests': '/laboratory-testing/',
    },
    es: {
      'Pruebas De COVID-19': '/es/pruebas-de-covid-19/',
      Electrocardiograma: '/es/pruebas-de-laboratorio/',
      'Prueba De Espirometría': '/es/pruebas-de-laboratorio/',
      'Pruebas De Embarazo': '/es/pruebas-de-laboratorio/',
      'Análisis de sangre': '/es/pruebas-de-laboratorio/',
      'Prueba de drogas': '/es/pruebas-de-laboratorio/',
      'Pruebas de Papanicolaou': '/es/pruebas-de-laboratorio/',
      'Pruebas prenatales': '/es/pruebas-de-laboratorio/',
    },
  };
  items.forEach((item) => {
    item.href = hrefMap[lang][item.title] ?? '/laboratory-testing/';
  });

  const stats = [];
  for (let i = 0; i < o.length; i++) {
    const n = o[i];
    if (n.kind === 'heading' && n.level === 1 && /^\d+%$/.test(clean(n.text))) {
      const labelNode = o.slice(i + 1).find((m) => m.kind === 'text');
      const imageNode = o.slice(i + 1).find((m) => m.kind === 'image');
      stats.push({
        value: clean(n.text),
        label: labelNode ? clean(labelNode.text) : '',
        ...(imageNode ? { image: asset(imageNode.src) } : {}),
      });
    }
  }

  const moreHeading = lang === 'en' ? 'More Services' : 'Más Servicios';
  const ctaActions =
    lang === 'en'
      ? [
          { label: 'Primary Care', href: '/primary-care/', variant: 'secondary' },
          { label: 'Laboratory Testing', href: '/laboratory-testing/', variant: 'secondary' },
          { label: 'Medical Marijuana Doctors', href: '/medical-marijuana-doctors/', variant: 'secondary' },
          { label: 'Immigration Medical Exam', href: '/immigration-medical-exam-tampa/', variant: 'secondary' },
        ]
      : [
          { label: 'Cuidado Primario', href: '/es/cuidados-primarios/', variant: 'secondary' },
          { label: 'Pruebas de Laboratorio', href: '/es/pruebas-de-laboratorio/', variant: 'secondary' },
          { label: 'Médicos De Marihuana Medicinal', href: '/es/medicos-de-marihuana-medicinal/', variant: 'secondary' },
          { label: 'Examen Médico de Inmigración', href: '/es/examen-medico-de-inmigracion/', variant: 'secondary' },
        ];

  writePage(`pages/${lang === 'en' ? 'en' : 'es'}/${pathName(slug, lang)}.md`, {
    title: j.title,
    description: description ?? j.description,
    lang,
    translationKey: key,
    archetype: 'services-overview',
    slug,
    seo: { title: j.title, canonical: `https://www.tampabayfamilyclinics.com/${slug}/` },
    sections: [
      buildHero(lang, heroHeading, undefined),
      {
        type: 'serviceGrid',
        items: items.map((i) => ({
          title: fixTypos(i.title, lang),
          description: fixTypos(i.description, lang),
          image: i.image,
          href: i.href,
        })),
        tone: 'default',
      },
      { type: 'stats', items: stats, tone: 'subtle' },
      { type: 'cta', heading: moreHeading, actions: ctaActions, tone: 'primary' },
    ],
  });
}

function buildInsurances({ key, lang, file, slug, description }) {
  const j = load(file);
  const disclaimerHeading =
    lang === 'en'
      ? 'Insurance Accepted Trademark Disclaimer'
      : 'Descargo de responsabilidad de marca comercial aceptada por el seguro';
  const disclaimer = j.outline.find((n) => n.kind === 'text' && /trademarks|marcas comerciales/i.test(n.text));

  const ctaActions =
    lang === 'en'
      ? [
          { label: 'Primary Care', href: '/primary-care/', variant: 'secondary' },
          { label: 'Lab Testing', href: '/laboratory-testing/', variant: 'secondary' },
          { label: 'Medical Marijuana Doctors', href: '/medical-marijuana-doctors/', variant: 'secondary' },
          { label: 'Immigration Medical Exam', href: '/immigration-medical-exam-tampa/', variant: 'secondary' },
        ]
      : [
          { label: 'Cuidado Primario', href: '/es/cuidados-primarios/', variant: 'secondary' },
          { label: 'Pruebas de laboratorio', href: '/es/pruebas-de-laboratorio/', variant: 'secondary' },
          { label: 'Médicos De Marihuana Medicinal', href: '/es/medicos-de-marihuana-medicinal/', variant: 'secondary' },
          { label: 'Examen Médico de Inmigración', href: '/es/examen-medico-de-inmigracion/', variant: 'secondary' },
        ];

  writePage(`pages/${lang === 'en' ? 'en' : 'es'}/${pathName(slug, lang)}.md`, {
    title: j.title,
    description: description ?? j.description,
    lang,
    translationKey: key,
    archetype: 'insurances',
    slug,
    seo: { title: j.title, canonical: `https://www.tampabayfamilyclinics.com/${slug}/` },
    sections: [
      buildHero(lang, lang === 'en' ? 'Accepted Insurance Plans' : 'Planes de Seguros Aceptados', undefined),
      { type: 'insuranceLogos', tone: 'default' },
      { type: 'richText', heading: disclaimerHeading, body: disclaimer ? clean(disclaimer.text) : '', tone: 'subtle' },
      { type: 'cta', heading: lang === 'en' ? 'Our Services' : 'Nuestros Servicios', actions: ctaActions, tone: 'primary' },
    ],
  });
}

function buildPrivacy({ key, lang, file, slug, description }) {
  const j = load(file);
  const o = j.outline;
  const cut = o.findIndex(
    (n) =>
      (n.kind === 'text' && /^Copyright/.test(clean(n.text))) ||
      (n.kind === 'link' && /^(OUR SERVICES|NUESTROS SERVICIOS)$/i.test(clean(n.text)))
  );
  const nodes = cut > -1 ? o.slice(0, cut) : o;

  const headings = nodes.filter((n) => n.kind === 'heading');
  const heroHeading = clean(headings[0].text);
  const noticeHeading = clean(headings[1].text);
  const bodyNodes = nodes.slice(nodes.indexOf(headings[1]) + 1);

  const parts = [];
  let list = null;
  const flushList = () => {
    if (list) {
      parts.push(list.map((i) => `- ${i}`).join('\n'));
      list = null;
    }
  };

  for (const n of bodyNodes) {
    if (n.kind === 'listItem') {
      if (!list) list = [];
      list.push(clean(n.text));
      continue;
    }
    flushList();
    if (n.kind === 'paragraph' || n.kind === 'text') {
      parts.push(clean(n.text));
    } else if (n.kind === 'heading') {
      // Normalize so EN (h2/h3) and ES (h3/h2) render at matching levels.
      let level = n.level + 1;
      if (lang === 'es' && n.level >= 3) level = 3;
      if (lang === 'es' && n.level >= 4) level = 4;
      parts.push(`${'#'.repeat(Math.min(level, 6))} ${clean(n.text)}`);
    }
  }
  flushList();

  writePage(`pages/${lang === 'en' ? 'en' : 'es'}/${pathName(slug, lang)}.md`, {
    title: j.title,
    description: description ?? j.description,
    lang,
    translationKey: key,
    archetype: 'legal',
    slug,
    seo: { title: j.title, canonical: `https://www.tampabayfamilyclinics.com/${slug}/` },
    sections: [
      { type: 'hero', variant: 'page', heading: heroHeading },
      { type: 'richText', heading: noticeHeading, body: parts.join('\n\n'), container: 'narrow', tone: 'default' },
    ],
  });
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

const SERVICE_PAGES = [
  {
    key: 'immigration-medical-exam',
    slug: { en: 'immigration-medical-exam-tampa', es: 'es/examen-medico-de-inmigracion' },
    file: { en: 'en__immigration-medical-exam-tampa', es: 'es__examen-medico-de-inmigracion' },
    mergePairs: {
      en: [{ first: 'Immigration', second: 'Medical Exam: An Overview' }],
      es: [
        {
          first: 'Immigration',
          second: 'Examen médico: Descripción General',
          as: 'Examen médico: Descripción General',
        },
      ],
    },
  },
  {
    key: 'physical-exam-dot',
    slug: { en: 'physical-exam-dot', es: 'es/examen-fisico-dot' },
    file: { en: 'en__physical-exam-dot', es: 'es__examen-fisico-dot' },
    mergePairs: {
      en: [{ first: 'What Is A', second: 'Physical Exam DOT?' }],
      es: [{ first: '¿Qué es un', second: 'examen físico DOT?' }],
    },
  },
  {
    key: 'covid-19-testing',
    slug: { en: 'covid-19-testing', es: 'es/pruebas-de-covid-19' },
    file: { en: 'en__covid-19-testing', es: 'es__pruebas-de-covid-19' },
    mergePairs: {
      en: [{ first: 'Do You Have', second: 'Any Of These Symptoms?' }],
      es: [{ first: '¿Tienes algunos', second: 'de estos síntomas?' }],
    },
    dropListItems: { es: ['Headache'] },
  },
];

for (const page of SERVICE_PAGES) {
  for (const lang of ['en', 'es']) {
    buildServicePage({
      key: page.key,
      lang,
      file: page.file[lang],
      slug: page.slug[lang],
      mergePairs: page.mergePairs?.[lang] ?? [],
      dropListItems: lang === 'es' ? page.dropListItems?.es ?? [] : [],
    });
  }
}

for (const lang of ['en', 'es']) {
  buildMmjPage({
    key: 'medical-marijuana-doctors',
    lang,
    file: lang === 'en' ? 'en__medical-marijuana-doctors' : 'es__medicos-de-marihuana-medicinal',
    slug: lang === 'en' ? 'medical-marijuana-doctors' : 'es/medicos-de-marihuana-medicinal',
    mergePairs:
      lang === 'en'
        ? [{ first: 'Apply for', second: 'Medical Marijuana Cards in Florida' }]
        : [{ first: 'Aplica para', second: 'La Tarjeta de marihuana medicinal en Florida' }],
  });
  buildLabPage({
    key: 'laboratory-testing',
    lang,
    file: lang === 'en' ? 'en__laboratory-testing' : 'es__pruebas-de-laboratorio',
    slug: lang === 'en' ? 'laboratory-testing' : 'es/pruebas-de-laboratorio',
    mergePairs:
      lang === 'en'
        ? [{ first: 'What Is', second: 'Laboratory Testing?' }]
        : [{ first: '¿Qué son las', second: 'pruebas de laboratorio?' }],
  });
  buildServicesOverview({
    key: 'services-overview',
    lang,
    file: lang === 'en' ? 'en__our-services' : 'es__nuestros-servicios',
    slug: lang === 'en' ? 'our-services' : 'es/nuestros-servicios',
    heroHeading: lang === 'en' ? 'Our Services' : 'Nuestros Servicios',
    description:
      lang === 'es'
        ? 'El objetivo de nuestros servicios es trabajar en asociación con la comunidad para promover y proteger la salud y el bienestar social en el Estado de Florida.'
        : undefined,
  });
  buildInsurances({
    key: 'insurances',
    lang,
    file: lang === 'en' ? 'en__insurances-accepted' : 'es__seguros-aceptados',
    slug: lang === 'en' ? 'insurances-accepted' : 'es/seguros-aceptados',
    description:
      lang === 'es'
        ? 'Tampa Bay Family Clinic se compromete a brindar atención de calidad a Tampa, FL y sus alrededores.'
        : undefined,
  });
  buildPrivacy({
    key: 'privacy',
    lang,
    file: lang === 'en' ? 'en__privacy-policy' : 'es__politica-de-privacidad',
    slug: lang === 'en' ? 'privacy-policy' : 'es/politica-de-privacidad',
    description:
      lang === 'es'
        ? 'Una cadena anónima creada a partir de su dirección de correo electrónico (también llamada hash) puede proporcionarse al servicio Gravatar para ver si la está utilizando.'
        : undefined,
  });
}

console.log('Done.');
