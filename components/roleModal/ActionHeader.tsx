/**
 * ActionHeader Component
 *
 * Header component for permission table columns with toggle all functionality.
 * Now supports dynamic actions including standard CRUD + custom actions.
 */

import React from 'react';
import { Checkbox } from 'flowbite-react';

export interface ActionHeaderProps {
  action: string;
  allResources: string[];
  permissions: Array<{
    resource: string;
    actions: Record<string, { id: string; value: boolean }>;
  }>;
  onToggleAll: (action: string, checked: boolean) => void;
  className?: string;
}

export const ActionHeader: React.FC<ActionHeaderProps> = ({
  action,
  allResources,
  permissions,
  onToggleAll,
  className = '',
}) => {
  // Calculate if all resources have this action enabled
  const allChecked = allResources.every((resource) => {
    const permissionRow = permissions.find((p) => p.resource === resource);
    return permissionRow?.actions[action]?.value === true;
  });

  // Calculate if some (but not all) resources have this action enabled
  const someChecked =
    allResources.some((resource) => {
      const permissionRow = permissions.find((p) => p.resource === resource);
      return permissionRow?.actions[action]?.value === true;
    }) && !allChecked;

  // Handle toggle all checkbox change
  const handleToggleAll = (checked: boolean) => {
    onToggleAll(action, checked);
  };

  // Get action display name with proper capitalization
  const getActionDisplayName = (actionKey: string): string => {
    // Handle standard CRUD actions
    const standardDisplayNames: Record<string, string> = {
      insert: 'Insert',
      read: 'Read',
      update: 'Update',
      delete: 'Delete',
      admin: 'Admin',
    };

    // Return standard name if it exists, otherwise capitalize first letter
    return (
      standardDisplayNames[actionKey.toLowerCase()] || ''
      // actionKey.charAt(0).toUpperCase() + actionKey.slice(1).toLowerCase()
    );
  };

  // Get action description for tooltip
  const getActionDescription = (actionKey: string): string => {
    const standardDescriptions: Record<string, string> = {
      create: 'Permission to create new items',
      read: 'Permission to view and read items',
      update: 'Permission to modify existing items',
      delete: 'Permission to remove items',
      admin: 'Full administrative access to manage items',
    };

    // Return standard description if it exists, otherwise create generic one
    return (
      standardDescriptions[actionKey.toLowerCase()] ||
      `Permission to perform ${actionKey} action on items`
    );
  };

  // Check if this is a custom action (not standard CRUD)
  const isCustomAction = (actionKey: string): boolean => {
    const standardActions = ['insert', 'read', 'update', 'delete'];
    return !standardActions.includes(actionKey.toLowerCase());
  };

  return (
    <th className={`px-4 py-3 text-center ${className}`}>
      <div className='flex flex-col items-center space-y-2'>
        {/* Action label with custom action indicator */}
        <div className='flex flex-col items-center'>
          <span
            className={`text-xs font-medium tracking-wider uppercase ${
              isCustomAction(action)
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-900 dark:text-white'
            }`}
            title={getActionDescription(action)}
          >
            {getActionDisplayName(action)}
          </span>

          {/* Custom action indicator */}
          {isCustomAction(action) && (
            <span className='text-xs font-normal text-purple-500 dark:text-purple-400'>
              Custom
            </span>
          )}
        </div>

        {/* Toggle all checkbox */}
        <div className='flex items-center'>
          <Checkbox
            id={`toggle-all-${action}`}
            checked={allChecked}
            onChange={(e) => handleToggleAll(e.target.checked)}
            className={`focus:ring-2 ${
              isCustomAction(action)
                ? 'focus:ring-purple-500'
                : 'focus:ring-indigo-500'
            }`}
            title={`Toggle ${getActionDisplayName(action)} for all resources`}
            // Handle indeterminate state for visual feedback
            ref={(el) => {
              if (el) {
                el.indeterminate = someChecked;
              }
            }}
          />
          <label
            htmlFor={`toggle-all-${action}`}
            className='sr-only ml-1 text-xs text-gray-500 dark:text-gray-400'
          >
            Toggle all {getActionDisplayName(action)}
          </label>
        </div>

        {/* Visual indicator for partial selection */}
        {someChecked && (
          <div
            className={`h-0.5 w-2 rounded-full ${
              isCustomAction(action) ? 'bg-purple-500' : 'bg-indigo-500'
            }`}
            title='Some resources selected'
          />
        )}
      </div>
    </th>
  );
};
