import type { Locale } from '@/app/intro-content';

export type AboutData = {
  header: string;
  heading: string;
  lead: string;
  bodyPrimary: string;
  bodySecondary: string;
  profileHeading: string;
  infoRows: Array<{ label: string; value: string }>;
};

export type SkillCategoryData = {
  category: string;
  order: number;
  skills: string[];
};

export type ExperienceItemData = {
  id: string | number;
  order: number;
  period: string;
  position: string;
  organization: string;
  description: string;
  skills: string[];
};

export type CertificateItemData = {
  id: string | number;
  order: number;
  title: string;
  issuer: string;
  year?: string;
  description?: string;
  credentialId?: string;
  credentialUrl?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileImage?: ProjectImageData;
  previewPages?: ProjectImageData[];
};

export type ProjectImageData = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  srcSet?: string;
  variants?: Array<{ url: string; width: number; height: number }>;
};

export function projectImageSource(image: ProjectImageData, width: number, height: number, dpr: number): string {
  if (!image.width || !image.height || width <= 0 || height <= 0) return image.url;
  const required = Math.min(width / image.width, height / image.height) * image.width * dpr;
  return image.variants?.filter(variant => variant.width >= required)
    .sort((a, b) => a.width - b.width)[0]?.url || image.url;
}

export type ProjectVisual = 'web-app' | 'mobile-app' | 'ui-ux' | 'none';

export function normalizeProjectVisual(visual: unknown): ProjectVisual {
  switch (visual) {
    case 'orders': case 'city': case 'web-app': return 'web-app';
    case 'diary': case 'mobile-app': return 'mobile-app';
    case 'ui-ux': return 'ui-ux';
    default: return 'none';
  }
}

export type ProjectItemData = {
  id: string | number;
  slug: string;
  title: string;
  year?: string;
  kind: string;
  summary: string;
  description?: string;
  technologies: string[];
  visual: ProjectVisual | 'orders' | 'diary' | 'city';
  imageUrl?: string;
  gallery?: ProjectImageData[];
  liveUrl?: string;
  githubUrl?: string;
  selected: boolean;
};

export type ContactRowData = {
  label: string;
  value: string;
  type?: 'email' | 'phone' | 'location' | 'link' | 'text' | SocialLinkData['platform'];
  url?: string;
};

export type SocialLinkData = {
  platform: 'github' | 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'twitter' | 'threads';
  url: string;
  visible: boolean;
};

export const socialPlatformOptions = [
  { label: 'GitHub', value: 'github' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'X (Twitter)', value: 'twitter' },
  { label: 'Threads', value: 'threads' },
] satisfies Array<{ label: string; value: SocialLinkData['platform'] }>;

export function safeContactHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value) || /[\s\\]/.test(value)) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function contactRowHref(row: ContactRowData): string | undefined {
  const type = row.type || (row.label.toLowerCase().includes('email') ? 'email' : 'text');
  if (type === 'location' || type === 'text') return undefined;
  if (type === 'email') {
    const email = row.url ? row.url.replace(/^mailto:/i, '') : row.value;
    return /^[^\s@?&#%:]+@[^\s@?&#%:]+\.[^\s@?&#%:]+$/.test(email)
      ? `mailto:${email}`
      : undefined;
  }
  if (type === 'phone') {
    const phone = row.url?.trim() ? row.url.trim().replace(/^tel:/i, '') : row.value;
    return /^\+?[0-9](?:[0-9 .()-]*[0-9])?(?![\s\S])/.test(phone)
      ? `tel:${phone.replace(/[ .()-]/g, '')}`
      : undefined;
  }
  return type === 'link' || socialPlatformOptions.some(option => option.value === type)
    ? safeContactHttpsUrl(row.url || row.value)
    : undefined;
}

export type ContactData = {
  heading?: string | null;
  contactRows: ContactRowData[];
  socialLinks: SocialLinkData[];
  email?: string;
  baseLocation?: string;
};

export type ResumeData = {
  pdfUrl: string | null;
  previewPages?: ProjectImageData[];
  documentTitle: string;
};

export type PortfolioBundle = {
  about: AboutData;
  skills: { groups: SkillCategoryData[]; areas: string[] };
  experience: ExperienceItemData[];
  certificates: CertificateItemData[];
  selectedProjects: ProjectItemData[];
  allProjects: ProjectItemData[];
  contact: ContactData;
  resume: ResumeData;
};

export function getLangDoc(doc: unknown, locale: Locale): Record<string, unknown> {
  if (!doc || typeof doc !== 'object') return {};
  const record = doc as Record<string, Record<string, unknown>>;
  if (locale === 'id') {
    return record.id_ID || record.id || record.en || {};
  }
  return record.en || record.id_ID || record.id || {};
}

export function toProjectImage(value: unknown): ProjectImageData | null {
  if (!value || typeof value !== 'object') return null;
  const media = value as Record<string, unknown>;
  if (typeof media.url !== 'string' || !media.url) return null;
  return {
    url: media.url,
    alt: typeof media.alt === 'string' && media.alt ? media.alt : undefined,
    width: typeof media.width === 'number' ? media.width : undefined,
    height: typeof media.height === 'number' ? media.height : undefined,
  };
}

export function mapProjectDoc(doc: Record<string, unknown>, locale: Locale): ProjectItemData {
  const legacyImage = toProjectImage(doc.image);
  const gallery = Array.isArray(doc.gallery)
    ? doc.gallery
        .map(item => toProjectImage(item && typeof item === 'object' ? (item as Record<string, unknown>).image : null))
        .filter((item): item is ProjectImageData => Boolean(item))
    : [];

  if (gallery.length === 0 && legacyImage) gallery.push(legacyImage);

  const imageUrl = gallery[0]?.url;

  const lang = getLangDoc(doc, locale);
  const skillNames = Array.isArray(doc.skills)
    ? doc.skills.map((s: unknown) => (typeof s === 'object' && s && 'name' in s ? String((s as { name: unknown }).name) : String(s))).filter(Boolean)
    : [];

  return {
    id: doc.id as string | number,
    slug: doc.slug as string,
    title: (lang.title as string) || (doc.title as string),
    year: (doc.year as string) || undefined,
    kind: (lang.kind as string) || '',
    summary: (lang.summary as string) || '',
    description: (lang.description as string) || undefined,
    technologies: skillNames,
    visual: normalizeProjectVisual(doc.visual),
    imageUrl,
    gallery: gallery.length > 0 ? gallery : undefined,
    liveUrl: (doc.liveUrl as string) || undefined,
    githubUrl: (doc.githubUrl as string) || undefined,
    selected: Boolean(doc.selected),
  };
}
