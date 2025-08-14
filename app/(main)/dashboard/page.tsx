"use client";
import { useEffect } from "react";
import {
  RecentActivityCard,
  RecommendedKnowledgeBases,
  StatusCard,
  RecentKnowledgeBasesCard,
} from "@/components";
import { getStatusCards } from "./constants";
import {
  getRecentKnowledgeBasesData,
  getRecommendedKnowledgeBasesData,
} from "./mockData";
import { useLoading } from "@/contexts/LoadingContext";

/**
 * Dashboard page component displaying key metrics and recent activity
 */
export default function Dashboard() {
  const { setLoading } = useLoading();
  const statusCards = getStatusCards();
  const recentKnowledgeBasesData = getRecentKnowledgeBasesData();
  const recommendedKnowledgeBasesData = getRecommendedKnowledgeBasesData();

  // Set loading state when data is being fetched
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  // Mock data for recent activities (this should come from a service in real app)
  const recentActivities = [
    {
      title: "Updated knowledge base",
      timestamp: "2 hours ago",
      description: 'Edited "Security Guidelines" section',
    },
    {
      title: "Added new article",
      timestamp: "Yesterday",
      description: 'Published "AI Ethics Best Practices"',
    },
    {
      title: "User feedback received",
      timestamp: "3 days ago",
    },
  ];

  return (
    <div className="container">
      {/* Status Cards Grid */}
      <div className="mb-4 flex flex-col flex-wrap items-center justify-center justify-items-center gap-4 md:flex-row md:gap-4">
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
      <div className="mb-4 flex justify-center gap-4 px-8">
        <div className="w-full md:w-3/4">
          <RecentKnowledgeBasesCard items={recentKnowledgeBasesData.items} />
        </div>
        <div className="w-full md:w-1/4">
          <RecentActivityCard activities={recentActivities} />
        </div>
      </div>

      {/* Recommended Knowledge Bases */}
      <div className="mb-4 flex flex-wrap justify-center gap-4 px-8">
        <RecommendedKnowledgeBases
          items={recommendedKnowledgeBasesData.items}
        />
      </div>
    </div>
  );
}
