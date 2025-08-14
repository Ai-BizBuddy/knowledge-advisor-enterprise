"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Modal,
  Label,
  TextInput,
  Select,
  Badge,
  Textarea,
} from "flowbite-react";
import { usePaginatedUserManagement } from "@/hooks/usePaginatedUserManagement";
import { Pagination } from "@/components/pagination";
import {
  Permission,
  CreatePermissionInput,
  PermissionAction,
} from "@/interfaces/UserManagement";
import { DEFAULT_PAGE_SIZE } from "@/interfaces/Pagination";

export default function PermissionsPage() {
  const { permissions, loading, error, getPermissionsPaginated, clearError } =
    usePaginatedUserManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePermissionInput>({
    name: "",
    resource: "",
    action: PermissionAction.READ,
    description: "",
  });

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const initialLoadRef = useRef(false);

  // Centralized function to load permissions data
  const loadPermissions = useCallback(
    async (params: {
      page: number;
      pageSize: number;
      search?: string;
      resource?: string;
      action?: string;
    }) => {
      try {
        await getPermissionsPaginated(params);
      } catch (error) {
        console.error("Error loading permissions:", error);
      }
    },
    [getPermissionsPaginated],
  );

  // Single useEffect for all data loading
  useEffect(() => {
    if (!initialLoadRef.current) {
      // Initial load
      loadPermissions({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
      initialLoadRef.current = true;
      return;
    }

    // Debounced search/filter updates (only after initial load)
    const timeoutId = setTimeout(() => {
      loadPermissions({
        page: 1,
        pageSize,
        search: searchTerm,
        resource: resourceFilter,
        action: actionFilter,
      });
      setCurrentPage(1);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [loadPermissions, pageSize, searchTerm, resourceFilter, actionFilter]);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      loadPermissions({
        page,
        pageSize,
        search: searchTerm,
        resource: resourceFilter,
        action: actionFilter,
      });
    },
    [loadPermissions, pageSize, searchTerm, resourceFilter, actionFilter],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setCurrentPage(1);
      loadPermissions({
        page: 1,
        pageSize: newPageSize,
        search: searchTerm,
        resource: resourceFilter,
        action: actionFilter,
      });
    },
    [loadPermissions, searchTerm, resourceFilter, actionFilter],
  );

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      resource: "",
      action: PermissionAction.READ,
      description: "",
    });
    setSelectedPermission(null);
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Will implement with service integration
      setShowCreateModal(false);
      resetForm();
      // Refresh current page
      loadPermissions({
        page: currentPage,
        pageSize,
        search: searchTerm,
        resource: resourceFilter,
        action: actionFilter,
      });
    } catch (error) {
      console.error("Error creating permission:", error);
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermission) return;

    try {
      // Will implement with service integration
      setShowEditModal(false);
      resetForm();
      // Refresh current page
      loadPermissions({
        page: currentPage,
        pageSize,
        search: searchTerm,
        resource: resourceFilter,
        action: actionFilter,
      });
    } catch (error) {
      console.error("Error updating permission:", error);
    }
  };

  const handleDeletePermission = async () => {
    if (!selectedPermission) return;

    try {
      // Will implement with service integration
      setShowDeleteModal(false);
      setSelectedPermission(null);
      // Refresh current page
      loadPermissions({
        page: currentPage,
        pageSize,
        search: searchTerm,
        resource: resourceFilter,
        action: actionFilter,
      });
    } catch (error) {
      console.error("Error deleting permission:", error);
    }
  };

  // Modal openers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      resource: permission.resource,
      action: permission.action || PermissionAction.READ,
      description: permission.description || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
  };

  // Utility functions
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "create":
        return "success";
      case "read":
        return "info";
      case "update":
        return "warning";
      case "delete":
        return "failure";
      case "manage":
        return "purple";
      default:
        return "gray";
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case "user":
        return "👤";
      case "project":
        return "📁";
      case "document":
        return "📄";
      case "knowledge_base":
        return "🧠";
      case "chat":
        return "💬";
      case "settings":
        return "⚙️";
      default:
        return "🔑";
    }
  };

  // Get unique resources and actions for filters
  const uniqueResources = Array.from(
    new Set(
      permissions?.data
        .map((p) => p.resource)
        .filter((resource): resource is string => Boolean(resource)),
    ),
  );
  const uniqueActions = Array.from(
    new Set(permissions?.data.map((p) => p.action).filter(Boolean)),
  );

  // Group permissions by resource for stats
  const groupedPermissions =
    permissions?.data.reduce(
      (acc, permission) => {
        const resource = permission.resource || "general";
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>,
    ) || {};

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-red-500">Error loading permissions</div>
          <div className="text-gray-500">{error}</div>
          <Button onClick={clearError} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permissions Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system permissions and access controls
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Permission
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Permissions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {permissions?.pagination.total || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Resources
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.keys(groupedPermissions).length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Write Permissions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {permissions?.data.filter((p) =>
                  ["insert", "update", "delete", "read"].includes(
                    p.action || "",
                  ),
                ).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Read Permissions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {permissions?.data.filter((p) => p.action === "read").length ||
                  0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="resourceFilter">Filter by Resource</Label>
            <Select
              id="resourceFilter"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
            >
              <option value="">All Resources</option>
              {uniqueResources.map((resource) => (
                <option key={resource} value={resource}>
                  {getResourceIcon(resource)} {resource}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="actionFilter">Filter by Action</Label>
            <Select
              id="actionFilter"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              color="gray"
              onClick={() => {
                setResourceFilter("");
                setActionFilter("");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Permissions Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Permission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {permissions?.data.map((permission) => (
                    <tr
                      key={permission.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 text-lg text-white">
                              {getResourceIcon(
                                permission.resource || "unknown",
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {permission.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color="gray" className="capitalize">
                          {permission.resource}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          color={getActionBadgeColor(permission.action || "")}
                          className="capitalize"
                        >
                          {permission.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {new Date(permission.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {permissions && (
                <div className="p-6">
                  <Pagination
                    currentPage={permissions.pagination.page}
                    totalPages={permissions.pagination.totalPages}
                    pageSize={permissions.pagination.pageSize}
                    total={permissions.pagination.total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search permissions by name or description..."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Create Permission Modal */}
      <Modal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Create New Permission
          </h3>
          <form onSubmit={handleCreatePermission} className="space-y-4">
            <div>
              <Label htmlFor="name">Permission Name *</Label>
              <TextInput
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., View Projects"
              />
            </div>

            <div>
              <Label htmlFor="resource">Resource *</Label>
              <Select
                id="resource"
                value={formData.resource}
                onChange={(e) =>
                  setFormData({ ...formData, resource: e.target.value })
                }
                required
              >
                <option value="">Select Resource</option>
                <option value="user">👤 User</option>
                <option value="project">📁 Project</option>
                <option value="document">📄 Document</option>
                <option value="knowledge_base">🧠 Knowledge Base</option>
                <option value="chat">💬 Chat</option>
                <option value="settings">⚙️ Settings</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action *</Label>
              <Select
                id="action"
                value={formData.action}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    action: e.target.value as PermissionAction,
                  })
                }
                required
              >
                <option value={PermissionAction.READ}>
                  Read - View resource
                </option>
                <option value={PermissionAction.CREATE}>
                  Create - Add new resource
                </option>
                <option value={PermissionAction.UPDATE}>
                  Update - Modify resource
                </option>
                <option value={PermissionAction.DELETE}>
                  Delete - Remove resource
                </option>
                <option value={PermissionAction.MANAGE}>
                  Manage - Full control
                </option>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this permission allows..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Permission"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Permission Modal */}
      <Modal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="lg"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Edit Permission
          </h3>
          <form onSubmit={handleUpdatePermission} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Permission Name *</Label>
              <TextInput
                id="edit_name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_resource">Resource *</Label>
              <Select
                id="edit_resource"
                value={formData.resource}
                onChange={(e) =>
                  setFormData({ ...formData, resource: e.target.value })
                }
                required
              >
                <option value="user">👤 User</option>
                <option value="project">📁 Project</option>
                <option value="document">📄 Document</option>
                <option value="knowledge_base">🧠 Knowledge Base</option>
                <option value="chat">💬 Chat</option>
                <option value="settings">⚙️ Settings</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_action">Action *</Label>
              <Select
                id="edit_action"
                value={formData.action}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    action: e.target.value as PermissionAction,
                  })
                }
                required
              >
                <option value={PermissionAction.READ}>
                  Read - View resource
                </option>
                <option value={PermissionAction.CREATE}>
                  Create - Add new resource
                </option>
                <option value={PermissionAction.UPDATE}>
                  Update - Modify resource
                </option>
                <option value={PermissionAction.DELETE}>
                  Delete - Remove resource
                </option>
                <option value={PermissionAction.MANAGE}>
                  Manage - Full control
                </option>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Permission"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="md"
      >
        <div className="p-6">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-14 w-14 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete the permission{" "}
              <span className="font-semibold">
                &ldquo;{selectedPermission?.name}&rdquo;
              </span>
              ?
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This action cannot be undone. Roles with this permission will lose
              the assigned access.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <Button
                color="failure"
                onClick={handleDeletePermission}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button color="gray" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
