export type WorkflowCategory = 'finance' | 'legal' | 'operations' | 'compliance' | 'research';

export interface WorkflowMetric {
  label: string;
  value: string;
}

export interface WorkflowEvent {
  id: string;
  title: string;
  summary: string;
  context: string;
  status: string;
  actor: string;
  category: WorkflowCategory;
  startedAt: string;
  slaMinutes?: number;
  tags: string[];
  metrics: WorkflowMetric[];
  details: string;
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const initialWorkflowEvents: WorkflowEvent[] = [
  {
    id: 'evt-finance-001',
    title: 'Invoice bundle classified',
    summary: 'Auto-routed 24 invoices to Accounts Payable with approvals captured.',
    context: 'Finance lane',
    status: 'APPROVED',
    actor: 'Halo Automations',
    category: 'finance',
    startedAt: minutesAgo(6),
    slaMinutes: 30,
    tags: ['Batch intake', 'Finance'],
    metrics: [
      { label: 'Documents', value: '24' },
      { label: 'Confidence', value: '97%' },
    ],
    details:
      'Invoices from North America were normalized, enriched with cost centers, and routed to the AP lane. All exception rules passed and approvals were filed to the audit ledger.',
  },
  {
    id: 'evt-legal-002',
    title: 'Contract summary generated',
    summary: 'Legal co-pilot drafted an executive summary with key risks highlighted.',
    context: 'Legal co-pilot',
    status: 'SYNCED TO CRM',
    actor: 'Halo Co-Pilot',
    category: 'legal',
    startedAt: minutesAgo(12),
    slaMinutes: 20,
    tags: ['Summaries', 'Legal'],
    metrics: [
      { label: 'Clauses Indexed', value: '132' },
      { label: 'Reviewers', value: '3' },
    ],
    details:
      'The AI-generated executive summary was published to Salesforce with clause-level annotations. Risk language was flagged for human review and approved without changes.',
  },
  {
    id: 'evt-compliance-003',
    title: 'PII redaction completed',
    summary: 'Compliance guard removed 128 detected PII fields prior to export.',
    context: 'Compliance guard',
    status: 'READY TO EXPORT',
    actor: 'Halo Guardrails',
    category: 'compliance',
    startedAt: minutesAgo(18),
    slaMinutes: 15,
    tags: ['PII', 'Compliance'],
    metrics: [
      { label: 'PII Fields', value: '128' },
      { label: 'Accuracy', value: '99.2%' },
    ],
    details:
      'Redaction templates matched financial identifiers and personal data. The sanitized packet is staged for downstream delivery with evidence attached to the audit log.',
  },
  {
    id: 'evt-ops-004',
    title: 'Executive brief shipped',
    summary: 'Ops command packaged customer telemetry into the Monday briefing.',
    context: 'Operations hub',
    status: 'NOTIFIED STAKEHOLDERS',
    actor: 'Halo Ops',
    category: 'operations',
    startedAt: minutesAgo(24),
    slaMinutes: 25,
    tags: ['Briefings', 'Operations'],
    metrics: [
      { label: 'Insights', value: '8' },
      { label: 'Recipients', value: '12' },
    ],
    details:
      'The scheduled brief combined support, revenue, and adoption metrics. Slack and email alerts were sent to leadership with links to the full dossier for follow-up.',
  },
];

const scenarioPool: Array<Omit<WorkflowEvent, 'id' | 'startedAt'>> = [
  {
    title: 'Vendor contract reviewed',
    summary: 'Clause analytics compared renewal terms to playbook standards.',
    context: 'Legal lane',
    status: 'AWAITING SIGNATURE',
    actor: 'Halo Co-Pilot',
    category: 'legal',
    slaMinutes: 45,
    tags: ['Contracts', 'Playbooks'],
    metrics: [
      { label: 'Risks Flagged', value: '2' },
      { label: 'Redlines', value: '5' },
    ],
    details:
      'Negotiation playbook C1 was applied. Deviations around liability caps were escalated to legal leadership while the AI drafted alternative language.',
  },
  {
    title: 'Expense reports normalized',
    summary: 'Receipts were OCR’d, normalized, and exported to NetSuite.',
    context: 'Finance automation',
    status: 'POSTED',
    actor: 'Halo Automations',
    category: 'finance',
    slaMinutes: 20,
    tags: ['OCR', 'Finance'],
    metrics: [
      { label: 'Reports', value: '18' },
      { label: 'Exceptions', value: '0' },
    ],
    details:
      'Per-diem policy enforcement passed. Foreign currency receipts were auto-converted with the week’s FX rate and posted to NetSuite with receipts attached.',
  },
  {
    title: 'Research pack synthesized',
    summary: 'A 50-page market report was condensed into briefing notes.',
    context: 'Research studio',
    status: 'SENT TO TEAM',
    actor: 'Halo Research',
    category: 'research',
    slaMinutes: 35,
    tags: ['Summaries', 'Insights'],
    metrics: [
      { label: 'Sections', value: '6' },
      { label: 'Reading Time', value: '4 min' },
    ],
    details:
      'The AI highlighted competitor moves and demand signals. The final pack was synced to the knowledge base with highlights for quick scanning.',
  },
  {
    title: 'Security questionnaire auto-filled',
    summary: 'Responses drafted from policy library and prior RFP submissions.',
    context: 'Compliance desk',
    status: 'UNDER REVIEW',
    actor: 'Halo Guardrails',
    category: 'compliance',
    slaMinutes: 60,
    tags: ['RFP', 'Security'],
    metrics: [
      { label: 'Questions', value: '82' },
      { label: 'Reuse Rate', value: '93%' },
    ],
    details:
      'Knowledge snippets from SOC 2 artifacts populated the questionnaire. Open items were routed to security engineering with suggested answers.',
  },
];

let sequence = 0;

export const generateWorkflowEvent = (): WorkflowEvent => {
  const scenario = scenarioPool[sequence % scenarioPool.length]!;
  sequence += 1;

  return {
    ...scenario,
    id: `evt-${Date.now()}-${sequence}`,
    startedAt: new Date().toISOString(),
  };
};

