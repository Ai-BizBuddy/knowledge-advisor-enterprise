/**
 * PermissionRow Component
 *
 * Individual row component for the permissions table.
 * Now supports dynamic actions with disabled checkboxes for unavailable permissions.
 */

import React from "react";
import { Checkbox, Button } from "flowbite-react";

// Enhanced props to include dynamic actions and validation errors
export interface PermissionRowProps {
  resource: string;
  actions: Record<string, { id: string; value: boolean }>;
  availableActions: string[]; // All possible actions for table headers
  resourceActions: { action: string; id: string }[]; // Actions available for this specific resource
  onChange: (
    resource: string,
    actions: Record<string, { id: string; value: boolean }>,
  ) => void;
  className?: string;
  validationError?: string; // Validation error for this row
}

export const PermissionRow: React.FC<PermissionRowProps> = ({
  resource,
  actions,
  availableActions,
  resourceActions,
  onChange,
  className = "",
  validationError,
}) => {
  // Handle individual action checkbox change
  const handleActionChange = (action: string, checked: boolean) => {
    const newActions = { ...actions };
    if (checked) {
      const actionId =
        resourceActions.find((value) => value.action === action)?.id ?? "";
      newActions[action] = { id: actionId, value: true };
    } else {
      delete newActions[action];
    }
    onChange(resource, newActions);
  };

  // Handle toggle all actions for this resource (only available actions)
  const handleToggleAllActions = () => {
    const availableResourceActions = resourceActions;
    const allAvailableActionsChecked = availableResourceActions.every(
      (permission) => actions[permission.action].value === true,
    );

    if (allAvailableActionsChecked) {
      // If all available actions are checked, uncheck all
      const newActions = { ...actions };
      availableResourceActions.forEach((permission) => {
        delete newActions[permission.action];
      });
      onChange(resource, newActions);
    } else {
      // If not all available actions are checked, check all available ones
      const newActions = { ...actions };
      availableResourceActions.forEach((permission) => {
        newActions[permission.action].value = true;
      });
      onChange(resource, newActions);
    }
  };

  // Get resource display name with proper formatting
  const getResourceDisplayName = (resourceKey: string): string => {
    return resourceKey;
  };

  // Check if action is available for this resource
  const isActionAvailable = (action: string): boolean => {
    return resourceActions.some((permission) => permission.action === action);
  };

  // Calculate if all available actions are checked
  const allAvailableActionsChecked = resourceActions.every(
    (permission) => actions[permission.action]?.value === true,
  );

  // Check if this is a custom action (not standard CRUD)
  const isCustomAction = (actionKey: string): boolean => {
    const standardActions = ["insert", "read", "update", "delete", "admin"];
    return !standardActions.includes(actionKey.toLowerCase());
  };

  // Get action display name
  const getActionDisplayName = (actionKey: string): string => {
    const standardDisplayNames: Record<string, string> = {
      insert: "Insert",
      read: "Read",
      update: "Update",
      delete: "Delete",
      admin: "Admin",
    };

    return (
      standardDisplayNames[actionKey.toLowerCase()] ||
      actionKey.charAt(0).toUpperCase() + actionKey.slice(1).toLowerCase()
    );
  };

  // Determine if this row has validation errors
  const hasError = !!validationError;

  return (
    <>
      <tr
        className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
          hasError ? "bg-red-50 dark:bg-red-900/20" : ""
        } ${className}`}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            {/* Resource name and toggle all button */}
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-medium ${
                  hasError
                    ? "text-red-700 dark:text-red-300"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {getResourceDisplayName(resource)}
              </span>

              {/* Validation error indicator */}
              {hasError && (
                <span className="text-red-500" title={validationError}>
                  ⚠️
                </span>
              )}

              {/* Available actions count indicator */}
              <span
                className="text-xs text-gray-500 dark:text-gray-400"
                title={`${resourceActions.length} actions available`}
              >
                ({resourceActions.length})
              </span>

              {/* Toggle all actions button */}
              <Button
                size="xs"
                color={allAvailableActionsChecked ? "failure" : "success"}
                onClick={handleToggleAllActions}
                className="ml-2 opacity-70 transition-opacity hover:opacity-100"
                title={
                  allAvailableActionsChecked
                    ? `Remove all ${resource} permissions`
                    : `Grant all available ${resource} permissions`
                }
                disabled={resourceActions.length === 0}
              >
                {allAvailableActionsChecked ? "None" : "All"}
              </Button>
            </div>
          </div>
        </td>

        {/* Action checkboxes */}
        {availableActions.map((action) => {
          const isAvailable = isActionAvailable(action);
          const isCustom = isCustomAction(action);

          return (
            <td key={action} className="px-4 py-3 text-center">
              <div className="flex justify-center">
                <Checkbox
                  id={`${resource}-${action}`}
                  checked={actions[action]?.value === true}
                  disabled={!isAvailable}
                  onChange={(e) => handleActionChange(action, e.target.checked)}
                  className={`focus:ring-2 ${
                    hasError
                      ? "border-red-300 focus:ring-red-500"
                      : isCustom
                        ? "focus:ring-purple-500"
                        : "focus:ring-indigo-500"
                  } ${!isAvailable ? "cursor-not-allowed opacity-30" : ""}`}
                  title={
                    !isAvailable
                      ? `${getActionDisplayName(action)} is not available for ${getResourceDisplayName(resource)}`
                      : `${actions[action] ? "Remove" : "Grant"} ${getActionDisplayName(action)} permission for ${getResourceDisplayName(resource)}`
                  }
                />
                <label htmlFor={`${resource}-${action}`} className="sr-only">
                  {getActionDisplayName(action)} permission for{" "}
                  {getResourceDisplayName(resource)}
                  {!isAvailable && " (not available)"}
                </label>
              </div>

              {/* Unavailable indicator */}
              {!isAvailable && (
                <div
                  className="mt-1 text-xs text-gray-400"
                  title="Not available for this resource"
                >
                  N/A
                </div>
              )}
              {isAvailable && (
                <div
                  className="mt-1 text-xs text-gray-400"
                  title="Not available for this resource"
                >
                  {action}
                </div>
              )}
            </td>
          );
        })}
      </tr>

      {/* Error message row */}
      {hasError && (
        <tr>
          <td
            colSpan={availableActions.length + 1}
            className="bg-red-50 px-4 py-2 dark:bg-red-900/10"
          >
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{validationError}</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
