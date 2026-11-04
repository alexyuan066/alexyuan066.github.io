import { useEffect, useId, useRef, useState } from 'react';
import type { GalleryImage } from './project-images';
import './project-gallery.css';

function ScrollArrow({ direction }: { direction: 'left' | 'right' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={direction === 'left' ? 'M20 12H5m6-6-6 6 6 6' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export default function ProjectGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const identifier = useId();
  const stripId = `${identifier}-strip`;
  const titleId = `${identifier}-title`;
  const captionId = `${identifier}-caption`;
  const strip = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [scroll, setScroll] = useState({ left: false, right: false, overflow: false });
  const isOpen = activeIndex !== null && images.length > 0;
  const activeImage = isOpen ? images[activeIndex % images.length] : null;

  useEffect(() => {
    const element = strip.current;
    if (!element) return;
    const update = () => setScroll({
      left: element.scrollLeft > 2,
      right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
      overflow: element.scrollWidth > element.clientWidth + 2,
    });
    update();
    element.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      resize.disconnect();
    };
  }, [images.length]);

  useEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!images.length) return null;

  function scrollImages(direction: -1 | 1) {
    const element = strip.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.max(180, element.clientWidth * .8),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  function moveImage(direction: -1 | 1) {
    setActiveIndex(index => index === null ? null : (index + direction + images.length) % images.length);
  }

  return (
    <section className="project-gallery" aria-label={`${title} images`}>
      <div className="gallery-heading"><p>Images <span>{String(images.length).padStart(2, '0')}</span></p>{scroll.overflow && <div className="gallery-scroll-controls"><button type="button" onClick={() => scrollImages(-1)} disabled={!scroll.left} aria-label={`Scroll ${title} images left`} aria-controls={stripId}><ScrollArrow direction="left" /></button><button type="button" onClick={() => scrollImages(1)} disabled={!scroll.right} aria-label={`Scroll ${title} images right`} aria-controls={stripId}><ScrollArrow direction="right" /></button></div>}</div>
      <div className="gallery-strip" ref={strip} id={stripId} role="group" aria-label={`${title} image thumbnails`}>
        {images.map((image, index) => <button className="gallery-thumbnail" type="button" key={`${image.src}-${index}`} aria-label={`Open image ${index + 1} of ${images.length}: ${image.caption}${image.alt !== image.caption ? `. ${image.alt}` : ''}`} onClick={event => { opener.current = event.currentTarget; setActiveIndex(index); }}><span className="gallery-thumbnail-image"><img src={image.src} alt="" loading="lazy" decoding="async" /></span><span className="gallery-thumbnail-caption">{image.caption}</span></button>)}
      </div>
      <dialog className="gallery-dialog" ref={dialog} aria-labelledby={titleId} aria-describedby={captionId} onCancel={event => { event.preventDefault(); setActiveIndex(null); }} onClose={() => setActiveIndex(null)} onKeyDown={event => {
        if (images.length < 2) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          moveImage(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setActiveIndex(null);
      }}>
        {activeImage && <div className="gallery-viewer"><div className="gallery-viewer-heading"><h2 id={titleId}>{title}</h2><button className="gallery-close" type="button" aria-label="Close image viewer" onClick={() => setActiveIndex(null)}>Close</button></div><figure className="gallery-enlarged"><img src={activeImage.src} alt={activeImage.alt} decoding="async" /><figcaption id={captionId}><p>{activeImage.caption}</p>{activeImage.credit && <p className="gallery-credit">{activeImage.credit}</p>}</figcaption></figure><div className="gallery-viewer-controls">{images.length > 1 && <button type="button" aria-label="Previous image" onClick={() => moveImage(-1)}>Previous</button>}<p className="gallery-counter" aria-live="polite" aria-atomic="true">Image {(activeIndex ?? 0) + 1} of {images.length}</p>{images.length > 1 && <button type="button" aria-label="Next image" onClick={() => moveImage(1)}>Next</button>}</div></div>}
      </dialog>
    </section>
  );
}
