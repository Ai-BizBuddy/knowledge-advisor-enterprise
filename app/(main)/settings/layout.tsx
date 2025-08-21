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
    icon: "👥",
    description: "Manage user accounts and profiles",
  },
  {
    name: "Roles",
    href: "/settings/roles",
    icon: "🛡️",
    description: "Configure user roles and access levels",
  },
  {
    name: "Permissions",
    href: "/settings/permissions",
    icon: "🔑",
    description: "Set up granular permission controls",
  },
  {
    name: "Departments",
    href: "/settings/departments",
    icon: "🏢",
    description: "Organize users by departments",
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="px-6 py-6">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage users, roles, permissions, and departments
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
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
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
