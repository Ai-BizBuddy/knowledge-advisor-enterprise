/**
 * Role Permissions Table Component
 *
 * Interactive table for managing role permissions with real-time updates
 * and form integration using React Hook Form.
 */

import React, { useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useReactHookForm } from "@/hooks/useReactHookForm";
import { useToast } from "@/components/toast";
import UserManagementService from "@/services/UserManagementService";
import type { Permission } from "@/interfaces/UserManagement";
import type {
  PermissionsTableProps,
  PermissionsFormValues,
  PermissionSelection,
  GroupedPermissions,
  PermissionRowData,
} from "@/interfaces/Permissions";

const STANDARD_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "ADMIN"];

/**
 * PermissionsTable Component
 */
export const PermissionsTable: React.FC<PermissionsTableProps> = ({
  selectedPermissions = [],
  onPermissionChange,
  readonly = false,
  showSummary = true,
  className = "",
}) => {
  const { showToast } = useToast();

  // Use memoized service to prevent re-creation on every render
  const userManagementService = useMemo(() => new UserManagementService(), []);

  // Form state management
  const form = useReactHookForm<PermissionsFormValues>({
    defaultValues: {
      selectedPermissions: {},
    },
  });

  // Local state for permissions data and metadata
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [resourceMetadata, setResourceMetadata] = React.useState<{
    [resource: string]: { icon: string; displayName: string };
  }>({});
  const [actionDisplayMap, setActionDisplayMap] = React.useState<{
    [action: string]: string;
  }>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /**
   * Load all permissions and metadata from Supabase
   */
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading permissions and metadata from database...");

      // Load permissions, resource metadata, and action display mappings in parallel
      const [permissionsData, resourceMeta, actionMappings] = await Promise.all(
        [
          userManagementService.getPermissions(),
          userManagementService.getResourceMetadata(),
          userManagementService.getActionDisplayMappings(),
        ],
      );

      console.log("Loaded permissions:", permissionsData);
      console.log("Loaded resource metadata:", resourceMeta);
      console.log("Loaded action mappings:", actionMappings);

      setPermissions(permissionsData);
      setResourceMetadata(resourceMeta);
      setActionDisplayMap(actionMappings);

      // Initialize form with current selections
      const initialSelection: PermissionSelection = {};
      selectedPermissions.forEach((id) => {
        initialSelection[id] = true;
      });

      form.setValue("selectedPermissions", initialSelection);
      console.log("Initialized form with selections:", initialSelection);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load permissions";
      console.error("Error loading permissions:", err);
      setError(errorMessage);
      showToast("Error: " + errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [selectedPermissions, form, showToast, userManagementService]);

  // Load permissions on component mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Group permissions by resource and normalize actions
   */
  const groupedPermissions = useMemo((): GroupedPermissions => {
    const grouped: GroupedPermissions = {};

    permissions.forEach((permission) => {
      if (!permission.resource) return;

      const resource = permission.resource;
      if (!grouped[resource]) {
        grouped[resource] = {
          permissions: [],
          hasAllActions: false,
          availableActions: [],
        };
      }

      grouped[resource].permissions.push(permission);

      // Track available actions for this resource
      if (permission.action) {
        const normalizedAction =
          actionDisplayMap[permission.action] ||
          permission.action.toUpperCase();
        if (!grouped[resource].availableActions.includes(normalizedAction)) {
          grouped[resource].availableActions.push(normalizedAction);
        }
      }
    });

    // Check if each resource has all standard actions
    Object.keys(grouped).forEach((resource) => {
      const availableActions = grouped[resource].availableActions;
      grouped[resource].hasAllActions = STANDARD_ACTIONS.every((action) =>
        availableActions.includes(action),
      );
    });

    return grouped;
  }, [permissions, actionDisplayMap]);

  /**
   * Transform grouped permissions into table row data
   */
  const tableData = useMemo((): PermissionRowData[] => {
    return Object.entries(groupedPermissions)
      .map(([resource, data]) => {
        const permissions: { [action: string]: Permission | null } = {};

        // Initialize all standard actions
        STANDARD_ACTIONS.forEach((action) => {
          permissions[action] = null;
        });

        // Map permissions to their actions
        data.permissions.forEach((permission) => {
          if (permission.action) {
            const normalizedAction =
              actionDisplayMap[permission.action] ||
              permission.action.toUpperCase();
            if (STANDARD_ACTIONS.includes(normalizedAction)) {
              permissions[normalizedAction] = permission;
            }
          }
        });

        // Get resource metadata or create fallback
        const metadata = resourceMetadata[resource] || {
          icon: "📋",
          displayName:
            resource.charAt(0).toUpperCase() +
            resource.slice(1).replace(/-/g, " "),
        };

        return {
          resource,
          displayName: metadata.displayName,
          icon: metadata.icon,
          permissions,
          hasAllActions: data.hasAllActions,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [groupedPermissions, resourceMetadata, actionDisplayMap]);

  /**
   * Get current permission selection from form
   */
  const currentSelection = form.watch("selectedPermissions");

  /**
   * Calculate selection summary
   */
  const selectionSummary = useMemo(() => {
    const selectedCount =
      Object.values(currentSelection).filter(Boolean).length;
    const resourcesWithSelections = new Set();

    Object.entries(currentSelection).forEach(
      ([permissionIdStr, isSelected]) => {
        if (isSelected) {
          const permissionId = parseInt(permissionIdStr);
          const permission = permissions.find((p) => p.id === permissionId);
          if (permission?.resource) {
            resourcesWithSelections.add(permission.resource);
          }
        }
      },
    );

    return {
      permissionCount: selectedCount,
      resourceCount: resourcesWithSelections.size,
    };
  }, [currentSelection, permissions]);

  /**
   * Handle checkbox change for individual permissions
   */
  const handlePermissionToggle = useCallback(
    (permissionId: number, checked: boolean) => {
      if (readonly) return;

      console.log(`Permission toggle: ID ${permissionId}, checked: ${checked}`);

      const current = form.getValues("selectedPermissions");
      const updated = {
        ...current,
        [permissionId]: checked,
      };

      form.setValue("selectedPermissions", updated);

      // Call parent callback with updated permission IDs
      if (onPermissionChange) {
        const selectedIds = Object.entries(updated)
          .filter(([, isSelected]) => isSelected)
          .map(([id]) => parseInt(id));

        console.log("Calling onPermissionChange with IDs:", selectedIds);
        onPermissionChange(selectedIds);
      }
    },
    [form, onPermissionChange, readonly],
  );

  /**
   * Handle "All" toggle for a resource
   */
  const handleResourceToggleAll = useCallback(
    (resource: string) => {
      if (readonly) return;

      const resourcePermissions =
        groupedPermissions[resource]?.permissions || [];
      const current = form.getValues("selectedPermissions");

      // Check if all permissions for this resource are currently selected
      const allSelected = resourcePermissions.every((p) => current[p.id]);

      // Toggle all permissions for this resource
      const updated = { ...current };
      resourcePermissions.forEach((permission) => {
        updated[permission.id] = !allSelected;
      });

      form.setValue("selectedPermissions", updated);

      // Call parent callback
      if (onPermissionChange) {
        const selectedIds = Object.entries(updated)
          .filter(([, isSelected]) => isSelected)
          .map(([id]) => parseInt(id));
        onPermissionChange(selectedIds);
      }
    },
    [form, groupedPermissions, onPermissionChange, readonly],
  );

  /**
   * Check if all permissions for a resource are selected
   */
  const isResourceFullySelected = useCallback(
    (resource: string): boolean => {
      const resourcePermissions =
        groupedPermissions[resource]?.permissions || [];
      return (
        resourcePermissions.length > 0 &&
        resourcePermissions.every((p) => currentSelection[p.id])
      );
    },
    [groupedPermissions, currentSelection],
  );

  /**
   * Check if some (but not all) permissions for a resource are selected
   */
  const isResourcePartiallySelected = useCallback(
    (resource: string): boolean => {
      const resourcePermissions =
        groupedPermissions[resource]?.permissions || [];
      const selectedCount = resourcePermissions.filter(
        (p) => currentSelection[p.id],
      ).length;
      return selectedCount > 0 && selectedCount < resourcePermissions.length;
    },
    [groupedPermissions, currentSelection],
  );

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl ${className}`}
    >
      {/* Header with summary */}
      <div className="border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Configure access permissions for this role
            </h3>
          </div>
          {showSummary && (
            <div className="text-sm text-slate-400">
              {selectionSummary.permissionCount} permissions selected across{" "}
              {selectionSummary.resourceCount} resources
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="min-w-[200px] px-6 py-3 text-left text-sm font-medium text-slate-300">
                RESOURCE ({tableData.length} TOTAL)
              </th>
              {STANDARD_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="w-20 px-4 py-3 text-center text-sm font-medium text-slate-300"
                >
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <motion.tr
                key={row.resource}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
              >
                {/* Resource column */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <span
                      className="text-lg"
                      role="img"
                      aria-label={row.resource}
                    >
                      {row.icon}
                    </span>
                    <div>
                      <div className="font-medium text-slate-200">
                        {row.displayName}
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <button
                          onClick={() => handleResourceToggleAll(row.resource)}
                          disabled={readonly}
                          className={`rounded px-2 py-1 text-xs transition-colors ${
                            isResourceFullySelected(row.resource)
                              ? "bg-indigo-500/20 text-indigo-300"
                              : isResourcePartiallySelected(row.resource)
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                          } ${readonly ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        >
                          {isResourceFullySelected(row.resource)
                            ? "All"
                            : "None"}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Action columns */}
                {STANDARD_ACTIONS.map((action) => {
                  const permission = row.permissions[action];
                  const isSelected = permission
                    ? currentSelection[permission.id]
                    : false;

                  return (
                    <td key={action} className="px-4 py-4 text-center">
                      {permission ? (
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handlePermissionToggle(
                                permission.id,
                                e.target.checked,
                              )
                            }
                            disabled={readonly}
                            className={`form-checkbox h-4 w-4 rounded border-slate-600 ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-500/20 text-indigo-500"
                                : "border-slate-600 bg-slate-800 text-slate-600"
                            } focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 ${readonly ? "cursor-not-allowed opacity-50" : "cursor-pointer"} transition-colors`}
                          />
                          <span className="sr-only">
                            {action} permission for {row.displayName}
                          </span>
                        </label>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
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

      {/* Form errors */}
      {form.formState.errors.selectedPermissions && (
        <div className="border-t border-slate-700/50 px-6 py-3">
          <div className="text-sm text-red-400">
            {form.formState.errors.selectedPermissions.message}
          </div>
        </div>
      )}
    </motion.div>
  );
};
