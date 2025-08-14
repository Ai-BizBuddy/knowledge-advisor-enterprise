"use client";

import { Card } from "flowbite-react";
import Link from "next/link";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect } from "react";

const settingsOverview = [
  {
    title: "Users",
    description: "Manage user accounts, profiles, and access",
    href: "/settings/users",
    icon: "👥",
    stats: { total: 0, active: 0 },
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Roles",
    description: "Configure user roles and permission levels",
    href: "/settings/roles",
    icon: "🛡️",
    stats: { total: 0, system: 0 },
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Permissions",
    description: "Set up granular access controls",
    href: "/settings/permissions",
    icon: "🔑",
    stats: { total: 0, resources: 0 },
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "Departments",
    description: "Organize users by departments",
    href: "/settings/departments",
    icon: "🏢",
    stats: { total: 0, active: 0 },
    gradient: "from-orange-500 to-red-500",
  },
];

export default function SettingsPage() {
  const { systemStatus } = useSystemStatus();
  const { setLoading } = useLoading();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {settingsOverview.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="group h-full cursor-pointer border-gray-200 transition-all duration-200 hover:shadow-lg dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center space-x-3">
                    <div
                      className={`rounded-lg bg-gradient-to-r p-2 ${item.gradient} text-white`}
                    >
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                  <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-500">
                    {Object.entries(item.stats).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-1">
                        <span className="capitalize">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-gray-400 transition-colors group-hover:text-indigo-600 dark:text-gray-500 dark:group-hover:text-indigo-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 dark:border-gray-700">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Common administrative tasks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/settings/users"
            className="flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Add New User
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Create a new user account
              </div>
            </div>
          </Link>

          <Link
            href="/settings/roles"
            className="flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
              <span className="text-lg">🏷️</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Create Role
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Define a new user role
              </div>
            </div>
          </Link>

          <Link
            href="/settings/departments"
            className="flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
              <span className="text-lg">🏗️</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Add Department
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Create a new department
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* System Status */}
      <Card className="border-gray-200 dark:border-gray-700">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current system information
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Operational
            </span>
          </div>
        </div>

        {systemStatus.loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="animate-pulse rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ...
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Users
              </div>
            </div>
            <div className="animate-pulse rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ...
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Sessions
              </div>
            </div>
            <div className="animate-pulse rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ...
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                System Roles
              </div>
            </div>
          </div>
        ) : systemStatus.error ? (
          <div className="p-4 text-center text-red-500">
            {systemStatus.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemStatus.totalUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Users
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemStatus.activeSessions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Sessions
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemStatus.systemRoles}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                System Roles
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
