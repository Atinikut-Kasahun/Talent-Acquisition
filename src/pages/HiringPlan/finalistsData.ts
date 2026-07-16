// Mock "finalist shortlist" data for the Managing Director dashboard's
// Executive Review carousel. There's no backend endpoint for finalist
// shortlists/interview panel notes yet — this illustrates the UI pattern.
// Swap for a real fetch once a finalists/interview-scoring endpoint exists.

export interface Finalist {
  id: string;
  name: string;
  roleAppliedFor: string;
  department: string;
  recommendationScore: number; // 0-100, hiring manager's top-line score
  photo?: string;
  resumeHighlights: string[];
  panelNotes: string;
}

export const MOCK_FINALISTS: Finalist[] = [
  {
    id: "FIN-001",
    name: "Selamawit Bekele",
    roleAppliedFor: "Senior React Developer",
    department: "Engineering",
    recommendationScore: 92,
    resumeHighlights: [
      "6 years building production React/TypeScript applications",
      "Led migration of a legacy Angular app to React at previous company",
      "Strong system design and mentorship track record",
    ],
    panelNotes: "Unanimous strong hire from the panel. Excellent communication and clearly the strongest technical interview this quarter.",
  },
  {
    id: "FIN-002",
    name: "Robel Amanuel",
    roleAppliedFor: "Enterprise Account Executive",
    department: "Sales",
    recommendationScore: 87,
    resumeHighlights: [
      "Consistently exceeded enterprise sales quota (120%+ for 3 years running)",
      "Existing relationships with 4 target accounts on our current pipeline",
      "Strong references from two former sales leaders",
    ],
    panelNotes: "Panel recommends hire. Slightly light on very large (7-figure) deal experience, but strong overall fit and network.",
  },
  {
    id: "FIN-003",
    name: "Hana Girma",
    roleAppliedFor: "Finance Officer",
    department: "Finance",
    recommendationScore: 78,
    resumeHighlights: [
      "CPA with 4 years in financial reporting and compliance",
      "Experience with multi-entity consolidation",
      "Comfortable presenting directly to leadership",
    ],
    panelNotes: "Solid hire. One panelist flagged limited exposure to our specific ERP stack — recommend a short ramp-up plan if hired.",
  },
  {
    id: "FIN-004",
    name: "Yonas Tesfaye",
    roleAppliedFor: "DevOps Engineer",
    department: "Engineering",
    recommendationScore: 84,
    resumeHighlights: [
      "Built CI/CD pipelines from scratch at two prior startups",
      "AWS and Kubernetes certified",
      "On-call incident response experience",
    ],
    panelNotes: "Strong hire. Panel liked his calm, methodical approach to a live incident-response exercise during the interview.",
  },
];
