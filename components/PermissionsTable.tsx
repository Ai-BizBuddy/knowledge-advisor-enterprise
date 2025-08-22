/**
 * Role Permissions Table Component
 *
 * Interactive table for managing role permissions with user-table-like interface
 * featuring View, Edit, Delete actions for each permission entry.
 */

import React, { useMemo, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Button,
  Badge,
  Modal,
  Label,
  TextInput,
  Textarea,
  Card,
  Table,
} from "flowbite-react";
import { useToast } from "@/components/toast";
import UserManagementService from "@/services/UserManagementService";
import type { Permission } from "@/interfaces/UserManagement";

interface PermissionTableRow {
  id: number;
  resource: string;
  action: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  displayName: string;
  icon: string;
}

interface PermissionModalData {
  id?: number;
  resource: string;
  action: string;
  description: string;
}

interface PermissionsTableProps {
  selectedPermissions?: number[];
  onPermissionChange?: (permissionIds: number[]) => void;
  readonly?: boolean;
  showSummary?: boolean;
  className?: string;
}

/**
 * PermissionsTable Component
 */
export const PermissionsTable: React.FC<PermissionsTableProps> = ({
  selectedPermissions = [],
  readonly = false,
  className = "",
}) => {
  const { showToast } = useToast();

  // Use memoized service to prevent re-creation on every render
  const userManagementService = useMemo(() => new UserManagementService(), []);

  // State management
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionTableRow | null>(null);

  // Modal form data
  const [modalData, setModalData] = useState<PermissionModalData>({
    resource: "",
    action: "",
    description: "",
  });

  /**
   * Load all permissions from Supabase
   */
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading permissions from database...");
      const permissionsData = await userManagementService.getPermissions();

      console.log("Loaded permissions:", permissionsData);
      setPermissions(permissionsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load permissions";
      console.error("Error loading permissions:", err);
      setError(errorMessage);
      showToast("Error: " + errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, userManagementService]);

  // Load permissions on component mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Transform permissions into table row data
   */
  const tableData = useMemo((): PermissionTableRow[] => {
    return permissions
      .map((permission) => ({
        id: permission.id,
        resource: permission.resource || "Unknown",
        action: permission.action || "Unknown",
        description: permission.description || "",
        isActive: selectedPermissions.includes(permission.id),
        createdAt: permission.created_at,
        displayName: `${permission.resource} - ${permission.action}`,
        icon: getResourceIcon(permission.resource || ""),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [permissions, selectedPermissions]);

  /**
   * Get icon for resource type
   */
  const getResourceIcon = (resource: string): string => {
    const iconMap: Record<string, string> = {
      users: "👥",
      roles: "🔒",
      documents: "📄",
      projects: "📁",
      "knowledge-base": "🧠",
      settings: "⚙️",
      dashboard: "📊",
      reports: "📈",
    };
    return iconMap[resource] || "📋";
  };

  /**
   * Get badge color for permission status
   */
  const getStatusBadgeColor = (isActive: boolean): string => {
    return isActive ? "success" : "gray";
  };

  /**
   * Modal handlers
   */
  const openViewModal = (permission: PermissionTableRow) => {
    setSelectedPermission(permission);
    setModalData({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || "",
    });
    setShowViewModal(true);
  };

  const openEditModal = (permission: PermissionTableRow) => {
    setSelectedPermission(permission);
    setModalData({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      description: permission.description || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (permission: PermissionTableRow) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
  };

  /**
   * Calculate summary
   */
  const summary = useMemo(() => {
    const activeCount = tableData.filter((row) => row.isActive).length;
    const totalCount = tableData.length;
    const resourceCount = new Set(
      tableData.filter((row) => row.isActive).map((row) => row.resource),
    ).size;

    return {
      activeCount,
      totalCount,
      resourceCount,
    };
  }, [tableData]);

  // Log summary for debugging
  console.log("Permissions summary:", summary);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-slate-400">Loading permissions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <div className="font-medium text-red-400">
          Error loading permissions
        </div>
        <div className="mt-1 text-sm text-red-300">{error}</div>
        <button
          onClick={loadPermissions}
          className="mt-3 rounded-md bg-red-500/20 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <Table hoverable>
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Permission
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Resource
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="hidden px-6 py-3 lg:table-cell">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((permission, index) => (
                  <motion.tr
                    key={permission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    {/* Permission column */}
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                          <span
                            className="text-sm"
                            role="img"
                            aria-label={permission.resource}
                          >
                            {permission.icon}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.displayName}
                          </div>
                          {permission.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Resource column */}
                    <td className="px-6 py-4">
                      <Badge color="purple" className="justify-center">
                        {permission.resource}
                      </Badge>
                    </td>

                    {/* Action column */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {permission.action}
                      </span>
                    </td>

                    {/* Status column */}
                    <td className="px-6 py-4">
                      <Badge
                        className="justify-center"
                        color={getStatusBadgeColor(permission.isActive)}
                      >
                        {permission.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* Created column */}
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="xs"
                          color="blue"
                          onClick={() => openViewModal(permission)}
                          className="flex items-center gap-1"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        {!readonly && (
                          <>
                            <Button
                              size="xs"
                              color="gray"
                              onClick={() => openEditModal(permission)}
                              className="flex items-center gap-1"
                            >
                              <svg
                                className="h-3 w-3"
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
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              size="xs"
                              color="alternative"
                              onClick={() => openDeleteModal(permission)}
                              className="flex items-center gap-1"
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </div>

      {/* Empty state */}
      {tableData.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-lg text-slate-400">No permissions available</div>
          <div className="mt-1 text-sm text-slate-500">
            Permissions will appear here once they are configured in the system.
          </div>
        </div>
      )}

      {/* View Permission Modal */}
      <Modal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        size="lg"
      >
        <div className="p-6">
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
            Permission Details
          </h3>
          {selectedPermission && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Resource</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedPermission.resource}
                  </p>
                </div>
                <div>
                  <Label>Action</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedPermission.action}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge
                      color={getStatusBadgeColor(selectedPermission.isActive)}
                    >
                      {selectedPermission.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(
                      selectedPermission.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {selectedPermission.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedPermission.description}
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                {!readonly && (
                  <Button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedPermission);
                    }}
                  >
                    Edit Permission
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Permission Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Edit Permission
          </h3>
          <form className="space-y-4">
            <div>
              <Label htmlFor="edit_resource">Resource *</Label>
              <TextInput
                id="edit_resource"
                value={modalData.resource}
                onChange={(e) =>
                  setModalData((prev) => ({
                    ...prev,
                    resource: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_action">Action *</Label>
              <TextInput
                id="edit_action"
                value={modalData.action}
                onChange={(e) =>
                  setModalData((prev) => ({ ...prev, action: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={modalData.description}
                onChange={(e) =>
                  setModalData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Permission</Button>
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
              className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this permission?
            </h3>
            {selectedPermission && (
              <p className="mb-5 text-sm text-gray-400 dark:text-gray-500">
                <span className="font-semibold">
                  {selectedPermission.displayName}
                </span>
                <br />
                This action cannot be undone.
              </p>
            )}
            <div className="flex justify-center gap-4">
              <Button color="failure">Yes, delete</Button>
              <Button color="gray" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
