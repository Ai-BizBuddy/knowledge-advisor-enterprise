"use client";

import React, { useState } from "react";
import { Card, Button, Spinner, Alert, Label, TextInput } from "flowbite-react";
import { usePermissionManagement } from "@/hooks";

export default function PermissionsPage() {
  const {
    resources: resourceConfigs,
    loading: configLoading,
    error: configError,
    clearError: clearConfigError,
  } = usePermissionManagement();

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Filter resources based on search
  const filteredResources = resourceConfigs.filter(
    (resource) =>
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Early return for config loading state
  if (configLoading && resourceConfigs.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <div className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
            Loading permissions configuration...
          </div>
        </div>
      </div>
    );
  }

  // Error handling for configs
  if (configError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Alert color="failure" className="max-w-md">
          <div className="text-center">
            <div className="mb-2 font-medium">Error loading permissions</div>
            <div className="text-sm">{configError}</div>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={clearConfigError} size="sm" color="gray">
                Reload Config
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permissions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system permissions for resources and actions
          </p>
        </div>
      </div>

      {/* Search */}
      <div>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search resources
              </Label>
              <TextInput
                id="search"
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={() => (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                )}
              />
            </div>
            {searchTerm && (
              <Button color="gray" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Enhanced Permissions Table */}
      <div>
        <Card className="overflow-hidden">
          {configLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Spinner size="xl" />
                <div className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
                  Loading permissions...
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                      >
                        Resource
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                      >
                        Available Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {filteredResources.map((resource) => (
                      <tr
                        key={resource.key}
                        className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                              <svg
                                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {resource.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {resource.actions.length} action
                                {resource.actions.length !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {resource.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            {resource.actions.map((action) => (
                              <span
                                key={`${resource.key}-${action}`}
                                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              >
                                {action.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredResources.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No resources found matching your search.
                    </div>
                    {searchTerm && (
                      <div className="mt-2">
                        <Button
                          color="gray"
                          size="sm"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
