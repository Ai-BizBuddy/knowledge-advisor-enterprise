import { Project, ProjectStatus } from "@/interfaces/Project";

export interface KnowledgeBaseData extends Project {
    queries?: number;
    accuracy?: number;
    lastSync?: string;
    storageSize?: string;
    documentsCount?: number;
    category?: string;
    tags?: string[];
}

export const knowledgeBaseData: KnowledgeBaseData[] = [
    {
        id: "kb-001",
        name: "Product Documentation Hub",
        description: "Comprehensive collection of all product documentation, user manuals, and technical specifications for our software products.",
        document_count: 152,
        status: ProjectStatus.ACTIVE,
        owner: "user-001",
        created_at: "2024-01-15T08:30:00Z",
        updated_at: "2024-08-14T14:22:00Z",
        lastSync: "2 hours ago",
        queries: 1245,
        accuracy: 94.5,
        storageSize: "2.8 GB",
        documentsCount: 152,
        category: "Documentation",
        tags: ["product", "manual", "technical"]
    },
    {
        id: "kb-002",
        name: "Customer Support Knowledge Base",
        description: "Centralized repository for customer support articles, troubleshooting guides, and frequently asked questions.",
        document_count: 89,
        status: ProjectStatus.ACTIVE,
        owner: "user-002",
        created_at: "2024-02-20T10:15:00Z",
        updated_at: "2024-08-13T16:45:00Z",
        lastSync: "1 day ago",
        queries: 2156,
        accuracy: 91.2,
        storageSize: "1.4 GB",
        documentsCount: 89,
        category: "Support",
        tags: ["support", "faq", "troubleshooting"]
    },
    {
        id: "kb-003",
        name: "Employee Training Materials",
        description: "Complete training modules, onboarding guides, and certification materials for new and existing employees.",
        document_count: 67,
        status: ProjectStatus.ACTIVE,
        owner: "user-003",
        created_at: "2024-03-05T09:20:00Z",
        updated_at: "2024-08-12T11:30:00Z",
        lastSync: "3 days ago",
        queries: 567,
        accuracy: 88.7,
        storageSize: "3.2 GB",
        documentsCount: 67,
        category: "Training",
        tags: ["training", "onboarding", "certification"]
    },
    {
        id: "kb-004",
        name: "Marketing Content Library",
        description: "Brand guidelines, marketing templates, campaign materials, and creative assets for marketing teams.",
        document_count: 234,
        status: ProjectStatus.ACTIVE,
        owner: "user-004",
        created_at: "2024-01-30T14:45:00Z",
        updated_at: "2024-08-14T09:15:00Z",
        lastSync: "5 hours ago",
        queries: 892,
        accuracy: 92.1,
        storageSize: "5.6 GB",
        documentsCount: 234,
        category: "Marketing",
        tags: ["marketing", "brand", "templates"]
    },
    {
        id: "kb-005",
        name: "Legal & Compliance Hub",
        description: "Legal documents, compliance guidelines, contracts, and regulatory information for business operations.",
        document_count: 45,
        status: ProjectStatus.PAUSED,
        owner: "user-005",
        created_at: "2024-04-10T12:00:00Z",
        updated_at: "2024-07-20T15:30:00Z",
        lastSync: "3 weeks ago",
        queries: 234,
        accuracy: 96.3,
        storageSize: "890 MB",
        documentsCount: 45,
        category: "Legal",
        tags: ["legal", "compliance", "contracts"]
    },
    {
        id: "kb-006",
        name: "Technical Architecture Guide",
        description: "System architecture documentation, API references, and technical implementation guides for developers.",
        document_count: 78,
        status: ProjectStatus.ACTIVE,
        owner: "user-006",
        created_at: "2024-02-14T16:30:00Z",
        updated_at: "2024-08-14T13:20:00Z",
        lastSync: "30 minutes ago",
        queries: 1567,
        accuracy: 89.4,
        storageSize: "2.1 GB",
        documentsCount: 78,
        category: "Technical",
        tags: ["architecture", "api", "development"]
    },
    {
        id: "kb-007",
        name: "Financial Reports Archive",
        description: "Historical financial reports, budget documents, and financial analysis materials for executive review.",
        document_count: 156,
        status: ProjectStatus.ACTIVE,
        owner: "user-007",
        created_at: "2024-01-08T11:45:00Z",
        updated_at: "2024-08-10T14:00:00Z",
        lastSync: "1 week ago",
        queries: 345,
        accuracy: 93.8,
        storageSize: "1.8 GB",
        documentsCount: 156,
        category: "Finance",
        tags: ["finance", "reports", "budget"]
    },
    {
        id: "kb-008",
        name: "Project Management Templates",
        description: "Project templates, workflow documents, and process guidelines for project management teams.",
        document_count: 92,
        status: ProjectStatus.DRAFT,
        owner: "user-008",
        created_at: "2024-07-15T10:30:00Z",
        updated_at: "2024-08-05T16:45:00Z",
        lastSync: "Never",
        queries: 0,
        accuracy: 0,
        storageSize: "1.2 GB",
        documentsCount: 92,
        category: "Project Management",
        tags: ["project", "templates", "workflow"]
    },
    {
        id: "kb-009",
        name: "Research & Development Database",
        description: "Research papers, experiment results, and development notes for R&D teams and innovation projects.",
        document_count: 203,
        status: ProjectStatus.ACTIVE,
        owner: "user-009",
        created_at: "2024-03-22T13:15:00Z",
        updated_at: "2024-08-13T12:30:00Z",
        lastSync: "6 hours ago",
        queries: 1123,
        accuracy: 87.9,
        storageSize: "4.7 GB",
        documentsCount: 203,
        category: "Research",
        tags: ["research", "development", "innovation"]
    },
    {
        id: "kb-010",
        name: "Quality Assurance Documentation",
        description: "QA procedures, test cases, bug reports, and quality standards documentation for quality teams.",
        document_count: 134,
        status: ProjectStatus.ACTIVE,
        owner: "user-010",
        created_at: "2024-04-03T09:00:00Z",
        updated_at: "2024-08-14T11:45:00Z",
        lastSync: "2 hours ago",
        queries: 678,
        accuracy: 90.6,
        storageSize: "2.3 GB",
        documentsCount: 134,
        category: "Quality Assurance",
        tags: ["qa", "testing", "quality"]
    },
    {
        id: "kb-011",
        name: "Sales Enablement Materials",
        description: "Sales presentations, product sheets, customer case studies, and competitive analysis for sales teams.",
        document_count: 187,
        status: ProjectStatus.ACTIVE,
        owner: "user-011",
        created_at: "2024-01-25T15:20:00Z",
        updated_at: "2024-08-14T10:30:00Z",
        lastSync: "4 hours ago",
        queries: 2034,
        accuracy: 93.2,
        storageSize: "3.9 GB",
        documentsCount: 187,
        category: "Sales",
        tags: ["sales", "presentations", "case-studies"]
    },
    {
        id: "kb-012",
        name: "IT Infrastructure Guide",
        description: "Network documentation, server configurations, security protocols, and IT maintenance procedures.",
        document_count: 98,
        status: ProjectStatus.PAUSED,
        owner: "user-012",
        created_at: "2024-05-12T14:30:00Z",
        updated_at: "2024-07-28T16:20:00Z",
        lastSync: "2 weeks ago",
        queries: 456,
        accuracy: 95.1,
        storageSize: "1.6 GB",
        documentsCount: 98,
        category: "IT",
        tags: ["infrastructure", "network", "security"]
    },
    {
        id: "kb-013",
        name: "Vendor Management Database",
        description: "Vendor contracts, supplier information, procurement guidelines, and vendor performance reports.",
        document_count: 76,
        status: ProjectStatus.ACTIVE,
        owner: "user-013",
        created_at: "2024-06-08T11:15:00Z",
        updated_at: "2024-08-12T14:50:00Z",
        lastSync: "2 days ago",
        queries: 289,
        accuracy: 91.7,
        storageSize: "1.1 GB",
        documentsCount: 76,
        category: "Procurement",
        tags: ["vendor", "procurement", "contracts"]
    },
    {
        id: "kb-014",
        name: "Content Strategy Repository",
        description: "Content guidelines, editorial calendars, SEO documentation, and content performance analytics.",
        document_count: 145,
        status: ProjectStatus.DRAFT,
        owner: "user-014",
        created_at: "2024-07-20T12:45:00Z",
        updated_at: "2024-08-01T15:30:00Z",
        lastSync: "Never",
        queries: 0,
        accuracy: 0,
        storageSize: "2.4 GB",
        documentsCount: 145,
        category: "Content",
        tags: ["content", "seo", "editorial"]
    },
    {
        id: "kb-015",
        name: "Safety & Security Protocols",
        description: "Safety procedures, emergency protocols, security guidelines, and incident response documentation.",
        document_count: 112,
        status: ProjectStatus.ACTIVE,
        owner: "user-015",
        created_at: "2024-02-28T10:00:00Z",
        updated_at: "2024-08-14T08:45:00Z",
        lastSync: "1 hour ago",
        queries: 534,
        accuracy: 97.2,
        storageSize: "1.7 GB",
        documentsCount: 112,
        category: "Safety",
        tags: ["safety", "security", "emergency"]
    }
];

// Helper function to filter knowledge bases by status
export const getKnowledgeBasesByStatus = (status?: ProjectStatus) => {
    if (!status) return knowledgeBaseData;
    return knowledgeBaseData.filter(kb => kb.status === status);
};

// Helper function to get knowledge base by ID
export const getKnowledgeBaseById = (id: string) => {
    return knowledgeBaseData.find(kb => kb.id === id);
};

// Helper function to format status for display
export const formatStatus = (status: ProjectStatus): string => {
    switch (status) {
        case ProjectStatus.ACTIVE:
            return "Active";
        case ProjectStatus.PAUSED:
            return "Paused";
        case ProjectStatus.DRAFT:
            return "Draft";
        default:
            return "Unknown";
    }
};
