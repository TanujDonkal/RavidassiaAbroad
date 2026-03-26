export const EXAM_FAMILIES = {
  celpip: {
    slug: "celpip",
    name: "CELPIP",
    shortName: "CELPIP",
    accent: "var(--students-celpip)",
    description:
      "Practice Canadian English proficiency tasks with a full mock flow across listening, reading, writing, and speaking.",
    badge: "Fully live",
    status: "available",
    isImplemented: true,
    disclaimer:
      "This is an independent practice platform and is not affiliated with, endorsed by, or produced by CELPIP or Paragon Testing Enterprises.",
    sections: [
      { slug: "listening", name: "Listening", detail: "Audio-based prompts and note-driven multiple choice." },
      { slug: "reading", name: "Reading", detail: "Passages, single-select, and multi-select objective practice." },
      { slug: "writing", name: "Writing", detail: "Timed typed responses with autosave and future scoring hooks." },
      { slug: "speaking", name: "Speaking", detail: "Prompt-led speaking practice with prep and response timing." },
    ],
    variants: [
      {
        slug: "general",
        name: "CELPIP General",
        audience: "Study, work, and permanent residency pathways",
        availability: "Live now",
      },
      {
        slug: "general-ls",
        name: "CELPIP General LS",
        audience: "Listening and speaking only",
        availability: "Architecture ready",
      },
    ],
  },
  ielts: {
    slug: "ielts",
    name: "IELTS",
    shortName: "IELTS",
    accent: "var(--students-ielts)",
    description:
      "Explore the future IELTS practice hub for academic and general training pathways.",
    badge: "Scaffolded",
    status: "coming_soon",
    isImplemented: false,
    disclaimer:
      "This is an independent practice platform and is not affiliated with, endorsed by, or produced by IELTS or its owners.",
    sections: [
      { slug: "listening", name: "Listening", detail: "Section structure ready for future content." },
      { slug: "reading", name: "Reading", detail: "Academic and General-ready architecture." },
      { slug: "writing", name: "Writing", detail: "Timed response workflow prepared." },
      { slug: "speaking", name: "Speaking", detail: "Interview-style speaking support planned." },
    ],
    variants: [
      { slug: "academic", name: "Academic", audience: "Study abroad and higher education", availability: "Coming soon" },
      { slug: "general", name: "General Training", audience: "Migration and work pathways", availability: "Coming soon" },
    ],
  },
  pte: {
    slug: "pte",
    name: "PTE",
    shortName: "PTE",
    accent: "var(--students-pte)",
    description:
      "See the future PTE practice structure with reusable routing, variants, and test engine support.",
    badge: "Scaffolded",
    status: "coming_soon",
    isImplemented: false,
    disclaimer:
      "This is an independent practice platform and is not affiliated with, endorsed by, or produced by Pearson PTE or its owners.",
    sections: [
      { slug: "speaking-writing", name: "Speaking & Writing", detail: "Combined-skills engine support planned." },
      { slug: "reading", name: "Reading", detail: "Objective question review architecture ready." },
      { slug: "listening", name: "Listening", detail: "Audio-driven runner foundation reusable here later." },
    ],
    variants: [
      { slug: "academic", name: "PTE Academic", audience: "Primary study-abroad pathway", availability: "Coming soon" },
      { slug: "core", name: "PTE Core", audience: "Immigration-focused pathway", availability: "Coming soon" },
    ],
  },
};

export function getExamFamily(slug) {
  return EXAM_FAMILIES[slug] || null;
}
