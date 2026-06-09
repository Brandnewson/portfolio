// Breadth list for the home "Other projects" collapsible. Curated to 5 distinct
// domains (see docs/superpowers/specs/2026-06-09-home-ia-design.md). Copy is
// pre-cleaned of colons, semicolons, and em-dashes per the project rules.
export interface OtherProject {
  title: string;
  stack: string[];
  oneLiner: string;
  bullets: string[];
}

export const OTHER_PROJECTS: OtherProject[] = [
  {
    title: 'Aerodynamic Concept RAG Analyser',
    stack: ['python', 'rag', 'vector db', 'llm', 'mcp', 'fastapi'],
    oneLiner: 'A RAG pipeline that ingests arXiv aerodynamics papers into a vector database for LLM evaluation.',
    bullets: [
      'Assembled a RAG pipeline ingesting arXiv aerodynamics papers into a vector database for LLM evaluation',
      'Integrated MCP tooling to extend agent retrieval, enabling dynamic paper ingestion and concept refinement',
    ],
  },
  {
    title: 'Azure Serverless Distributed Pipeline',
    stack: ['python', 'azure functions', 'blob', 'queue', 'serverless'],
    oneLiner: 'An event-driven distributed pipeline on Azure for serverless analysis at scale.',
    bullets: [
      'Designed a distributed Azure pipeline using Functions, Blob and Queue Storage for event-driven analysis',
      'Implemented serverless functions and load-tested HTTP triggers to validate throughput and latency at scale',
    ],
  },
  {
    title: 'E-commerce Shopify Store',
    stack: ['shopify', 'facebook ads', 'photoshop', 'premiere pro'],
    oneLiner: 'Built and marketed e-commerce brands, optimising conversion from data and heatmaps.',
    bullets: [
      'Increased conversions by 10 percent by adapting the add-to-cart button position from cursor heatmaps',
      'Built an efficient sales funnel from data insights and trend targeting',
      'Developed and marketed multiple store brands with attention-grabbing creatives',
    ],
  },
  {
    title: 'Formula Student ICE Data Acquisition System',
    stack: ['c++', 'arduino', 'git'],
    oneLiner: 'A real-time GPS telemetry pipeline from Arduino Teensy to live engineering dashboards.',
    bullets: [
      'Built a real-time GPS telemetry pipeline from Arduino Teensy to dashboard and wireless engineering displays',
      'Honed collaborative software practice with Git and code reviews',
    ],
  },
  {
    title: '2D CFD Radiator Optimisation Simulator',
    stack: ['rust', 'numerical methods', 'parallelism'],
    oneLiner: 'A 2D incompressible fluid solver in Rust that optimises radiator angle for cooling and drag.',
    bullets: [
      'Developed a 2D incompressible fluid solver analysing radiator angle effects on cooling, pressure drop and drag',
      'Automated batch simulations and visualisations to optimise radiator design with parallel processing',
    ],
  },
  {
    title: 'Travelindr',
    stack: ['agile', 'a/b testing', 'product strategy', 'fundraising'],
    oneLiner: 'Co-founder and CEO of a group travel-itinerary generator, taken from idea to an incubated MVP.',
    bullets: [
      'Founded Travelindr, a group travel-itinerary generator, in a small team implementing Agile practices',
      'Communicated core company strategy to the team, backed by qualitative focus group data using A/B testing',
      'Pitched to investors, reached Minimum Viable Product (MVP) status, and was incubated in an esteemed multi-national company',
    ],
  },
];
