import { useRef, useState } from 'react';
import { profile, skillGroups, work } from './content';
import type { WorkEntry } from './content';

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" /></svg>;
}

function WorkItem({ entry }: { entry: WorkEntry }) {
  const [expanded, setExpanded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLDivElement>(null);

  function closeStory() {
    const top = preview.current?.getBoundingClientRect().top ?? 0;
    const needsOrientation = top < 85 || top > window.innerHeight - 100;
    setExpanded(false);
    requestAnimationFrame(() => {
      trigger.current?.focus({ preventScroll: true });
      if (needsOrientation) preview.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      const bounds = trigger.current?.getBoundingClientRect();
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      if (bounds && (bounds.top < headerBottom || bounds.bottom > window.innerHeight)) {
        trigger.current?.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
  }

  return (
    <article className={`work-entry ${expanded ? 'is-expanded' : ''}`}>
      <div className="work-preview" ref={preview}>
        <div className="work-copy">
          <div className="entry-meta"><span className="entry-number">{entry.number}</span><span>{entry.dates}</span></div>
          <h3>{entry.title}</h3>
          <p className="work-context">{entry.context}</p>
          <p className="work-summary">{entry.summary}</p>
          {entry.additionalSummary && <p className="additional-summary">{entry.additionalSummary}</p>}
          <div className="tags" aria-label="Skills used">{entry.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        </div>
        {entry.media ? (
          <figure className="work-media">
            {entry.media.videoSrc ? <video controls playsInline preload="none" poster={entry.media.src} aria-label={entry.media.alt}><source src={entry.media.videoSrc} /><p>Your browser does not support embedded video.</p></video> : <img src={entry.media.src} alt={entry.media.alt} loading="lazy" decoding="async" />}
            <figcaption>{entry.media.caption}</figcaption>
          </figure>
        ) : (
          <div className="work-aside"><p className="aside-title">{entry.aside.title}</p><p>{entry.aside.description}</p></div>
        )}
        <button className="detail-trigger" ref={trigger} aria-expanded={expanded} aria-controls={`${entry.id}-story`} id={`${entry.id}-trigger`} onClick={() => expanded ? closeStory() : setExpanded(true)}>
          {expanded ? 'Close details' : 'View details'}<span className="plus" aria-hidden="true">{expanded ? '−' : '+'}</span><span className="sr-only">: {entry.title}</span>
        </button>
      </div>
      <div id={`${entry.id}-story`} className="story" role="region" aria-labelledby={`${entry.id}-trigger`} hidden={!expanded}>
        <div className="story-heading"><span>Engineering details / {entry.number}</span><span>{entry.dates}</span></div>
        <div className="story-sections">{entry.sections.map(section => <section className="story-section" key={section.title}><h4>{section.title}</h4><div>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div>
        {entry.note && <p className="story-note">{entry.note}</p>}
        <button className="close-story" onClick={closeStory}>Close story<span aria-hidden="true">↑</span><span className="sr-only">: {entry.title}</span></button>
      </div>
    </article>
  );
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header"><div className="header-inner">
        <a className="brand" href="#top" aria-label="AY Alex Yuan, back to top"><span className="monogram" aria-hidden="true">AY</span>{' '}<span>Alex Yuan</span></a>
        <nav aria-label="Main navigation"><a href="#work">Work</a><a href="#about">About</a><a href="#resume">Resume</a><a href="#contact">Contact<Arrow diagonal /></a></nav>
      </div></header>
      <main id="main">
        <section className="hero page-width" id="top" aria-labelledby="intro-title">
          <div className="hero-main">
            <div className="hero-name"><p className="technical-label">Mechanical engineering · UConn</p><h1 id="intro-title">Alex Yuan</h1><p className="hero-focus">Mechanical design & product development</p></div>
            <div className="hero-intro"><p>I’m a mechanical engineering student with experience in <strong>mechanical design, analysis, and testing.</strong></p><p>My work includes water-electrolysis hardware, preliminary system design, team engineering, and combustion research.</p><a className="text-link" href="#work">View selected work<Arrow /></a></div>
          </div>
          <div className="hero-bottom"><span>University of Connecticut</span><span>B.S. Mechanical Engineering · Expected May 2027</span><span className="hero-gpa">3.87 GPA</span><a href="#work" aria-label="Scroll to selected work"><span aria-hidden="true">↓</span></a></div>
        </section>
        <section className="selected-work page-width" id="work" aria-labelledby="work-title">
          <div className="section-heading"><h2 id="work-title">Selected Work<span className="work-count">{String(work.length).padStart(2, '0')} entries</span></h2><p>Internship, senior design, team engineering, and research.</p></div>
          <div className="work-list">{work.map(entry => <WorkItem key={entry.id} entry={entry} />)}</div>
        </section>
        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="page-width about-inner"><div className="about-title"><h2 id="about-title">About</h2></div><div className="about-copy"><p>I’m studying mechanical engineering at the University of Connecticut, with an interest in mechanical design and product development.</p><p>My experience includes comparing simulations with experimental data, checking designs with hand calculations, testing hardware, and contributing to technical reviews with engineering teams.</p><p>I’m interested in sustainability, clean technology, and renewable-energy hardware. These are directions I want to explore as I consider engineering roles, building on my experience in design, analysis, testing, and collaboration.</p></div><section className="skills" aria-labelledby="skills-title"><h2 id="skills-title">Technical Skills</h2><div className="skill-groups">{skillGroups.map(group => <div key={group.title}><h3>{group.title}</h3><p>{group.skills.join(' · ')}</p></div>)}</div></section></div>
        </section>
        <section className="resume-section page-width" id="resume" aria-labelledby="resume-title"><div><h2 id="resume-title">Education</h2></div><div className="education"><h3>B.S. Mechanical Engineering</h3><p>University of Connecticut</p><div><span>Expected May 2027</span><span>GPA 3.87</span></div>{profile.resume ? <a className="text-link" href={profile.resume} download>Download resume (PDF)<Arrow diagonal /></a> : <p className="pending-note">Downloadable resume to be added.</p>}</div></section>
        <section className="contact-section" id="contact" aria-labelledby="contact-title"><div className="page-width contact-inner"><div><h2 id="contact-title">Contact</h2><p>For opportunities in mechanical design and product development.</p></div><div className="contact-links">{profile.email && <a href={`mailto:${profile.email}`}>{profile.email}<Arrow diagonal /></a>}{profile.linkedIn && <a href={profile.linkedIn} target="_blank" rel="noreferrer">LinkedIn<Arrow diagonal /></a>}{!profile.email && !profile.linkedIn && <p className="contact-pending">Public contact details will be added here.</p>}</div></div></section>
      </main>
      <footer className="site-footer page-width"><span>© {new Date().getFullYear()} Alex Yuan</span><span>Mechanical engineering · University of Connecticut</span><a href="#top">Back to top<span aria-hidden="true">↑</span></a></footer>
    </>
  );
}
