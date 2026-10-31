export interface WorkMedia {
  /** Put optimized, approved files in public/media and use /media/... URLs. */
  src: string;
  alt: string;
  caption: string;
  /** Optional video: the image above is used as its poster. Never autoplay. */
  videoSrc?: string;
}

export interface WorkEntry {
  id: string;
  number: string;
  title: string;
  context: string;
  dates: string;
  summary: string;
  additionalSummary?: string;
  tags: string[];
  kind: 'featured' | 'ongoing' | 'experience' | 'research';
  aside: { title: string; description: string };
  sections: { title: string; paragraphs: string[] }[];
  note?: string;
  media?: WorkMedia;
}

/** Contact destinations are edited separately in src/contact.json. */
export const profile = {
  name: 'Alex Yuan',
};

export const introduction = [
  'I am a fast-tracked Mechanical Engineering student at the University of Connecticut, completing my B.S. in three years (Expected May 2027). My work connects hardware and sustainable infrastructure with conceptual R&D and physical manufacturing.',
  'I am actively seeking 2027 engineering rotational programs across the U.S., as well as direct-hire mechanical design roles, with a strong interest in relocating to Colorado.',
  'I thrive on tackling complex challenges across the product lifecycle, bringing a strong foundation in mechanical design, cross-functional leadership, and hands-on testing and analysis.',
];

export const aboutParagraphs = [
  'I am a Mechanical Engineering student at the University of Connecticut completing my degree in just three years by May 2027. My academic and professional background is built on a strong foundation of mechanical design, physical prototyping, and hardware development.',
  'My experience bridges conceptual research with physical manufacturing. I combine advanced CAD, fluid and structural simulation, physical hardware fabrication, and technical design reviews to solve complex engineering problems.',
  'I am deeply passionate about clean energy technology and the global energy transition. I am actively seeking 2027 engineering rotational programs nationwide, as well as direct-hire mechanical design roles in major engineering hubs where I can work alongside driven, like-minded teams.',
];

/** Latest copy from Alex's annotated portfolio review. */
export const work: WorkEntry[] = [
  {
    id: 'ultrasonic', number: '01', kind: 'ongoing',
    title: 'Ultrasonic Invasive-Plant Control',
    context: 'UConn / Windham Water Works · Senior Design Team Manager',
    dates: 'August 2026–present',
    summary: 'Designing and fabricating an unmanned surface vehicle for ultrasonic control of invasive-plant growth. As Team Manager, I lead the translation of environmental constraints and acoustic requirements into a physical system architecture—leveraging mechanical conceptualization, applied research, and cross-functional stakeholder coordination.',
    tags: ['System design', 'Literature research', 'Trade studies', 'Team coordination'],
    aside: { title: 'Current status', description: 'Ongoing, preliminary concept development: a stem-positioning grate paired with downward-facing ultrasonic transducers. We are currently finalizing the physical test apparatus design to transition into active hardware validation.' },
    sections: [
      { title: 'Requirements and environmental constraints', paragraphs: [
        'Our senior design team is developing an unmanned surface vehicle for ultrasonic control of invasive aquatic plants with Windham Water Works. My work translates acoustic-treatment requirements and environmental constraints into preliminary system design.',
        'I am researching ultrasonic cavitation and its potential effects on aquatic organisms. I use papers and professional resources to support concept development and design decisions; environmental safety remains a question to investigate.',
      ] },
      { title: 'Treatment concept and team coordination', paragraphs: [
        'I am developing a treatment concept that pairs a stem-positioning grate with downward-facing transducers.',
        'As team manager, I manage sponsor and faculty communications and facilitate technical discussions about requirements, open questions, and next steps.',
      ] },
      { title: 'Current project status', paragraphs: [
        'This is ongoing, preliminary design work. Successful treatment, environmental safety, completed modeling, and a validated prototype have not yet been established.',
      ] },
    ],
  },
  {
    id: 'aiaa', number: '02', kind: 'experience',
    title: 'Rocket Engineering & Team Leadership',
    context: 'UConn AIAA · Executive Board Member | Technical Lead',
    dates: 'September 2024–present',
    summary: 'Serving a dual role for a 200+ member organization. On the AIAA Executive Board, I coordinate club-wide outreach, recruitment, and corporate sponsorships. Concurrently, as Technical Lead for the Rocketry team (one of AIAA’s two core divisions), I drive propulsion and structural R&D, mentor student engineers, and bridge the gap between complex fluid modeling and physical hardware fabrication.',
    tags: ['Engineering leadership', 'Student project mentoring', 'Fluid system modeling (Simulink)'],
    aside: { title: 'Dual Leadership Role', description: 'Operating in a dual capacity: managing Lockheed Martin corporate communications and operations for the broader AIAA chapter, while simultaneously serving as Technical Lead for the Rocketry division to direct fluid system modeling and propulsion hardware design.' },
    sections: [
      { title: 'Sponsorship, outreach, and recruitment', paragraphs: [
        'I coordinate communications among club leadership, students, and corporate sponsors, supporting events, member outreach, and sponsorship funding from Lockheed Martin. I also create Instagram and LinkedIn posts to share club activities and promote opportunities for students to get involved.',
        'To give interested students a clearer path onto the rocket team, I initiated a structured application and selection process. I created and promoted the application, coordinated applicant review, and attracted more than ten applicants.',
      ] },
      { title: 'Project coordination & mentoring', paragraphs: [
        'As Rocketry Technical Lead, I helped plan student project assignments and team-lead support. I now mentor project members, helping them work through design questions, review progress, and identify next steps.',
      ] },
      { title: 'Rocket feed-system modeling', paragraphs: [
        'A teammate and I jointly developed a model of the rocket’s nitrous oxide and ethanol feed systems. We worked closely throughout the process, identifying the plumbing components and representing their flow resistance in a network extending from the propellant tanks through the combustion chamber.',
        'We used Simulink to evaluate pressure losses through the feed systems and inform orifice sizing. Both of us contributed across the component definition, resistance-network development, and modeling work.',
      ] },
      { title: 'Additional technical work', paragraphs: [
        'I have also contributed CFD analysis, participated in team hot-fire tests, and provided design feedback on student-developed hardware.',
      ] },
    ],
  },
  {
    id: 'combustion', number: '03', kind: 'research',
    title: 'Sustainable-Fuel Combustion Research',
    context: 'UConn · Undergraduate Research Assistant',
    dates: 'October 2025–May 2026',
    summary: 'Supported sustainable-fuel combustion research through hands-on experimental testing, pressure-system calibration, and LabVIEW data analysis. Working alongside graduate researchers, I bridged physical flame data with simulation models and actively proposed, designed, and fabricated physical test-stand hardware to improve experimental stability and data accuracy.',
    tags: ['LabVIEW', 'ANSYS Fluent', 'SolidWorks (CAD)', 'Experimental Analysis'],
    aside: { title: 'Research scope', description: 'Identified and solved a critical instability issue in a premixed-flame experiment. To prevent unwanted flame propagation and soot-inducing air currents, I proposed and fabricated a secondary lateral mesh configuration. This mechanical modification improved observed flame stability for high-fidelity data collection.' },
    sections: [
      { title: 'Data Analysis & Simulation', paragraphs: [
        'I supported premixed-flame combustion research by characterizing fluid dynamics and evaluating fuel-oxidizer interactions at the nozzle outlet. To support the validation of combustion models, I executed hands-on experimental testing, processing and analyzing the resulting data in LabVIEW. I also compared this physical flame data against ANSYS Fluent simulations to evaluate the accuracy of our theoretical combustion profiles.',
      ] },
      { title: 'Hardware Fabrication & Equipment Calibration', paragraphs: [
        'I was responsible for the physical setup and accuracy of the test stand, which included rigorous pressure-system calibration using precision gauges and data collection via gas chromatography-mass spectrometry (GC/MS). During physical trials, I identified a recurring instability where flames propagated around the primary heat-dissipation mesh, causing unwanted air currents. To solve this, I proposed and fabricated a mechanical modification with graduate-student guidance: installing secondary, lateral meshes to act as a physical boundary. This layered configuration successfully stabilized the flame, improving the quality of our experimental data collection.',
      ] },
    ],
  },
  {
    id: 'manifold', number: '04', kind: 'featured',
    title: 'Water-Electrolysis Manifold Redesign',
    context: 'HyAxiom · Design Engineer Intern',
    dates: 'June–August 2026',
    summary: 'Owned conceptual and detailed mechanical redesign of a water-electrolysis manifold, including flow analysis, structural checks, and production drawings. The redesign improved flow distribution by a simulated 30%.',
    additionalSummary: 'Separate internship contributions: gasket pressure testing and VBA data-extraction automation that reduced processing time by 80%.',
    tags: ['Mechanical design', 'CFD & FEA (PTC Creo)', 'Geometric Dimensioning & Tolerancing (GD&T)', 'Visual Basic for Applications (VBA)', 'Windchill (PLM)'],
    aside: { title: 'Design scope', description: 'Conceptual design and trade studies, simulation and hand calculations, detailed drawings, and engineering release. This work is under NDA; no proprietary imagery is shown.' },
    sections: [
      { title: 'Flow analysis and mechanical redesign', paragraphs: [
        'The manifold redesign focused on improving flow distribution while meeting existing theoretical pressure-drop targets. I owned the conceptual and detailed mechanical redesign, modeled the geometry in Creo, and drove trade studies and technical design reviews with cross-functional engineering teams.',
        'I developed single-phase CFD simulations in Creo Flow Analysis to approximate multiphase conditions. The redesign improved flow distribution by a simulated 30%; the simulation also matched the existing theoretical pressure-drop targets.',
      ] },
      { title: 'Structural checks and production documentation', paragraphs: [
        'I used DFMEA to guide structural analysis in Creo Simulate and checked the simulated mechanical integrity with first-principles hand calculations. These checks complemented the flow analysis without substituting for physical validation.',
        'I produced 2D production drawings with GD&T for critical feature locations and mating tolerances, managed manifold engineering-release workflows in Windchill, and defined and released COTS component specifications.',
      ] },
      { title: 'Additional internship contributions', paragraphs: [
        'In separate internship work, I assembled and tested hardware to validate gasket sealing integrity under pressure. That testing did not physically validate the manifold’s simulated flow improvement.',
        'I also created VBA automation for experimental data extraction, reducing processing time by 80% for the broader testing team.',
      ] },
    ],
    note: 'Company work is under NDA. No proprietary visuals or geometry are shown. The 30% flow improvement is a simulation result.',
  },
];

export const skillGroups = [
  { title: 'Design & documentation', skills: ['Creo', 'SolidWorks', 'Fusion 360', 'GD&T · ASME Y14.5', 'Windchill PLM'] },
  { title: 'Analysis & programming', skills: ['Creo Flow Analysis', 'Creo Simulate', 'ANSYS Fluent', 'ANSYS Mechanical', 'MATLAB', 'Python', 'Excel VBA'] },
  { title: 'Communication & tools', skills: ['Microsoft Office', 'Mandarin Chinese · fluent'] },
];
