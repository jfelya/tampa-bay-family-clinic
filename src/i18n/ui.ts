/**
 * UI string dictionary — labels and chrome that are NOT page copy.
 * Page copy stays verbatim in the content collections; these are interface
 * strings (buttons, labels, status messages, aria text). Spanish wording
 * follows the live site wherever an equivalent string existed.
 */

export type Locale = 'en' | 'es';

const en = {
  // Shell
  skipToContent: 'Skip to content',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  menu: 'Menu',
  primaryNavigation: 'Primary',
  mobileNavigation: 'Mobile',
  language: 'Language',
  switchToSpanish: 'Cambiar a español',
  switchToEnglish: 'Switch to English',
  english: 'EN',
  spanish: 'ES',
  toggleTheme: 'Toggle dark mode',
  themeLight: 'Light',
  themeDark: 'Dark',
  call: 'Call',
  callNow: 'Call (813) 933-2880',
  officePhone: 'Office Phone',
  workingHours: 'Working Hours',

  // Common actions
  requestAppointment: 'Request Appointment',
  viewAllServices: 'View all services',
  learnMore: 'Learn more',
  backToHome: 'Back to home',

  // Blocks
  meetTheTeam: 'Meet the team',
  mapTitle: 'Our location',
  mapLoading: 'Loading map…',
  breadcrumb: 'Breadcrumb',
  contactPhone: 'Phone Number',
  contactHours: 'Working Hours',
  contactAddress: 'Address',
  contactEmail: 'Email Us',

  // Forms
  formFullName: 'Full Name',
  formFullNamePlaceholder: 'Enter Your Full Name',
  formEmail: 'Email',
  formEmailPlaceholder: 'Email Address',
  formPhone: 'Phone',
  formPhonePlaceholder: 'Mobile Number',
  formDesiredDate: 'Desired Date',
  formDesiredTime: 'Desired Time',
  formMessage: 'Message',
  formMessagePlaceholder: 'Message',
  formOptional: '(optional)',
  formSelectTime: 'Select a time',
  formSubmitAppointment: 'Request an Appointment',
  formSubmitContact: 'Submit Form',
  formSending: 'Sending…',
  formSuccessAppointment:
    'Thank you! Your appointment request was sent. The clinic will contact you soon.',
  formSuccessContact: 'Thank you! Your message was sent. The clinic will contact you soon.',
  formError:
    'Something went wrong. Please try again or call us at (813) 933-2880.',
  formRequired: 'This field is required.',
  formInvalidEmail: 'Please enter a valid email address.',
  formInvalidPhone: 'Please enter a valid phone number.',
  formCaptcha: 'Please complete the CAPTCHA verification.',
  formRequiredNote: 'Fields marked with * are required.',
  formTurnstileLabel: 'CAPTCHA verification',
  formPlaceholderSuccess:
    'Placeholder mode: the form works — no email is sent yet. Mailgun will be configured at deploy.',

  // Phone banner
  phoneLabel: 'Call us',
  copyPhone: 'Copy number',
  copiedPhone: 'Copied!',

  // Footer
  footerContact: 'Contact',
  footerServices: 'Our Services',
  footerQuickLinks: 'Quick Links',
  footerLegal: 'Legal',
  copyright: 'Tampa Bay Family Clinic. All rights reserved.',

  // Utility pages
  notFoundTitle: 'Page not found',
  notFoundBody: 'The page you are looking for does not exist or has moved.',
  notFoundCta: 'Go to home',
} as const;

export type UIKey = keyof typeof en;

const es: Record<UIKey, string> = {
  // Shell
  skipToContent: 'Saltar al contenido',
  openMenu: 'Abrir menú',
  closeMenu: 'Cerrar menú',
  menu: 'Menú',
  primaryNavigation: 'Principal',
  mobileNavigation: 'Móvil',
  language: 'Idioma',
  switchToSpanish: 'Cambiar a español',
  switchToEnglish: 'Switch to English',
  english: 'EN',
  spanish: 'ES',
  toggleTheme: 'Cambiar modo oscuro',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  call: 'Llamar',
  callNow: 'Llame (813) 933-2880',
  officePhone: 'Teléfono de oficina',
  workingHours: 'Horario de atención',

  // Common actions
  requestAppointment: 'Solicitar una cita',
  viewAllServices: 'Ver todos los servicios',
  learnMore: 'Más información',
  backToHome: 'Volver al inicio',

  // Blocks
  meetTheTeam: 'Conoce al equipo',
  mapTitle: 'Nuestra ubicación',
  mapLoading: 'Cargando mapa…',
  breadcrumb: 'Ruta de navegación',
  contactPhone: 'Número Telefónico',
  contactHours: 'Horario de atención',
  contactAddress: 'Dirección',
  contactEmail: 'Escríbenos',

  // Forms
  formFullName: 'Nombre Completo',
  formFullNamePlaceholder: 'Nombre Completo',
  formEmail: 'Correo',
  formEmailPlaceholder: 'Correo',
  formPhone: 'Teléfono',
  formPhonePlaceholder: 'Teléfono',
  formDesiredDate: 'Fecha',
  formDesiredTime: 'Hora',
  formMessage: 'Mensaje',
  formMessagePlaceholder: 'Mensaje',
  formOptional: '(opcional)',
  formSelectTime: 'Seleccione una hora',
  formSubmitAppointment: 'Solicitar una cita',
  formSubmitContact: 'Enviar formulario',
  formSending: 'Enviando…',
  formSuccessAppointment:
    '¡Gracias! Su solicitud de cita fue enviada. La clínica se comunicará con usted pronto.',
  formSuccessContact:
    '¡Gracias! Su mensaje fue enviado. La clínica se comunicará con usted pronto.',
  formError:
    'Algo salió mal. Por favor intente de nuevo o llámenos al (813) 933-2880.',
  formRequired: 'Este campo es obligatorio.',
  formInvalidEmail: 'Por favor ingrese un correo electrónico válido.',
  formInvalidPhone: 'Por favor ingrese un número de teléfono válido.',
  formCaptcha: 'Por favor complete la verificación CAPTCHA.',
  formRequiredNote: 'Los campos marcados con * son obligatorios.',
  formTurnstileLabel: 'Verificación CAPTCHA',
  formPlaceholderSuccess:
    'Modo de prueba: el formulario funciona — aún no se envía ningún correo. Mailgun se configurará al publicar.',

  // Phone banner
  phoneLabel: 'Llámenos',
  copyPhone: 'Copiar número',
  copiedPhone: '¡Copiado!',

  // Footer
  footerContact: 'Contacto',
  footerServices: 'Nuestros Servicios',
  footerQuickLinks: 'Enlaces rápidos',
  footerLegal: 'Legal',
  copyright: 'Tampa Bay Family Clinic. Todos los derechos reservados.',

  // Utility pages
  notFoundTitle: 'Página no encontrada',
  notFoundBody: 'La página que busca no existe o se ha movido.',
  notFoundCta: 'Ir al inicio',
};

export const ui: Record<Locale, Record<UIKey, string>> = { en, es };

/** Appointment time slots — confirmed 16 slots, 8:00 AM → 3:30 PM. */
export const TIME_SLOTS = [
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
] as const;
