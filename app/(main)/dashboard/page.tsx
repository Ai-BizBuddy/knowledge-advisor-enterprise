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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Container with consistent responsive padding */}
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 sm:text-base dark:text-gray-400">
            Monitor your knowledge base performance and activity
          </p>
        </div>

        {/* Status Cards Grid - Responsive layout */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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

        {/* Main Content Grid - Responsive layout */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:mb-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <RecentKnowledgeBasesCard items={recentKnowledgeBasesData.items} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivityCard activities={recentActivities} />
          </div>
        </div>

        {/* Recommended Knowledge Bases */}
        <div className="space-y-6">
          <RecommendedKnowledgeBases
            items={recommendedKnowledgeBasesData.items}
          />
        </div>
      </div>
    </div>
  );
}
