import { RecentActivityCard, RecommendedKnowledgeBases, StatusCard, RecentKnowledgeBasesCard } from "@/components";
import { getStatusCards } from "./constants";
import { getRecentKnowledgeBasesData, getRecommendedKnowledgeBasesData } from "./mockData";

/**
 * Dashboard page component displaying key metrics and recent activity
 */
export default function Dashboard() {
    const statusCards = getStatusCards();
    const recentKnowledgeBasesData = getRecentKnowledgeBasesData();
    const recommendedKnowledgeBasesData = getRecommendedKnowledgeBasesData();

    // Mock data for recent activities (this should come from a service in real app)
    const recentActivities = [
        {
            title: 'Updated knowledge base',
            timestamp: '2 hours ago',
            description: 'Edited "Security Guidelines" section',
        },
        {
            title: 'Added new article',
            timestamp: 'Yesterday',
            description: 'Published "AI Ethics Best Practices"',
        },
        {
            title: 'User feedback received',
            timestamp: '3 days ago',
        },
    ];

    return (
        <div className="container">
            {/* Status Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-0 mb-4 justify-items-center">
                {statusCards.map((card, index) => (
                    <StatusCard
                        key={index}
                        name={card.name}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                    />
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-wrap gap-4 mb-4 justify-center">
                <div className="w-full md:w-3/4">
                    <RecentKnowledgeBasesCard items={recentKnowledgeBasesData.items} />
                </div>
                <div className="w-full md:w-1/4">
                    <RecentActivityCard activities={recentActivities} />
                </div>
            </div>

            {/* Recommended Knowledge Bases */}
            <div className="flex flex-wrap gap-4 mb-4 justify-center px-8">
                <RecommendedKnowledgeBases items={recommendedKnowledgeBasesData.items} />
            </div>
        </div>
    );
}
