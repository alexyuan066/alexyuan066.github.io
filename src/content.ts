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

/** Keep absent destinations null. The interface shows links only when supplied. */
export const profile = {
  name: 'Alex Yuan',
  email: null as string | null,
  linkedIn: null as string | null,
  resume: null as string | null,
};

/** Facts from Alex's brief. Review confidential internship copy before publishing. */
export const work: WorkEntry[] = [
  {
    id: 'manifold', number: '01', kind: 'featured',
    title: 'Water-Electrolysis Manifold Redesign',
    context: 'HyAxiom · Design Engineer Intern',
    dates: 'June–August 2026',
    summary: 'Owned conceptual and detailed mechanical redesign of a water-electrolysis manifold, including flow analysis, structural checks, and production drawings. The redesign improved flow distribution by a simulated 30%.',
    additionalSummary: 'Separate internship contributions: gasket pressure testing and VBA data-extraction automation that reduced processing time by 80%.',
    tags: ['Mechanical design', 'CFD & FEA', 'GD&T'],
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
  {
    id: 'ultrasonic', number: '02', kind: 'ongoing',
    title: 'Ultrasonic Invasive-Plant Control',
    context: 'UConn / Windham Water Works · Senior Design Team Manager',
    dates: 'August 2026–present',
    summary: 'Developing a preliminary treatment concept for an unmanned surface vehicle, translating acoustic requirements and environmental constraints into system design while coordinating the team, sponsor, and faculty.',
    tags: ['System design', 'Literature research', 'Team coordination'],
    aside: { title: 'Current status', description: 'Ongoing, preliminary concept development: a stem-positioning grate paired with downward-facing ultrasonic transducers.' },
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
    id: 'aiaa', number: '03', kind: 'experience',
    title: 'Rocket Engineering & Team Leadership',
    context: 'UConn AIAA · Executive Board Member',
    dates: 'September 2024–present',
    summary: 'Secured corporate sponsorship, led targeted recruitment, contributed technical consultation, and participated in team hot-fire tests.',
    tags: ['Engineering leadership', 'Design review', 'Team testing'],
    aside: { title: 'Leadership contributions', description: 'Secured Lockheed Martin sponsorship and organized events and outreach for a club serving 200+ student members.' },
    sections: [
      { title: 'Sponsorship, outreach, and recruitment', paragraphs: [
        'I secured Lockheed Martin corporate sponsorship and coordinated the associated documentation and communications. I also organized events and outreach for the UConn AIAA club, which serves 200+ student members.',
        'For the VTVL rocket team, I led targeted recruitment to address electrical-engineering and computer-science skill gaps and support project succession. I created and promoted an application that attracted 7+ quality applicants.',
      ] },
      { title: 'Selected technical contributions', paragraphs: [
        'I contributed technical consultation and some CFD work, and participated in team hot-fire tests. These were contributions to the team’s work; I did not own the overall rocket design.',
        'A teammate asked me to review a 3D-printed connector between a landing leg and the rocket body. Their original concept used one bolt. I recommended a two-fastener arrangement to address rotation and potentially improve load carrying.',
        'The CAD and connector design belong to my teammate. They plan to adopt the recommendation; updated CAD and testing are pending, and a strength improvement has not been verified.',
      ] },
    ],
  },
  {
    id: 'combustion', number: '04', kind: 'research',
    title: 'Sustainable-Fuel Combustion Research',
    context: 'UConn · Undergraduate Research Assistant',
    dates: 'October 2025–May 2026',
    summary: 'Compared experimental laminar-flame data with ANSYS Fluent simulations and automated molecular-concentration analysis in MATLAB to support combustion-model validation.',
    tags: ['ANSYS Fluent', 'MATLAB', 'Experimental analysis'],
    aside: { title: 'Research scope', description: 'Analyzed laminar-flame combustion and evaluated fuel–oxidizer interactions by comparing experimental data with ANSYS Fluent simulations.' },
    sections: [
      { title: 'Experimental data and simulation', paragraphs: [
        'As an undergraduate research assistant in UConn’s Department of Mechanical Engineering, I analyzed laminar-flame combustion for sustainable-fuel research. I compared experimental flame data against ANSYS Fluent simulations to evaluate fuel–oxidizer interactions.',
        'I automated extraction and comparative analysis of molecular-concentration datasets in MATLAB to support combustion-model validation. I also contributed a physical test-stand improvement to stabilize the flame; the exact modification and a quantified effect are not documented here.',
      ] },
    ],
  },
];

export const skillGroups = [
  { title: 'Design & documentation', skills: ['Creo', 'SolidWorks', 'Fusion 360', 'GD&T · ASME Y14.5', 'Windchill PLM'] },
  { title: 'Analysis & programming', skills: ['Creo Flow Analysis', 'Creo Simulate', 'ANSYS Fluent', 'MATLAB', 'Python', 'VBA'] },
  { title: 'Communication & tools', skills: ['Microsoft Office', 'Mandarin Chinese · fluent'] },
];
