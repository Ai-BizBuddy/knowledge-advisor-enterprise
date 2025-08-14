"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button, Badge, Modal } from "flowbite-react";
import { usePaginatedUserManagement } from "@/hooks/usePaginatedUserManagement";
import { usePermissionResources } from "@/hooks/usePermissionResources";
import { Pagination } from "@/components/pagination";
import { dynamicPermissionMappingService as permissionMappingService } from "@/services/DynamicPermissionMappingService";
import {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
} from "@/interfaces/UserManagement";
import { RoleModal, CreateRolePayload } from "@/components/roleModal";
import { AccessLevel, PermissionRow } from "@/interfaces/RoleModal";
import { useToast } from "@/components/toast";
import { DEFAULT_PAGE_SIZE } from "@/interfaces/Pagination";

// Helper function to convert role level to access level
const levelToAccessLevel = (level: number): AccessLevel => {
  if (level >= 100) return "Super Admin";
  if (level >= 90) return "Admin";
  if (level >= 70) return "Manager";
  return "User";
};

// Helper function to transform role permissions to RoleModal format
const transformRoleToModalData = async (
  role: Role,
  permissionResources: string[],
) => {
  console.log("=== TRANSFORMING ROLE DATA ===");
  console.log("Role:", role);
  console.log("Permission Resources:", permissionResources);

  // Create base permissions structure with all available resources
  const basePermissions: PermissionRow[] = permissionResources.map(
    (resource: string) => ({
      resource,
      actions: {},
    }),
  );

  console.log("Base permissions structure:", basePermissions);

  // Map existing permissions to the new structure
  if (role.permissions && role.permissions.length > 0) {
    console.log("Role has existing permissions:", role.permissions);

    role.permissions.forEach((permission, index) => {
      console.log(`Processing permission ${index}:`, permission);

      // Use the permission's resource and action properties directly
      const resource = permission.resource;
      const action = permission.action;

      console.log(`  Resource: ${resource}, Action: ${action}`);

      if (resource && action) {
        // Find the permission row for this resource
        const permissionRow = basePermissions.find(
          (p) => p.resource === resource,
        );
        if (permissionRow) {
          // Set the action as enabled with the permission ID
          permissionRow.actions[action] = {
            id: permission.id.toString(),
            value: true,
          };
          console.log(
            `  ✓ Added ${action} for ${resource} with ID ${permission.id}`,
          );
        } else {
          console.log(`  ✗ Resource ${resource} not found in base permissions`);
        }
      } else if (permission.name) {
        // Fallback: try to parse from permission name if resource/action not available
        console.log(`  Falling back to name parsing: ${permission.name}`);
        const parts = permission.name.split(":");
        if (parts.length === 2) {
          const [resourceName, actionName] = parts;
          console.log(`  Parsed: ${resourceName}:${actionName}`);
          const permissionRow = basePermissions.find(
            (p) => p.resource === resourceName,
          );
          if (permissionRow) {
            permissionRow.actions[actionName] = {
              id: permission.id.toString(),
              value: true,
            };
            console.log(
              `  ✓ Added ${actionName} for ${resourceName} via name parsing`,
            );
          } else {
            console.log(
              `  ✗ Resource ${resourceName} not found in base permissions`,
            );
          }
        } else {
          console.log(
            `  ✗ Could not parse permission name: ${permission.name}`,
          );
        }
      } else {
        console.log(
          `  ✗ Permission has no resource/action or name:`,
          permission,
        );
      }
    });
  } else {
    console.log("Role has no existing permissions");
  }

  console.log("Final transformed permissions:", basePermissions);

  const result = {
    id: role.id.toString(),
    roleName: role.name,
    description: role.description || "",
    accessLevel: levelToAccessLevel(role.level || 50),
    permissions: basePermissions,
  };

  console.log("=== TRANSFORMATION COMPLETE ===");
  console.log("Result:", result);

  return result;
};

export default function RolesPage() {
  const {
    roles,
    permissions,
    loading,
    error,
    getRolesPaginated,
    getPermissionsPaginated,
    createRole,
    updateRole,
    deleteRole,
    clearError,
  } = usePaginatedUserManagement();

  // Fetch dynamic permission resources
  const { resources: permissionResources } = usePermissionResources();

  const { showToast } = useToast();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [transformedRoleData, setTransformedRoleData] = useState<
    | {
        id: string;
        roleName: string;
        description: string;
        accessLevel: AccessLevel;
        permissions: PermissionRow[];
      }
    | undefined
  >(undefined);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const initialLoadRef = useRef(false);

  // Load roles data with debouncing for search, immediate for initial load
  useEffect(() => {
    const loadRolesData = async () => {
      try {
        await getRolesPaginated({
          page: 1,
          pageSize,
          search: searchTerm,
        });
        if (!initialLoadRef.current) {
        }
      } catch (error) {
        console.error("Error loading roles data:", error);
      }
    };

    // Initial load without debouncing
    if (!initialLoadRef.current) {
      loadRolesData();
      return;
    }

    // Subsequent loads with debouncing
    const timeoutId = setTimeout(loadRolesData, 200);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, pageSize]); // Intentionally omitting getRolesPaginated

  // Load permissions data only once (for the modals)
  useEffect(() => {
    if (!initialLoadRef.current) {
      const loadPermissionsData = async () => {
        try {
          await getPermissionsPaginated({ page: 1, pageSize: 100 });
          initialLoadRef.current = true;
        } catch (error) {
          console.error("Error loading permissions data:", error);
        }
      };
      loadPermissionsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      getRolesPaginated({
        page,
        pageSize,
        search: searchTerm,
      });
    },
    [pageSize, searchTerm, getRolesPaginated],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      getRolesPaginated({
        page: 1,
        pageSize: newPageSize,
        search: searchTerm,
      });
    },
    [searchTerm, getRolesPaginated],
  );

  // Handle create role using new modal with enhanced error handling
  const handleCreateRoleSubmit = async (payload: CreateRolePayload) => {
    try {
      console.log("Creating role with payload:", payload);
      debugger;
      // Transform payload to match existing API
      const createRoleData: CreateRoleInput = {
        name: payload.roleName,
        description: payload.description || "",
        level:
          payload.accessLevel === "User"
            ? 50
            : payload.accessLevel === "Manager"
              ? 70
              : payload.accessLevel === "Admin"
                ? 90
                : 100,
        permission_ids: [],
      };

      // Convert role modal permissions to database permission IDs
      if (payload.permissions && payload.permissions.length > 0) {
        // Convert from CreateRolePayload format to PermissionRow format
        const permissionRows = payload.permissions.map((p) => ({
          resource: p.resource,
          actions: p.actions.reduce(
            (acc, permission) => {
              acc[permission.action] = true;
              return acc;
            },
            {} as Record<string, boolean>,
          ),
        }));

        createRoleData.permission_ids =
          await permissionMappingService.convertPermissionsToIds(
            permissionRows,
          );

        console.log("Converted permission IDs:", createRoleData.permission_ids);
        console.log("Permission rows:", permissionRows);
      }

      const newRole = await createRole(createRoleData);

      if (newRole) {
        showToast(
          `Role "${payload.roleName}" created successfully with ${createRoleData.permission_ids.length} permissions!`,
          "success",
        );
        setShowCreateModal(false);

        // Refresh the roles list to show the new role
        await getRolesPaginated({
          page: 1,
          pageSize,
          search: searchTerm,
        });
      } else {
        throw new Error("Failed to create role - no role returned from server");
      }
    } catch (error) {
      console.error("Error creating role:", error);

      // Enhanced error handling with specific error types
      let errorMessage = "Failed to create role";

      if (error instanceof Error) {
        // Check for specific error patterns
        if (
          error.message.toLowerCase().includes("duplicate") ||
          error.message.toLowerCase().includes("already exists") ||
          error.message.toLowerCase().includes("unique constraint")
        ) {
          errorMessage = `Role "${payload.roleName}" already exists. Please choose a different name.`;
        } else if (error.message.toLowerCase().includes("permission")) {
          errorMessage = `Permission error: ${error.message}`;
        } else if (
          error.message.toLowerCase().includes("unauthorized") ||
          error.message.toLowerCase().includes("forbidden")
        ) {
          errorMessage = "You don't have permission to create roles";
        } else if (
          error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, "error");

      // Re-throw to let modal handle form-specific errors
      throw new Error(errorMessage);
    }
  };

  // Handle edit role using new modal with enhanced error handling
  const handleEditRoleSubmit = async (payload: CreateRolePayload) => {
    if (!selectedRole) return;

    try {
      console.log("Updating role with payload:", payload);

      // Transform payload to match existing API
      const updateRoleData: UpdateRoleInput = {
        name: payload.roleName,
        description: payload.description || "",
        level:
          payload.accessLevel === "User"
            ? 50
            : payload.accessLevel === "Manager"
              ? 70
              : payload.accessLevel === "Admin"
                ? 90
                : 100,
        permission_ids: [],
      };

      // Convert role modal permissions to database permission IDs
      if (payload.permissions && payload.permissions.length > 0) {
        // Convert from CreateRolePayload format to PermissionRow format
        const permissionRows = payload.permissions.map((p) => ({
          resource: p.resource,
          actions: p.actions.reduce(
            (acc, permission) => {
              acc[permission.action] = true;
              return acc;
            },
            {} as Record<string, boolean>,
          ),
        }));

        updateRoleData.permission_ids =
          await permissionMappingService.convertPermissionsToIds(
            permissionRows,
          );

        console.log("Updated permission IDs:", updateRoleData.permission_ids);
        console.log("Permission rows:", permissionRows);
      }

      const updatedRole = await updateRole(selectedRole.id, updateRoleData);

      if (updatedRole) {
        showToast(
          `Role "${payload.roleName}" updated successfully with ${updateRoleData.permission_ids?.length || 0} permissions!`,
          "success",
        );
        setShowEditModal(false);
        setSelectedRole(null);

        // Refresh the roles list to show the updated role
        await getRolesPaginated({
          page: 1,
          pageSize,
          search: searchTerm,
        });
      } else {
        throw new Error("Failed to update role - no role returned from server");
      }
    } catch (error) {
      console.error("Error updating role:", error);

      // Enhanced error handling with specific error types
      let errorMessage = "Failed to update role";

      if (error instanceof Error) {
        // Check for specific error patterns
        if (
          error.message.toLowerCase().includes("duplicate") ||
          error.message.toLowerCase().includes("already exists") ||
          error.message.toLowerCase().includes("unique constraint")
        ) {
          errorMessage = `Role "${payload.roleName}" already exists. Please choose a different name.`;
        } else if (error.message.toLowerCase().includes("not found")) {
          errorMessage =
            "Role not found. It may have been deleted by another user.";
        } else if (error.message.toLowerCase().includes("permission")) {
          errorMessage = `Permission error: ${error.message}`;
        } else if (
          error.message.toLowerCase().includes("unauthorized") ||
          error.message.toLowerCase().includes("forbidden")
        ) {
          errorMessage = "You don't have permission to update this role";
        } else if (
          error.message.toLowerCase().includes("system role") ||
          error.message.toLowerCase().includes("system_role")
        ) {
          errorMessage = "System roles cannot be modified";
        } else if (
          error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, "error");

      // Re-throw to let modal handle form-specific errors
      throw new Error(errorMessage);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      const success = await deleteRole(selectedRole.id);

      if (success) {
        showToast(
          `Role "${selectedRole.name}" deleted successfully!`,
          "success",
        );
        setShowDeleteModal(false);
        setSelectedRole(null);
      } else {
        throw new Error("Failed to delete role - operation was not successful");
      }
    } catch (error) {
      console.error("Error deleting role:", error);

      // Enhanced error handling with specific error types
      let errorMessage = "Failed to delete role";

      if (error instanceof Error) {
        // Check for specific error patterns
        if (error.message.toLowerCase().includes("not found")) {
          errorMessage = "Role not found. It may have already been deleted.";
        } else if (
          error.message.toLowerCase().includes("in use") ||
          error.message.toLowerCase().includes("assigned") ||
          error.message.toLowerCase().includes("users")
        ) {
          errorMessage =
            "Cannot delete role because it is assigned to users. Please reassign users first.";
        } else if (
          error.message.toLowerCase().includes("system role") ||
          error.message.toLowerCase().includes("system_role")
        ) {
          errorMessage = "System roles cannot be deleted";
        } else if (
          error.message.toLowerCase().includes("unauthorized") ||
          error.message.toLowerCase().includes("forbidden")
        ) {
          errorMessage = "You don't have permission to delete this role";
        } else if (
          error.message.toLowerCase().includes("network") ||
          error.message.toLowerCase().includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, "error");
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const openEditModal = async (role: Role) => {
    setSelectedRole(role);

    // Wait for permission resources to be loaded if they aren't already
    if (permissionResources.length === 0) {
      console.warn("Permission resources not loaded yet, waiting...");
      // You might want to show a loading state here
      // For now, we'll proceed with empty resources and they'll be filled later
    }

    // Transform role data asynchronously
    const transformed = await transformRoleToModalData(
      role,
      permissionResources,
    );
    setTransformedRoleData(transformed);
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  // Utility functions
  const getLevelBadgeColor = (level: number) => {
    if (level >= 90) return "failure";
    if (level >= 70) return "warning";
    if (level >= 50) return "info";
    return "success";
  };

  const getLevelLabel = (level: number) => {
    if (level >= 100) return "Super Admin";
    if (level >= 90) return "Admin";
    if (level >= 70) return "Manager";
    if (level >= 50) return "Standard";
    if (level >= 30) return "Limited";
    return "Basic";
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-red-500">Error loading roles</div>
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
            Roles Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure user roles and permission levels
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
          Create Role
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Roles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roles?.pagination.total || 0}
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                System Roles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roles?.data.filter((r) => r.is_system_role).length || 0}
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
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Admin Roles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roles?.data.filter((r) => (r.level || 0) >= 90).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Roles Table */}
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
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {roles?.data.map((role) => (
                    <tr
                      key={role.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 font-semibold text-white">
                              {role.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {role.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={getLevelBadgeColor(role.level || 0)}>
                          {getLevelLabel(role.level || 0)} ({role.level || 0})
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                        {role.permissions?.length || 0} permissions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={role.is_system_role ? "blue" : "gray"}>
                          {role.is_system_role ? "System" : "Custom"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {new Date(role.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            size="xs"
                            color="gray"
                            onClick={() => openEditModal(role)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            color="alternative"
                            disabled={role.is_system_role}
                            onClick={() => openDeleteModal(role)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {roles && (
                <div className="p-6">
                  <Pagination
                    currentPage={roles.pagination.page}
                    totalPages={roles.pagination.totalPages}
                    pageSize={roles.pagination.pageSize}
                    total={roles.pagination.total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search roles by name or description..."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Create Role Modal - Fixed Implementation */}
      <RoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRoleSubmit}
        loading={loading}
      />

      {/* Edit Role Modal - Using same RoleModal component */}
      <RoleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setTransformedRoleData(undefined);
        }}
        onSubmit={handleEditRoleSubmit}
        loading={loading}
        mode="edit"
        initialData={transformedRoleData}
      />

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
              Are you sure you want to delete the role{" "}
              <span className="font-semibold">
                &ldquo;{selectedRole?.name}&rdquo;
              </span>
              ?
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This action cannot be undone. Users with this role will lose their
              assigned permissions.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <Button
                color="failure"
                onClick={handleDeleteRole}
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
