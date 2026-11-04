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
    .sort(([first], [second]) => filenameOrder.compare(first.split('/').at(-1)!, second.split('/').at(-1)!))
    .map(([path, src], index): GalleryImage => {
      const filename = path.split('/').at(-1)!;
      const supplied = captions[projectId]?.[filename];
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
