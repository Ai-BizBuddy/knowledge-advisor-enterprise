'use client';

import { TableSearch } from '@/components';
import { Pagination } from '@/components/pagination';
import { CreateRolePayload, RoleModal } from '@/components/roleModal';
import { useToast } from '@/components/toast';
import { useJWTPermissions } from '@/hooks';
import { usePaginatedUserManagement } from '@/hooks/usePaginatedUserManagement';
import { usePermissionResources } from '@/hooks/usePermissionResources';
import { DEFAULT_PAGE_SIZE } from '@/interfaces/Pagination';
import { PermissionRow } from '@/interfaces/RoleModal';
import {
  CreateRoleInput,
  Role,
  UpdateRoleInput,
} from '@/interfaces/UserManagement';
import { dynamicPermissionMappingService as permissionMappingService } from '@/services/DynamicPermissionMappingService';
import { Button, Modal } from 'flowbite-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Helper function to transform role permissions to RoleModal format
const transformRoleToModalData = async (
  role: Role,
  permissionResources: string[],
) => {
  // Create base permissions structure with all available resources
  const basePermissions: PermissionRow[] = permissionResources.map(
    (resource: string) => ({
      resource,
      actions: {},
    }),
  );

  // Map existing permissions to the new structure
  if (role.permissions && role.permissions.length > 0) {
    role.permissions.forEach((permission) => {
      // Use the permission's resource and action properties directly
      const resource = permission.resource;
      const action = permission.action;

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
        }
      } else if (permission.name) {
        // Fallback: try to parse from permission name if resource/action not available
        const parts = permission.name.split(':');
        if (parts.length === 2) {
          const [resourceName, actionName] = parts;
          const permissionRow = basePermissions.find(
            (p) => p.resource === resourceName,
          );
          if (permissionRow) {
            permissionRow.actions[actionName] = {
              id: permission.id.toString(),
              value: true,
            };
          }
        }
      }
    });
  }

  const result = {
    id: role.id.toString(),
    roleName: role.name,
    description: role.description || '',
    permissions: basePermissions,
  };

  return result;
};

export default function RolesPage() {
  // Get JWT permissions for conditional rendering
  const { hasAnyPermission } = useJWTPermissions();
  
  // Check for role-related permissions
  // Note: Based on your JWT example, there are no specific role permissions like 'role:create'
  // So we'll use user management permissions as a proxy
  const canManageRoles = hasAnyPermission(['user:create', 'user:update', 'user:delete']);
  
  const {
    roles,
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
        permissions: PermissionRow[];
      }
    | undefined
  >(undefined);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
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
      } catch {
        // Handle error silently
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
        } catch {
          // Handle error silently
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

  // Handle create role using new modal with enhanced error handling
  const handleCreateRoleSubmit = async (payload: CreateRolePayload) => {
    try {
      // Transform payload to match existing API
      const createRoleData: CreateRoleInput = {
        name: payload.roleName,
        description: payload.description || '',
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

                      }

      const newRole = await createRole(createRoleData);

      if (newRole) {
        showToast(
          `Role '${payload.roleName}' created successfully with ${createRoleData.permission_ids.length} permissions!`,
          'success',
        );
        setShowCreateModal(false);

        // Refresh the roles list to show the new role
        await getRolesPaginated({
          page: 1,
          pageSize,
          search: searchTerm,
        });
      } else {
        throw new Error('Failed to create role - no role returned from server');
      }
    } catch (error) {
      // Enhanced error handling with specific error types
      let errorMessage = 'Failed to create role';

      if (error instanceof Error) {
        // Check for specific error patterns
        if (
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('unique constraint')
        ) {
          errorMessage = `Role '${payload.roleName}' already exists. Please choose a different name.`;
        } else if (error.message.toLowerCase().includes('permission')) {
          errorMessage = `Permission error: ${error.message}`;
        } else if (
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('forbidden')
        ) {
          errorMessage = "You don't have permission to create roles";
        } else if (
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');

      // Re-throw to let modal handle form-specific errors
      throw new Error(errorMessage);
    }
  };

  // Handle edit role using new modal with enhanced error handling
  const handleEditRoleSubmit = async (payload: CreateRolePayload) => {
    if (!selectedRole) return;

    try {
      
      // Transform payload to match existing API
      const updateRoleData: UpdateRoleInput = {
        name: payload.roleName,
        description: payload.description || '',
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

                      }

      const updatedRole = await updateRole(selectedRole.id, updateRoleData);

      if (updatedRole) {
        showToast(
          `Role '${payload.roleName}' updated successfully with ${updateRoleData.permission_ids?.length || 0} permissions!`,
          'success',
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
        throw new Error('Failed to update role - no role returned from server');
      }
    } catch (error) {
      
      // Enhanced error handling with specific error types
      let errorMessage = 'Failed to update role';

      if (error instanceof Error) {
        // Check for specific error patterns
        if (
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('unique constraint')
        ) {
          errorMessage = `Role '${payload.roleName}' already exists. Please choose a different name.`;
        } else if (error.message.toLowerCase().includes('not found')) {
          errorMessage =
            'Role not found. It may have been deleted by another user.';
        } else if (error.message.toLowerCase().includes('permission')) {
          errorMessage = `Permission error: ${error.message}`;
        } else if (
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('forbidden')
        ) {
          errorMessage = "You don't have permission to update this role";
        } else if (
          error.message.toLowerCase().includes('system role') ||
          error.message.toLowerCase().includes('system_role')
        ) {
          errorMessage = 'System roles cannot be modified';
        } else if (
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');

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
          `Role '${selectedRole.name}' deleted successfully!`,
          'success',
        );
        setShowDeleteModal(false);
        setSelectedRole(null);
      } else {
        throw new Error('Failed to delete role - operation was not successful');
      }
    } catch (error) {
      
      // Enhanced error handling with specific error types
      let errorMessage = 'Failed to delete role';

      if (error instanceof Error) {
        // Check for specific error patterns
        if (error.message.toLowerCase().includes('not found')) {
          errorMessage = 'Role not found. It may have already been deleted.';
        } else if (
          error.message.toLowerCase().includes('in use') ||
          error.message.toLowerCase().includes('assigned') ||
          error.message.toLowerCase().includes('users')
        ) {
          errorMessage =
            'Cannot delete role because it is assigned to users. Please reassign users first.';
        } else if (
          error.message.toLowerCase().includes('system role') ||
          error.message.toLowerCase().includes('system_role')
        ) {
          errorMessage = 'System roles cannot be deleted';
        } else if (
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('forbidden')
        ) {
          errorMessage = "You don't have permission to delete this role";
        } else if (
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('fetch')
        ) {
          errorMessage =
            'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const openEditModal = async (role: Role) => {
    setSelectedRole(role);

    // Wait for permission resources to be loaded if they aren't already
    if (permissionResources.length === 0) {
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
  const getLevelLabel = (level: number) => {
    if (level >= 100) return 'Super Admin';
    if (level >= 90) return 'Admin';
    if (level >= 70) return 'Manager';
    if (level >= 50) return 'Standard';
    if (level >= 30) return 'Limited';
    return 'Basic';
  };

  if (error) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='mb-2 text-red-500'>Error loading roles</div>
          <div className='text-gray-500'>{error}</div>
          <Button onClick={clearError} className='mt-4'>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>

      {/* Search and Filters */}
      <div className='mb-6'>
        <TableSearch
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder='Search roles by name or description...'
          textButton={canManageRoles ? 'Create Role' : undefined}
          onClickButton={canManageRoles ? openCreateModal : undefined}
        />
      </div>

      {/* Roles Table */}
      <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800'>
        {loading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                <thead className='bg-gray-50 dark:bg-gray-700'>
                  <tr>
                    <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      Role
                    </th>
                    <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      Level
                    </th>
                    <th className='hidden px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell sm:px-6 dark:text-gray-400'>
                      Permissions
                    </th>
                    <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      Type
                    </th>
                    <th className='hidden px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase xl:table-cell sm:px-6 dark:text-gray-400'>
                      Created
                    </th>
                    <th className='px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                  {roles?.data.map((role) => (
                    <tr
                      key={role.id}
                      className='cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                        <div className='flex items-center'>
                          <div className='h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0'>
                            <div className='flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-400'>
                              {role.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className='ml-3 sm:ml-4'>
                            <div className='text-sm font-medium text-gray-900 dark:text-white'>
                              {role.name}
                            </div>
                            <div className='text-xs sm:text-sm text-gray-500 md:hidden dark:text-gray-400'>
                              {role.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 text-xs font-medium ${
                          (role.level || 0) >= 90 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : (role.level || 0) >= 70 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : (role.level || 0) >= 50 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          <span className='hidden sm:inline'>{getLevelLabel(role.level || 0)} </span>
                          ({role.level || 0})
                        </span>
                      </td>
                      <td className='hidden px-3 py-4 whitespace-nowrap md:table-cell sm:px-6'>
                        <span className='text-sm text-gray-900 dark:text-white'>
                          {role.permissions?.length || 0} permissions
                        </span>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                        {role.is_system_role ? (
                          <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 sm:px-2.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300'>
                            System
                          </span>
                        ) : (
                          <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 sm:px-2.5 text-xs font-medium text-gray-800 dark:bg-gray-900 dark:text-gray-300'>
                            Custom
                          </span>
                        )}
                      </td>
                      <td className='hidden px-3 py-4 whitespace-nowrap xl:table-cell sm:px-6'>
                        <span className='text-sm text-gray-500 dark:text-gray-400'>
                          {new Date(role.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className='px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6'>
                        <div className='flex items-center justify-end space-x-2'>
                          {canManageRoles && (
                            <button
                              onClick={() => openEditModal(role)}
                              className='inline-flex items-center justify-center rounded-md bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              title='Edit role'
                            >
                              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                              </svg>
                            </button>
                          )}
                          {canManageRoles && (
                            <button
                              onClick={() => openDeleteModal(role)}
                              disabled={role.is_system_role}
                              className='inline-flex items-center justify-center rounded-md bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                              title='Delete role'
                            >
                              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!roles?.data || roles.data.length === 0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-3 py-12 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400'
                      >
                        <div className='flex flex-col items-center'>
                          <svg
                            className='mb-4 h-8 w-8 sm:h-12 sm:w-12 text-gray-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                            />
                          </svg>
                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                            No roles found
                          </p>
                          <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                            {searchTerm
                              ? 'Try adjusting your search criteria'
                              : 'Get started by adding your first role'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {roles && (
              <div className='border-t border-gray-200 bg-gray-50 px-3 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800'>
                <Pagination
                  currentPage={roles.pagination.page}
                  totalPages={roles.pagination.totalPages}
                  pageSize={roles.pagination.pageSize}
                  total={roles.pagination.total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

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
        mode='edit'
        initialData={transformedRoleData}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size='md'
        className='p-2 sm:p-4'
      >
        <div className='p-4 sm:p-6'>
          <div className='text-center'>
            <svg
              className='mx-auto mb-4 h-12 w-12 sm:h-14 sm:w-14 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <h3 className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete the role{' '}
              <span className='font-semibold break-words'>
                &ldquo;{selectedRole?.name}&rdquo;
              </span>
              ?
            </h3>
            <p className='text-sm text-gray-400 dark:text-gray-500'>
              This action cannot be undone. Users with this role will lose their
              assigned permissions.
            </p>

            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-4'>
              <Button 
                color='gray' 
                onClick={() => setShowDeleteModal(false)} 
                className='w-full sm:w-auto'
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color='failure'
                onClick={handleDeleteRole}
                disabled={loading}
                className='w-full sm:w-auto bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900'
              >
                {loading ? 'Deleting...' : 'Yes, delete'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
