import { IRecentKnowledgeBasesCardProps } from "@/interfaces/RecentKnowledgeBasesCard";
import { IProps as RecommendedKnowledgeBasesProps } from "@/interfaces/RecommendedKnowledgeBases";

/**
 * Mock data for recent knowledge bases
 */
export const getRecentKnowledgeBasesData = (): IRecentKnowledgeBasesCardProps => ({
    items: [
        {
            title: 'Company Policies 2024',
            summary: 'Updated employee handbook and policies.',
            updatedAt: '2 hours ago'
        },
        {
            title: 'AI Ethics Guidelines',
            summary: 'Best practices for ethical AI development.',
            updatedAt: '1 day ago'
        },
        {
            title: 'Security Protocols',
            summary: 'Data protection and security measures.',
            updatedAt: '3 days ago'
        }
    ]
});

/**
 * Mock data for recommended knowledge bases
 */
export const getRecommendedKnowledgeBasesData = (): RecommendedKnowledgeBasesProps => ({
    items: [
        {
            title: 'How to Handle Sensitive Data',
            summary: 'Based on your recent documents, this topic may be useful to reinforce security practices.',
            confidenceScore: 92,
        },
        {
            title: 'Effective Onboarding for Remote Teams',
            summary: 'Commonly referenced by teams with distributed members.',
            confidenceScore: 87,
        },
        {
            title: 'AI Ethics in Practice',
            summary: 'Frequent keyword match found in user queries.',
        },
    ]
});
