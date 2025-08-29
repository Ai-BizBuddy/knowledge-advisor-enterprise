'use client';

import { usePermissionDataWithFallback } from '@/hooks';
import { Card } from 'flowbite-react';
import React from 'react';
import { ActionHeader } from './ActionHeader';
import { PermissionRow } from './PermissionRow';

// Updated interfaces for new data structure
export interface PermissionRowData {
  resource: string;
  actions: Record<string, { id: string; value: boolean }>;
}

export interface PermissionsTableProps {
  permissions: PermissionRowData[];
  onChange: (permissions: PermissionRowData[]) => void;
  className?: string;
  validationErrors?: {
    [resource: string]: string;
  };
}

export const PermissionsTable: React.FC<PermissionsTableProps> = ({
  permissions,
  onChange,
  className = '',
  validationErrors,
}) => {
  // Get dynamic permission data from Supabase with enhanced structure
  const {
    resources,
    actions,
    loading,
    error,
    getActionsForResource,
    getStandardActions,
  } = usePermissionDataWithFallback();

  // Handle individual permission row change
  const handlePermissionRowChange = (
    resource: string,
    actions: Record<string, { id: string; value: boolean }>,
  ) => {
    const newPermissions = permissions.map((permission) =>
      permission.resource === resource
        ? { ...permission, actions }
        : permission,
    );
    onChange(newPermissions);
  };

  // Handle toggle all resources for a specific action
  const handleToggleAllForAction = (action: string, checked: boolean) => {
    const newPermissions = permissions.map((permission) => {
      // Only toggle if this resource supports the action
      const resourceActions = getActionsForResource(permission.resource);
      const actionAvailable = resourceActions.some(
        (per) => per.action === action,
      );

      if (!actionAvailable) {
        return permission; // Don't change if action not available
      }

      const value = checked
        ? { id: permission.actions[action]?.id, value: true }
        : undefined;
      return {
        ...permission,
        actions: {
          ...permission.actions,
          [action]: value,
        },
      };
    });

    // Clean up undefined values
    const cleanedPermissions = newPermissions.map(
      (permission) =>
        ({
          ...permission,
          actions: Object.fromEntries(
            Object.entries(permission.actions).filter(([id, value]) => ({
              id: id,
              value: value?.value === true,
            })),
          ),
        }) as PermissionRowData,
    );

    onChange(cleanedPermissions);
  };

  // Get all unique actions across all resources (for table headers)
  const allAvailableActions = React.useMemo(() => {
    const standardActions = getStandardActions();
    const allActions = new Set(standardActions);
    actions.forEach((action) => allActions.add(action));
    return Array.from(allActions);
  }, [actions, getStandardActions]);

  // Count total selected permissions for display
  const totalSelectedPermissions = permissions.reduce((total, permission) => {
    return total + Object.values(permission.actions).filter(Boolean).length;
  }, 0);

  // Count available permissions
  const totalAvailablePermissions = React.useMemo(() => {
    let total = 0;
    resources.forEach((resource) => {
      const resourceActions = getActionsForResource(resource);
      total += resourceActions.length;
    });
    return total;
  }, [resources, getActionsForResource]);

  // Show loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className='overflow-hidden'>
          <div className='flex items-center justify-center p-8'>
            <div className='flex items-center space-x-2'>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent'></div>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Loading permissions from Supabase...
              </span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state with fallback notice
  if (error) {
    console.warn('Permission data error, using fallback constants:', error);
  }

  return (
    <div className={'space-y-4 p-0'}>
      {/* Permissions summary */}
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            Configure access permissions for this role
          </p>
        </div>
        <div className='text-right'>
          <span className='text-sm font-medium text-indigo-600 dark:text-indigo-400'>
            {totalSelectedPermissions} of {totalAvailablePermissions}{' '}
            permissions selected
          </span>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            {resources.length} resources, {allAvailableActions.length} action
            types available
          </p>
        </div>
      </div>

      {/* Permissions table */}
      <Card
        className='overflow-hidden p-0'
        theme={{
          root: {
            children: 'p-0', // removes padding inside
          },
        }}
      >
        <div className={`p-0 ${className} overflow-x-auto`}>
          <table className='w-full divide-y divide-gray-200 dark:divide-gray-700'>
            {/* Table header */}
            <thead className='bg-gray-50 dark:bg-gray-800'>
              <tr>
                {/* Resource column header */}
                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                  <div className='flex items-center space-x-2'>
                    <span>Resource</span>
                    <div className='text-xs text-gray-400 dark:text-gray-500'>
                      ({resources.length} total)
                    </div>
                  </div>
                </th>

                {/* Action column headers with toggle all functionality */}
                {allAvailableActions.map((action: string) => (
                  <ActionHeader
                    key={action}
                    action={action}
                    allResources={resources}
                    permissions={permissions}
                    onToggleAll={handleToggleAllForAction}
                  />
                ))}
              </tr>
            </thead>

            {/* Table body */}
            <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
              {permissions.map((permission) => (
                <PermissionRow
                  key={permission.resource}
                  resource={permission.resource}
                  actions={permission.actions}
                  availableActions={allAvailableActions}
                  resourceActions={getActionsForResource(permission.resource)}
                  onChange={handlePermissionRowChange}
                  validationError={validationErrors?.[permission.resource]}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action types legend */}
      <div className='flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
        <div className='text-sm text-gray-600 dark:text-gray-400'>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <div className='h-2 w-2 rounded-full bg-indigo-500'></div>
              <span>Standard Actions (Create, Read, Update, Delete)</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='h-2 w-2 rounded-full bg-purple-500'></div>
              <span>Custom Actions</span>
            </div>
          </div>
          <p className='mt-1 text-xs'>
            Use column headers to toggle all resources for an action, or
            resource buttons to toggle all actions for a resource. Disabled
            checkboxes indicate actions not available for that resource.
          </p>
        </div>

        <div className='flex space-x-2'>
          <button
            type='button'
            onClick={() => {
              // Grant all available permissions for each resource
              const allPermissions = resources.map((resource) => {
                const resourceActions = getActionsForResource(resource);
                const actions = resourceActions.reduce(
                  (
                    acc: Record<string, { id: string; value: boolean }>,
                    permission: { action: string; id: string },
                  ) => {
                    acc[permission.action] = { id: permission.id, value: true };
                    return acc;
                  },
                  {},
                );
                return { resource, actions };
              });
              onChange(allPermissions);
            }}
            className='px-3 py-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300'
          >
            Grant All Available
          </button>

          <span className='text-gray-300 dark:text-gray-600'>|</span>

          <button
            type='button'
            onClick={() => {
              // Remove all permissions
              const noPermissions = resources.map((resource) => ({
                resource,
                actions: {},
              }));
              onChange(noPermissions);
            }}
            className='px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
          >
            Remove All
          </button>
        </div>
      </div>

      {/* Accessibility note */}
      <div className='sr-only' aria-live='polite'>
        {totalSelectedPermissions} permissions selected across{' '}
        {permissions.filter((p) => Object.keys(p.actions).length > 0).length}{' '}
        resources
      </div>
    </div>
  );
};
