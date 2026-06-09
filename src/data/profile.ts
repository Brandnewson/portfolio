// Profile content for the landing "Background" section. Edit here, not in markup.
export interface ExperienceItem {
  when: string;
  org: string;
  role: string;
  location: string;
}

export interface EducationItem {
  when: string;
  org: string;
  qual: string;
  // Short, separated achievement lines — NOT a paragraph, and NOT a restatement
  // of the qualification line above. Each renders on its own row.
  points: string[];
}

export interface StackRow {
  key: string;
  value: string;
}

export interface City {
  name: string;
  coord: string;
}

export const BIO =
  'I sit at the intersection of mechanical engineering and computer science. I want to build in that overlap, capitalising on both, and push toward physical AI, where learning systems meet real hardware and dynamics.';

export const EXPERIENCE: ExperienceItem[] = [
  { when: '2024 – 25', org: 'Jaguar TCS Racing', role: 'Junior Strategy & Software Engineer', location: 'Kidlington, UK' },
  { when: '2020 – 22', org: 'Republic of Singapore Navy', role: 'Marine Systems Specialist Technician', location: 'Singapore' },
  { when: '2019 – 20', org: 'Travelindr', role: 'Co-founder & CEO', location: 'Singapore' },
];

export const EDUCATION: EducationItem[] = [
  {
    when: '2022 – 26',
    org: 'University of Leeds',
    qual: 'BSc Computer Science, Year in Industry · Leeds, UK',
    points: [
      'Predicted first-class',
      'Formula Student Performance & Simulation sub-team lead',
    ],
  },
  {
    when: '2017 – 20',
    org: 'Ngee Ann Polytechnic',
    qual: 'Diploma, Mechanical Engineering · Singapore',
    points: [
      'Designed gearbox to load, speed and dimensional spec in CAD',
      'Graduated with Good Progress and School of Engineering Merit awards',
    ],
  },
];

export const STACK: StackRow[] = [
  { key: 'Languages', value: 'Python, TypeScript, C++, Rust, MATLAB, Java' },
  { key: 'AI / ML', value: 'PyTorch, RAG, Claude Code, Codex, agentic harnesses, NumPy / SciPy' },
  { key: 'Web / Infra', value: 'React, Node, FastAPI / Flask, MongoDB, AWS, Azure, Docker, CI/CD' },
  { key: 'Tools', value: 'Git, Docker, Azure DevOps, Plotly' },
];

export const ROLES = ['Forward-Deployed Engineer', 'Applied AI Engineer', 'Solutions Architect', 'Full-stack Engineer'];

export const CITIES: City[] = [
  { name: 'London', coord: '51.5°N · 0.1°W' },
  { name: 'New York', coord: '40.7°N · 74.0°W' },
];

export const AVAILABLE = 'SEP 2026';
