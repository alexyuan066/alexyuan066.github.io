import captionConfig from './gallery-captions.json';

export interface GalleryImage {
  src: string;
  alt: string;
  caption: string;
  credit?: string;
}

const projectIds = ['ultrasonic', 'aiaa', 'combustion'] as const;
const captions = captionConfig as Record<string, Record<string, unknown>>;
const files = import.meta.glob<string>(
  '/src/assets/projects/{ultrasonic,aiaa,combustion}/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, query: '?url', import: 'default' },
);
const filenameOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const seniorDesignOrder = [
  '01-boat-cad-angled.png',
  '02-boat-cad-underside.png',
  '03-concept-5-sketch.png',
  '04-concept-2-alternative.png',
  '05-transducer-test-rig.png',
];
const aiaaOrder = [
  'Hotfiretestflamephoto.JPG',
  'Hotfireteststandphoto.jpg',
  'CAD ethanol side start with tank.png',
  'Ethanol Fluid system.jpg',
  'Nitrous Fluid Piping.jpg',
  'Lockheed event.JPG',
];
const isTeamPhoto = (filename: string) => /(?:^|[-_\s])team[-_\s]*(?:58|photo)(?:\b|[_\s-])/i.test(filename.replace(/\.[^.]+$/, ''));
const text = (value: unknown) => typeof value === 'string'
  ? value.trim().replace(/\u2014/g, ' - ')
  : '';

const readableFilename = (filename: string) => filename
  .replace(/\.[^.]+$/, '')
  .replace(/^\d+[\s._-]*/, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\u2014/g, ' - ')
  .replace(/\s+/g, ' ')
  .trim();

const imagesByProject: Record<string, GalleryImage[]> = Object.fromEntries(projectIds.map(projectId => {
  const images = Object.entries(files)
    .filter(([path]) => path.split('/').at(-2) === projectId)
    .sort(([first], [second]) => {
      const firstName = first.split('/').at(-1)!;
      const secondName = second.split('/').at(-1)!;
      if (projectId === 'ultrasonic') {
        const position = (name: string) => {
          const index = seniorDesignOrder.indexOf(name);
          return index >= 0 ? index : isTeamPhoto(name) ? 5 : 6;
        };
        const order = position(firstName) - position(secondName);
        if (order) return order;
      } else if (projectId === 'aiaa') {
        const position = (name: string) => {
          const index = aiaaOrder.indexOf(name);
          return index >= 0 ? index : aiaaOrder.length;
        };
        const order = position(firstName) - position(secondName);
        if (order) return order;
      }
      return filenameOrder.compare(firstName, secondName);
    })
    .map(([path, src], index): GalleryImage => {
      const filename = path.split('/').at(-1)!;
      const supplied = captions[projectId]?.[filename]
        ?? (projectId === 'ultrasonic' && isTeamPhoto(filename) ? captions.ultrasonic?.['06-team-photo.jpg'] : undefined);
      const metadata = supplied && typeof supplied === 'object' ? supplied as Record<string, unknown> : {};
      const fallback = readableFilename(filename) || `Image ${index + 1}`;
      return {
        src,
        alt: text(metadata.alt) || text(metadata.caption) || fallback,
        caption: text(metadata.caption) || fallback,
        ...(text(metadata.credit) ? { credit: text(metadata.credit) } : {}),
      };
    });
  return [projectId, images];
}));

/** The confidential internship entry is intentionally excluded from the image system. */
export function getProjectImages(projectId: string): GalleryImage[] {
  return projectIds.some(allowedId => allowedId === projectId) ? imagesByProject[projectId] : [];
}
