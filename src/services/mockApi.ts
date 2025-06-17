// src/services/mockApi.ts
import {
  Lead,
  LeadDetails,
  CreateLeadRequest,
  LeadActivity,
  LeadDocument,
} from "@/models/types/lead";

// Enhanced mock data with detailed information
let MOCK_LEADS: Lead[] = [
  {
    id: "728ed52f",
    name: "Rahul Sharma",
    stage: "contacted",
    createdOn: "2025-03-15",
    leadScore: 85,
    contact: "985745224",
    email: "rahul.sharma@techcorp.com",
    source: "Website",
    media: "Email",
    lastActivity: "2025-03-16",
    department: "Sales",
    notes: "Follow up next week. Interested in premium package.",
  },
  {
    id: "728ed53g",
    name: "Priya Patel",
    stage: "first-call",
    createdOn: "2025-03-10",
    leadScore: 92,
    contact: "987654321",
    email: "priya.patel@innovate.com",
    source: "Social Media",
    media: "WhatsApp",
    lastActivity: "2025-03-12",
    department: "Marketing",
    notes:
      "Very interested in premium package. Schedule demo for next Tuesday.",
  },
  {
    id: "728ed54h",
    name: "Amit Singh",
    stage: "closed-won",
    createdOn: "2025-03-05",
    leadScore: 78,
    contact: "123456789",
    email: "amit.singh@enterprise.com",
    source: "Referral",
    media: "Phone",
    lastActivity: "2025-03-08",
    department: "Sales",
    notes: "Deal closed successfully. Payment received.",
  },
  {
    id: "728ed55i",
    name: "Sneha Gupta",
    stage: "qualified",
    createdOn: "2025-03-12",
    leadScore: 67,
    contact: "555123456",
    email: "sneha.gupta@startup.io",
    source: "Email Campaign",
    media: "Email",
    lastActivity: "2025-03-14",
    department: "Marketing",
    notes: "New lead from email campaign. Needs qualification call.",
  },
  {
    id: "728ed56j",
    name: "Vikram Kumar",
    stage: "proposal",
    createdOn: "2025-03-08",
    leadScore: 88,
    contact: "444567890",
    email: "vikram.kumar@bigcorp.com",
    source: "Trade Show",
    media: "In-person",
    lastActivity: "2025-03-11",
    department: "Sales",
    notes: "Proposal sent. Waiting for feedback from procurement team.",
  },
];

// Detailed lead information
const MOCK_LEAD_DETAILS: Record<string, LeadDetails> = {
  "728ed52f": {
    id: "728ed52f",
    leadId: "LD-1029",
    name: "Rahul Sharma",
    stage: "contacted",
    createdOn: "2025-03-15",
    leadScore: 85,
    contact: "985745224",
    phoneNumber: "+91 98574 52244",
    email: "rahul.sharma@techcorp.com",
    source: "Website",
    media: "Email",
    lastActivity: "2025-03-16",
    department: "Sales",
    notes: "Follow up next week. Interested in premium package.",
    countryOfInterest: ["Canada", "USA", "UK", "Germany"],
    courseLevel: "Master's degree",
    tags: ["IELTS ready", "Engineering", "MBA"],
    address: {
      street: "123 Tech Park",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      zipCode: "560001",
    },
    socialMedia: {
      linkedin: "https://linkedin.com/in/rahulsharma",
      facebook: "https://facebook.com/rahul.sharma",
    },
    preferences: {
      communicationMethod: "email",
      bestTimeToContact: "9 AM - 6 PM IST",
      timezone: "Asia/Kolkata",
    },
    leadHistory: [
      {
        id: "activity1",
        type: "note",
        title: "Initial Contact",
        description:
          "First contact made via website form. Interested in engineering programs.",
        timestamp: "2025-03-15T10:30:00Z",
        performedBy: "Sales Team",
      },
      {
        id: "activity2",
        type: "email",
        title: "Welcome Email Sent",
        description: "Sent welcome email with course brochures and next steps.",
        timestamp: "2025-03-15T14:20:00Z",
        performedBy: "Marketing Automation",
      },
      {
        id: "activity3",
        type: "call",
        title: "Follow-up Call Scheduled",
        description:
          "Scheduled call for March 20th to discuss requirements in detail.",
        timestamp: "2025-03-16T11:15:00Z",
        performedBy: "John Doe",
      },
    ],
    documents: [
      {
        id: "doc1",
        name: "IELTS_Certificate.pdf",
        type: "pdf",
        size: 245760,
        uploadedAt: "2025-03-15T16:45:00Z",
        uploadedBy: "Rahul Sharma",
      },
      {
        id: "doc2",
        name: "Academic_Transcript.pdf",
        type: "pdf",
        size: 1024000,
        uploadedAt: "2025-03-16T09:30:00Z",
        uploadedBy: "Rahul Sharma",
      },
    ],
  },
  "728ed53g": {
    id: "728ed53g",
    leadId: "LD-1030",
    name: "Priya Patel",
    stage: "first-call",
    createdOn: "2025-03-10",
    leadScore: 92,
    contact: "987654321",
    phoneNumber: "+91 98765 43210",
    email: "priya.patel@innovate.com",
    source: "Social Media",
    media: "WhatsApp",
    lastActivity: "2025-03-12",
    department: "Marketing",
    notes:
      "Very interested in premium package. Schedule demo for next Tuesday.",
    countryOfInterest: ["Australia", "New Zealand", "Canada"],
    courseLevel: "Bachelor's degree",
    tags: ["Social Media", "Quick Response", "High Intent"],
    address: {
      street: "456 Innovation Hub",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      zipCode: "400001",
    },
    preferences: {
      communicationMethod: "whatsapp",
      bestTimeToContact: "7 PM - 10 PM IST",
      timezone: "Asia/Kolkata",
    },
    leadHistory: [
      {
        id: "activity4",
        type: "note",
        title: "Social Media Inquiry",
        description: "Contacted via Facebook about MBA programs in Australia.",
        timestamp: "2025-03-10T19:45:00Z",
        performedBy: "Social Media Team",
      },
      {
        id: "activity5",
        type: "call",
        title: "First Call Completed",
        description:
          "Had detailed discussion about course options and requirements.",
        timestamp: "2025-03-12T20:30:00Z",
        performedBy: "Sarah Wilson",
      },
    ],
    documents: [
      {
        id: "doc3",
        name: "Passport_Copy.jpg",
        type: "image",
        size: 512000,
        uploadedAt: "2025-03-11T12:20:00Z",
        uploadedBy: "Priya Patel",
      },
    ],
  },
  // Add more detailed records as needed...
};

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions
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

  // GET /api/leads/:id/details - New endpoint for detailed lead info
  getLeadDetails: async (id: string): Promise<LeadDetails> => {
    await delay(500);
    console.log(`🔄 GET /api/leads/${id}/details`);

    const leadDetails = MOCK_LEAD_DETAILS[id];
    if (!leadDetails) {
      // If no detailed data exists, create basic details from lead data
      const lead = MOCK_LEADS.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found");

      const basicDetails: LeadDetails = {
        ...lead,
        leadId: `LD-${Math.floor(Math.random() * 9000) + 1000}`,
        phoneNumber: `+91 ${lead.contact.slice(0, 5)} ${lead.contact.slice(5)}`,
        countryOfInterest: ["Canada", "USA", "UK"],
        courseLevel: "Bachelor's degree",
        tags: ["New Lead"],
        preferences: {
          communicationMethod: "email",
          bestTimeToContact: "9 AM - 6 PM IST",
          timezone: "Asia/Kolkata",
        },
        leadHistory: [
          {
            id: "default1",
            type: "note",
            title: "Lead Created",
            description: "Lead was created in the system.",
            timestamp: lead.createdOn + "T00:00:00Z",
            performedBy: "System",
          },
        ],
        documents: [],
      };
      return basicDetails;
    }

    return leadDetails;
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

    // Also update detailed record if it exists
    if (MOCK_LEAD_DETAILS[id]) {
      MOCK_LEAD_DETAILS[id].stage = stage;
      MOCK_LEAD_DETAILS[id].lastActivity = new Date()
        .toISOString()
        .split("T")[0];

      // Add activity to history
      MOCK_LEAD_DETAILS[id].leadHistory.push({
        id: `activity_${Date.now()}`,
        type: "stage_change",
        title: `Stage Changed to ${stage}`,
        description: `Lead stage updated from previous stage to ${stage}`,
        timestamp: new Date().toISOString(),
        performedBy: "Current User",
      });
    }

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
    delete MOCK_LEAD_DETAILS[id];
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

  // POST /api/leads/:id/activities - Add new activity
  addLeadActivity: async (
    id: string,
    activity: Omit<LeadActivity, "id" | "timestamp">
  ): Promise<LeadActivity> => {
    await delay(300);
    console.log(`🔄 POST /api/leads/${id}/activities`);

    const newActivity: LeadActivity = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    if (MOCK_LEAD_DETAILS[id]) {
      MOCK_LEAD_DETAILS[id].leadHistory.push(newActivity);
    }

    return newActivity;
  },
};
