import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ---------------------------------------------------------------------------
 * Section block catalog (docs/PHASE-2-CONTENT-MODEL.md §4)
 * Every page is a list of these blocks; PageLayout maps type -> component.
 * ------------------------------------------------------------------------- */

const action = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(['primary', 'secondary', 'accent', 'ghost']).default('primary'),
  icon: z
    .enum(['phone', 'mail', 'map-pin', 'calendar', 'user', 'arrow-right', 'send', 'check'])
    .optional(),
});

const tone = z.enum(['default', 'subtle']).default('default');

const image = z.object({
  src: z.string(),
  alt: z.string().default(''),
});

const section = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hero'),
    variant: z.enum(['home', 'page']).default('page'),
    eyebrow: z.string().optional(),
    heading: z.string(),
    subheading: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    actions: z.array(action).default([]),
  }),
  z.object({
    type: z.literal('richText'),
    heading: z.string().optional(),
    body: z.string(),
    container: z.enum(['default', 'narrow']).default('narrow'),
    tone,
  }),
  z.object({
    type: z.literal('contentSection'),
    id: z.string().optional(),
    heading: z.string(),
    body: z.string(),
    images: z.array(image).default([]),
    imagePosition: z.enum(['left', 'right']).default('right'),
    tone,
  }),
  z.object({
    type: z.literal('splitImage'),
    heading: z.string(),
    body: z.string(),
    image: z.string(),
    imageAlt: z.string().default(''),
    imagePosition: z.enum(['left', 'right']).default('right'),
    bullets: z.array(z.string()).default([]),
    actions: z.array(action).default([]),
    tone,
  }),
  z.object({
    type: z.literal('serviceGrid'),
    heading: z.string().optional(),
    intro: z.string().optional(),
    keys: z.array(z.string()).optional(),
    items: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          image: z.string().optional(),
          imageAlt: z.string().default(''),
          href: z.string(),
        })
      )
      .optional(),
    limit: z.number().optional(),
    action: action.optional(),
    tone,
  }),
  z.object({
    type: z.literal('featureList'),
    heading: z.string().optional(),
    intro: z.string().optional(),
    columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        image: z.string().optional(),
        imageAlt: z.string().default(''),
        href: z.string().optional(),
      })
    ),
    tone,
  }),
  z.object({
    type: z.literal('stats'),
    heading: z.string().optional(),
    items: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
        image: z.string().optional(),
        imageAlt: z.string().default(''),
      })
    ),
    tone,
  }),
  z.object({
    type: z.literal('insuranceLogos'),
    heading: z.string().optional(),
    note: z.string().optional(),
    action: action.optional(),
    tone,
  }),
  z.object({
    type: z.literal('providerList'),
    heading: z.string().optional(),
    intro: z.string().optional(),
    introImage: z.string().optional(),
    introImageAlt: z.string().default(''),
    keys: z.array(z.string()).optional(),
    limit: z.number().optional(),
    clamp: z.boolean().default(false),
    tone,
  }),
  z.object({
    type: z.literal('testimonial'),
    quote: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().default(''),
    tone,
  }),
  z.object({
    type: z.literal('faq'),
    heading: z.string().optional(),
    intro: z.string().optional(),
    items: z.array(z.object({ question: z.string(), answer: z.string() })),
    tone,
  }),
  z.object({
    type: z.literal('cta'),
    heading: z.string(),
    body: z.string().optional(),
    actions: z.array(action).default([]),
    tone: z.enum(['primary', 'accent', 'subtle']).default('primary'),
  }),
  z.object({
    type: z.literal('serviceLinks'),
    heading: z.string().optional(),
    intro: z.string().optional(),
    items: z.array(
      z.object({
        label: z.string(),
        href: z.string(),
        icon: z
          .enum([
            'heart-pulse',
            'shield-check',
            'user',
            'users',
            'map-pin',
            'calendar',
            'phone',
            'mail',
            'arrow-right',
          ])
          .optional(),
        description: z.string().optional(),
      })
    ),
    tone,
  }),
  z.object({
    type: z.literal('form'),
    variant: z.enum(['appointment', 'contact']),
    heading: z.string().optional(),
    body: z.string().optional(),
    source: z.string(),
    aside: z
      .object({
        heading: z.string().optional(),
        callLabel: z.string().optional(),
        emailLabel: z.string().optional(),
      })
      .optional(),
    tone,
  }),
  z.object({
    type: z.literal('contactDetails'),
    heading: z.string().optional(),
    showPhone: z.boolean().default(true),
    tone,
  }),
  z.object({
    type: z.literal('map'),
    heading: z.string().optional(),
    body: z.string().optional(),
    tone,
  }),
  z.object({
    type: z.literal('phoneBanner'),
    label: z.string().optional(),
    tone,
  }),
  z.object({
    type: z.literal('anchorNav'),
    heading: z.string().optional(),
    items: z.array(z.object({ label: z.string(), href: z.string() })),
    tone,
  }),
]);

/* ---------------------------------------------------------------------------
 * Collections
 * ------------------------------------------------------------------------- */

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['en', 'es']),
    translationKey: z.string(),
    archetype: z.enum([
      'home',
      'service',
      'services-overview',
      'providers',
      'insurances',
      'contact',
      'legal',
      'utility',
    ]),
    slug: z.string(),
    seo: z.object({
      title: z.string().optional(),
      canonical: z.string().url(),
      ogImage: z.string().optional(),
      noindex: z.boolean().default(false),
    }),
    sections: z.array(section),
  }),
});

const providers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/providers' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    credentials: z.string().optional(),
    specialty: z.object({ en: z.string(), es: z.string() }),
    photo: z.string(),
    photoAlt: z.string(),
    bio: z.object({ en: z.string(), es: z.string() }).optional(),
    href: z.object({ en: z.string(), es: z.string() }),
    group: z.enum(['doctors', 'team']).default('doctors'),
  }),
});

const insurances = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insurances' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    logo: z.string(),
    url: z.string().url().optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    order: z.number(),
    key: z.string(),
    title: z.object({ en: z.string(), es: z.string() }),
    description: z.object({ en: z.string(), es: z.string() }),
    href: z.object({ en: z.string(), es: z.string() }),
    image: z.string().optional(),
    imageAlt: z.object({ en: z.string(), es: z.string() }).optional(),
  }),
});

export const collections = { pages, providers, insurances, services };
