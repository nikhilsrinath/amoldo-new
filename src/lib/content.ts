/**
 * Single source of truth for site copy and data.
 * Do not add invented results, people, phone numbers or addresses.
 */

export const CONTACT = {
  email: "amoldotechnologies@gmail.com",
  location: "Chennai, Tamil Nadu, India",
};

/** Hero statement, one array per line. The full stop is the A mark's dot, drawn by the hero. */
export const HERO_LINE = [
  ["We", "put", "brands"],
  ["where", "growth", "is"],
] as const;

export const STATS = [
  { value: 2021, prefix: "Since ", suffix: "", label: "Operating" },
  { value: 40, prefix: "", suffix: "+", label: "Projects" },
  { value: 10, prefix: "", suffix: "+", label: "Industries served" },
  { value: 100, prefix: "", suffix: "+", label: "Happy clients" },
];

export const VALUES = [
  { title: "Excellence", line: "Quality in every strategy, asset and campaign." },
  { title: "Collaboration", line: "Open, transparent communication." },
  { title: "Innovation", line: "Learning, testing, improving." },
];

export const FOCUS_AREAS = [
  "Positioning and messaging",
  "Digital strategy",
  "Content and creative",
  "Audience development",
  "Performance marketing",
  "Reputation and credibility",
  "Continuous optimisation",
];

/**
 * "From attention to growth" — the brand owner’s journey, one chapter per focus area.
 * Lines are written in the second person; substance follows the profile’s focus list.
 */
export const JOURNEY = [
  { area: "Positioning and messaging", short: "Position", status: "Clear", line: "First, you become unmistakable.", sub: "We clarify what you stand for and how you say it, so you stop blending in." },
  { area: "Digital strategy", short: "Strategy", status: "Planned", line: "Then you choose your ground.", sub: "The right channels, campaigns and content priorities, picked on purpose." },
  { area: "Content and creative", short: "Content", status: "Speaking", line: "Now you start speaking.", sub: "Communication that earns attention and reinforces who you are." },
  { area: "Audience development", short: "Audience", status: "Noticed", line: "The right people turn their heads.", sub: "Reaching relevant audiences and building engagement over time." },
  { area: "Performance marketing", short: "Performance", status: "Converting", line: "Attention becomes action.", sub: "Paid campaigns and analytics, pointed at your business objectives." },
  { area: "Reputation and credibility", short: "Reputation", status: "Trusted", line: "People start vouching for you.", sub: "Strengthening how your brand is perceived across every digital channel." },
  { area: "Continuous optimisation", short: "Optimise", status: "Growing", line: "And it keeps getting better.", sub: "We review what’s working and improve the approach on evidence, cycle after cycle." },
] as const;

export const SERVICES = [
  {
    title: "Digital Marketing Strategy",
    line: "One coordinated plan built around your business goals.",
    tags: ["Audience", "Channels", "Campaign direction", "KPIs"],
  },
  {
    title: "SEO",
    line: "Be found by the people already searching for you.",
    tags: ["Keyword research", "On-page", "Technical SEO", "Content"],
  },
  {
    title: "SEM & Paid Ads",
    line: "Reach buyers at the moment of intent on Google Ads and Bing Ads.",
    tags: ["Keyword planning", "Ad creative", "Bids & budget", "Reporting"],
  },
  {
    title: "Social Media Optimisation",
    line: "Profiles that look consistent, credible and easy to find.",
    tags: ["Profiles", "Consistency", "Hashtags", "Engagement"],
  },
  {
    title: "Social Media Marketing",
    line: "Content and campaigns your audience actually stops for.",
    tags: ["Strategy", "Creatives", "Social ads", "Community"],
  },
  {
    title: "Content Marketing",
    line: "Useful content that moves people from awareness to decision.",
    tags: ["Direction", "Messaging", "Search content", "Social content"],
  },
  {
    title: "Email Marketing",
    line: "The right message to the right segment, at the right time.",
    tags: ["Segmentation", "Content", "Execution", "Tracking"],
  },
  {
    title: "Online Reputation Management",
    line: "Shape how your brand is seen across reviews and social.",
    tags: ["Monitoring", "Review replies", "Positive content", "Crisis PR"],
  },
  {
    title: "Analytics & Optimisation",
    line: "Measure what works. Improve what doesn't.",
    tags: ["Campaigns", "Audience", "Conversions", "Recommendations"],
  },
];

export const CREATIVE_CAPABILITIES = [
  "Graphic design",
  "Social creatives",
  "Campaign visuals",
  "Web & landing pages",
  "UX/UI design",
  "Multimedia",
];

/**
 * Creative showcase (public/creatives). To add a piece, drop the file in
 * public/creatives and add one line here with its real pixel size — the bento
 * grid re-packs itself around whatever is in this list, in this order.
 * `poster` (optional, videos only) is a still shown before the video loads.
 */
export type CreativeItem = {
  src: string;
  type: "image" | "video";
  width: number;
  height: number;
  client: string;
  kind: string;
  poster?: string;
};

export const CREATIVES: CreativeItem[] = [
  { type: "video", src: "/creatives/StartupBuddy_Launch_v2_1080p.mp4", width: 1920, height: 1080, client: "StartupBuddy", kind: "Launch film" },
  { type: "image", src: "/creatives/StartupBuddy-Poster.png", width: 2160, height: 2700, client: "StartupBuddy", kind: "Launch poster" },
  { type: "image", src: "/creatives/wefie-poster.png", width: 2160, height: 2700, client: "Wefie", kind: "Campaign poster" },
  { type: "video", src: "/creatives/nikhil-srinath-intro.mp4", width: 1920, height: 1080, client: "Nikhil Srinath", kind: "Personal brand film" },
];

/** The four beats of the scroll-scrubbed phone in the Technology section. */
export const TECH_STAGES = [
  { t: "Scope", d: "Only what the plan needs: a page, a store, an app or an integration." },
  { t: "Build", d: "Websites, landing pages, e-commerce and apps, designed and developed in-house." },
  { t: "Connect", d: "Payments, CRM, pixels and analytics wired straight into your campaigns." },
  { t: "Support", d: "Hosting, updates, fixes and monitoring, handled by us after launch." },
];

export const PROCESS = [
  { n: "01", title: "Discovery", focus: "Understand the business", icon: "search" },
  { n: "02", title: "Strategy", focus: "Decide the direction", icon: "compass" },
  { n: "03", title: "Creative & planning", focus: "Prepare the communication", icon: "palette" },
  { n: "04", title: "Execution", focus: "Put the strategy into action", icon: "rocket" },
  { n: "05", title: "Measurement", focus: "Understand performance", icon: "chart" },
  { n: "06", title: "Optimisation", focus: "Improve outcomes", icon: "loop" },
] as const;

export const PRINCIPLES = [
  "Understand the business first",
  "Align with your positioning",
  "Communicate clearly",
  "Build for the long term",
];

/** Real project visuals supplied by Amoldo Technologies (public/clients). */
export const WORK = [
  { src: "/clients/volvo-tamil-nadu.png", client: "Volvo (Tamil Nadu)", kind: "Campaign poster" },
  { src: "/clients/mylabconnect.png", client: "MyLabConnect", kind: "Website" },
  { src: "/clients/the-happiness-project.png", client: "The Happiness Project", kind: "App" },
  { src: "/clients/altek-beissel-needles.png", client: "Altek Beissel Needles", kind: "Brand campaign" },
  { src: "/clients/mind-and-mom.png", client: "Mind and Mom", kind: "E-commerce" },
  { src: "/clients/abrb-e-school.png", client: "ABRB e-School", kind: "App" },
  { src: "/clients/selvi-school-of-sonology.png", client: "Selvi School of Sonology", kind: "Website" },
  { src: "/clients/western-airducts-india.png", client: "Western Air-ducts India", kind: "Print collateral" },
  { src: "/clients/your-perfect-stitches.png", client: "Your Perfect Stitches", kind: "E-commerce" },
];

export const CASES: {
  client: string;
  sector: string;
  focus: string;
  line: string;
  facts?: string[];
  /** Project image (portrait, 4:5). */
  image: string;
  implementation?: boolean;
}[] = [
  {
    client: "Volvo, Tamil Nadu",
    sector: "Automotive",
    focus: "Digital marketing",
    line: "A pitch for newer models and the growing electric lineup in Chennai.",
    facts: ["Personality", "Sustainability", "Safety", "Lifestyle fit"],
    image: "/clients/volvo-tamil-nadu.png",
  },
  {
    client: "Altek Beissel Needles",
    sector: "Manufacturing",
    focus: "SMM · SMO · ORM",
    line: "A global social strategy for industrial customers.",
    facts: ["1,000+ needle types", "155 checks per needle", "44+ countries"],
    image: "/clients/altek-beissel-needles.png",
  },
  {
    client: "Universal Organics",
    sector: "Agriculture",
    focus: "E-commerce · SEO · Social",
    line: "A product showcase for a worldwide exporter of bio-organic fertilisers and natural oils.",
    image: "/clients/universalorganics.jpg",
  },
  {
    client: "Dentkin",
    sector: "Dental healthcare",
    focus: "Cloud web application",
    line: "Connecting dental professionals, labs and patients in real time.",
    image: "/clients/dentkin.jpg",
    implementation: true,
  },
  {
    client: "Period Pal by LAIQA",
    sector: "Women's healthcare",
    focus: "Mobile & web app",
    line: "Cycle, mood, sleep and nutrition tracking with expert content.",
    image: "/clients/periodpalbylaiqa.jpg",
    implementation: true,
  },
  {
    client: "The Happiness Project",
    sector: "Mental wellness",
    focus: "Well-being platform",
    line: "Personalised coaching, counselling and daily exercises.",
    image: "/clients/the-happiness-project.png",
    implementation: true,
  },
];

export const WHY = [
  { title: "Marketing-led thinking", line: "Strategy first, always." },
  { title: "Integrated execution", line: "Every channel, one plan." },
  { title: "Data-informed decisions", line: "Evidence over guesswork." },
  { title: "Consistent communication", line: "One voice everywhere." },
  { title: "Tech when needed", line: "Built only if it serves growth." },
  { title: "Long-term partnership", line: "We grow with you." },
];

export const ASSESSMENT_ITEMS = [
  { title: "Where you stand", line: "An honest review of your digital presence." },
  { title: "What you're lacking", line: "The gaps holding your brand back." },
  { title: "How to position yourself", line: "A clear direction to stand out." },
];

export const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
];
