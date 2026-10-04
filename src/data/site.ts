/**
 * Global clinic data per locale (source of truth for shell + contact blocks).
 * Values confirmed in docs/REDESIGN-PLAN.md §8 and inventory/WEBSITE-INVENTORY.md.
 */

export interface SiteInfo {
  lang: 'en' | 'es';
  name: string;
  phone: string;
  phoneHref: string;
  email: string;
  address: string;
  addressLines: string[];
  hours: string;
  hoursDays: string;
  hoursTimes: string;
  mapEmbed: string;
}

export const site: Record<'en' | 'es', SiteInfo> = {
  en: {
    lang: 'en',
    name: 'Tampa Bay Family Clinic',
    phone: '(813) 933-2880',
    phoneHref: 'tel:+18139332880',
    email: 'info@tampabayfamilyclinics.com',
    address: '7206 N Armenia Ave, Tampa, FL 33604',
    addressLines: ['7206 N Armenia Ave', 'Tampa, FL 33604'],
    hours: 'Monday – Friday, 8:00 AM – 4:30 PM',
    hoursDays: 'Monday – Friday',
    hoursTimes: '8:00 AM – 4:30 PM',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3522.325823059057!2d-82.4883323245671!3d28.01451571187682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88c2c1121a826145%3A0x9cdac582625046cb!2sTampa%20Bay%20Family%20Clinic!5e0!3m2!1sen!2sco!4v1779306092746!5m2!1sen!2sco',
  },
  es: {
    lang: 'es',
    name: 'Tampa Bay Family Clinic',
    phone: '(813) 933-2880',
    phoneHref: 'tel:+18139332880',
    email: 'info@tampabayfamilyclinics.com',
    address: '7206 N Armenia Ave, Tampa, FL 33604',
    addressLines: ['7206 N Armenia Ave', 'Tampa, FL 33604'],
    hours: 'Lunes – Viernes, 8:00 AM – 4:30 PM',
    hoursDays: 'Lunes – Viernes',
    hoursTimes: '8:00 AM – 4:30 PM',
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d19924.851918590048!2d-82.48624911039012!3d28.016849849817135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88c2c1121a826145%3A0x9cdac582625046cb!2sTampa%20Bay%20Family%20Clinic!5e0!3m2!1ses!2sco!4v1647980843632!5m2!1ses!2sco',
  },
};
