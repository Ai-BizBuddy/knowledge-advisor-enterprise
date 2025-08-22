"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const settingsNavigation = [
  {
    name: "Users",
    href: "/settings/users",
    description: "Manage user accounts and profiles",
  },
  {
    name: "Roles",
    href: "/settings/roles",
    description: "Configure user roles and access levels",
  },
  {
    name: "Permissions",
    href: "/settings/permissions",
    description: "Set up granular permission controls",
  },
  {
    name: "Departments",
    href: "/settings/departments",
    description: "Organize users by departments",
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  // Check if we're on the main settings page (overview)
  const isOverviewPage = pathname === "/settings";

  return (
    <div className="min-h-screen">
      {/* Main Container with consistent responsive padding */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header - only show on overview page */}
        {isOverviewPage && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Settings
                </h1>
                <p className="text-sm text-gray-500 sm:text-base dark:text-gray-400">
                  Manage users, roles, permissions, and departments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs - only show on sub-pages */}
        {!isOverviewPage && (
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 overflow-x-auto">
              {settingsNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group relative flex items-center space-x-2 py-4 text-sm font-medium transition-colors duration-200"
                  >
                    <span
                      className={`${
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                      }`}
                    >
                      {item.name}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
