// src/services/mockApi.ts
import { Lead, CreateLeadRequest } from "@/models/types/lead";

// Mock data
let MOCK_LEADS: Lead[] = [
  {
    id: "728ed52f",
    name: "Scarry Edwards",
    stage: "contacted",
    createdOn: "2024-01-15",
    leadScore: 85,
    contact: "985745224",
    email: "scarry.edwards@techcorp.com",
    source: "Website",
    media: "Email",
    lastActivity: "2024-01-16",
    department: "Sales",
    notes: "Follow up next week. Interested in premium package.",
  },
  {
    id: "728ed53g",
    name: "John Doe",
    stage: "first-call",
    createdOn: "2024-01-10",
    leadScore: 92,
    contact: "987654321",
    email: "john.doe@innovate.com",
    source: "Social Media",
    media: "WhatsApp",
    lastActivity: "2024-01-12",
    department: "Marketing",
    notes:
      "Very interested in premium package. Schedule demo for next Tuesday.",
  },
  {
    id: "728ed54h",
    name: "Jane Smith",
    stage: "closed-won",
    createdOn: "2024-01-05",
    leadScore: 78,
    contact: "123456789",
    email: "jane.smith@enterprise.com",
    source: "Referral",
    media: "Phone",
    lastActivity: "2024-01-08",
    department: "Sales",
    notes: "Deal closed successfully. Payment received.",
  },
  {
    id: "728ed55i",
    name: "Alice Johnson",
    stage: "qualified",
    createdOn: "2024-01-12",
    leadScore: 67,
    contact: "555123456",
    email: "alice.johnson@startup.io",
    source: "Email Campaign",
    media: "Email",
    lastActivity: "2024-01-14",
    department: "Marketing",
    notes: "New lead from email campaign. Needs qualification call.",
  },
  {
    id: "728ed56j",
    name: "Michael Brown",
    stage: "proposal",
    createdOn: "2024-01-08",
    leadScore: 88,
    contact: "444567890",
    email: "m.brown@bigcorp.com",
    source: "Trade Show",
    media: "In-person",
    lastActivity: "2024-01-11",
    department: "Sales",
    notes: "Proposal sent. Waiting for feedback from procurement team.",
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions that simulate REST endpoints
export const mockApi = {
  // GET /api/leads
  getLeads: async (): Promise<Lead[]> => {
    await delay(800);
    console.log("🔄 GET /api/leads");
    return [...MOCK_LEADS];
  },

  // GET /api/leads/:id
  getLead: async (id: string): Promise<Lead> => {
    await delay(300);
    console.log(`🔄 GET /api/leads/${id}`);
    const lead = MOCK_LEADS.find((l) => l.id === id);
    if (!lead) throw new Error("Lead not found");
    return lead;
  },

  // PATCH /api/leads/:id/stage
  updateLeadStage: async (id: string, stage: string): Promise<Lead> => {
    await delay(500);
    console.log(`🔄 PATCH /api/leads/${id}/stage`);

    const leadIndex = MOCK_LEADS.findIndex((l) => l.id === id);
    if (leadIndex === -1) throw new Error("Lead not found");

    MOCK_LEADS[leadIndex] = {
      ...MOCK_LEADS[leadIndex],
      stage,
      lastActivity: new Date().toISOString().split("T")[0],
    };

    return MOCK_LEADS[leadIndex];
  },

  // POST /api/leads
  createLead: async (leadData: CreateLeadRequest): Promise<Lead> => {
    await delay(600);
    console.log("🔄 POST /api/leads");

    const newLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}`,
      createdOn: new Date().toISOString().split("T")[0],
      lastActivity: new Date().toISOString().split("T")[0],
    };

    MOCK_LEADS.unshift(newLead);
    return newLead;
  },

  // DELETE /api/leads/:id
  deleteLead: async (id: string): Promise<void> => {
    await delay(400);
    console.log(`🔄 DELETE /api/leads/${id}`);

    const leadIndex = MOCK_LEADS.findIndex((l) => l.id === id);
    if (leadIndex === -1) throw new Error("Lead not found");

    MOCK_LEADS.splice(leadIndex, 1);
  },

  // PATCH /api/leads/:id/notes
  updateLeadNotes: async (id: string, notes: string): Promise<Lead> => {
    await delay(400);
    console.log(`🔄 PATCH /api/leads/${id}/notes`);

    const leadIndex = MOCK_LEADS.findIndex((l) => l.id === id);
    if (leadIndex === -1) throw new Error("Lead not found");

    MOCK_LEADS[leadIndex] = {
      ...MOCK_LEADS[leadIndex],
      notes,
      lastActivity: new Date().toISOString().split("T")[0],
    };

    return MOCK_LEADS[leadIndex];
  },
};
