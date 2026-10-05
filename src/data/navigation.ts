/**
 * Header + footer navigation per locale.
 * Every entry is a real, preserved URL — no `#` placeholders.
 * Labels follow docs/NAVIGATION-SPEC.md §2.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface NavEntry extends NavLink {
  children?: NavLink[];
}

export interface FooterNav {
  services: NavLink[];
  quick: NavLink[];
}

export interface LocaleNavigation {
  primary: NavEntry[];
  footer: FooterNav;
}

export const navigation: Record<'en' | 'es', LocaleNavigation> = {
  en: {
    primary: [
      { label: 'Home', href: '/' },
      { label: 'Our Providers', href: '/our-providers/' },
      {
        label: 'Services',
        href: '/our-services/',
        children: [
          { label: 'Primary Care', href: '/primary-care/' },
          { label: 'Laboratory Testing', href: '/laboratory-testing/' },
          { label: 'Physical Exam DOT', href: '/physical-exam-dot/' },
          { label: 'Immigration Medical Exam', href: '/immigration-medical-exam-tampa/' },
          { label: 'COVID-19 Testing', href: '/covid-19-testing/' },
          { label: 'Medical Marijuana Doctors', href: '/medical-marijuana-doctors/' },
        ],
      },
      { label: 'Insurances', href: '/insurances-accepted/' },
      { label: 'Contact', href: '/contact-us/' },
    ],
    footer: {
      services: [
        { label: 'Primary Care', href: '/primary-care/' },
        { label: 'Laboratory Testing', href: '/laboratory-testing/' },
        { label: 'Physical Exam DOT', href: '/physical-exam-dot/' },
        { label: 'Immigration Medical Exam', href: '/immigration-medical-exam-tampa/' },
        { label: 'Medical Marijuana Doctors', href: '/medical-marijuana-doctors/' },
        { label: 'COVID-19 Testing', href: '/covid-19-testing/' },
      ],
      quick: [
        { label: 'All Services', href: '/our-services/' },
        { label: 'Our Providers', href: '/our-providers/' },
        { label: 'Insurances Accepted', href: '/insurances-accepted/' },
        { label: 'Contact Us', href: '/contact-us/' },
        { label: 'Privacy Policy', href: '/privacy-policy/' },
      ],
    },
  },
  es: {
    primary: [
      { label: 'Inicio', href: '/es/inicio/' },
      { label: 'Nuestros Doctores', href: '/es/nuestros-doctores/' },
      {
        label: 'Servicios',
        href: '/es/nuestros-servicios/',
        children: [
          { label: 'Cuidado Primario', href: '/es/cuidados-primarios/' },
          { label: 'Pruebas de Laboratorio', href: '/es/pruebas-de-laboratorio/' },
          { label: 'Examen Físico DOT', href: '/es/examen-fisico-dot/' },
          { label: 'Examen Médico de Inmigración', href: '/es/examen-medico-de-inmigracion/' },
          { label: 'Pruebas de COVID-19', href: '/es/pruebas-de-covid-19/' },
          { label: 'Médicos de Marihuana Medicinal', href: '/es/medicos-de-marihuana-medicinal/' },
        ],
      },
      { label: 'Seguros', href: '/es/seguros-aceptados/' },
      { label: 'Contacto', href: '/es/contactanos/' },
    ],
    footer: {
      services: [
        { label: 'Cuidado Primario', href: '/es/cuidados-primarios/' },
        { label: 'Pruebas de Laboratorio', href: '/es/pruebas-de-laboratorio/' },
        { label: 'Examen Físico DOT', href: '/es/examen-fisico-dot/' },
        { label: 'Examen Médico de Inmigración', href: '/es/examen-medico-de-inmigracion/' },
        { label: 'Médicos de Marihuana Medicinal', href: '/es/medicos-de-marihuana-medicinal/' },
        { label: 'Pruebas de COVID-19', href: '/es/pruebas-de-covid-19/' },
      ],
      quick: [
        { label: 'Todos los Servicios', href: '/es/nuestros-servicios/' },
        { label: 'Nuestros Doctores', href: '/es/nuestros-doctores/' },
        { label: 'Seguros Aceptados', href: '/es/seguros-aceptados/' },
        { label: 'Contáctanos', href: '/es/contactanos/' },
        { label: 'Política de privacidad', href: '/es/politica-de-privacidad/' },
      ],
    },
  },
};
