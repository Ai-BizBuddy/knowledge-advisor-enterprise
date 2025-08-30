'use client';
import { useToast } from '@/components/toast';
import { usePermissionResources } from '@/hooks/usePermissionResources';
import { useReactHookForm } from '@/hooks/useReactHookForm';
import {
  ACCESS_LEVELS,
  AccessLevel,
  CreateRoleFormData,
  CreateRolePayload,
  PermissionRow,
  RoleModalProps,
  VALIDATION_RULES,
} from '@/interfaces/RoleModal';
import {
  Button,
  Label,
  Modal,
  Select,
  Spinner,
  Textarea,
  TextInput,
} from 'flowbite-react';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { PermissionsTable } from './PermissionsTable';

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  mode = 'create',
  initialData,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionValidationErrors, setPermissionValidationErrors] = useState<{
    [resource: string]: string;
  }>({});

  // Fetch dynamic permission resources from Supabase
  const {
    resources: permissionResources,
    resourcesData: permissionResourceData,
    loading: resourcesLoading,
  } = usePermissionResources();

  // Determine if this is edit mode
  const isEditMode = mode === 'edit';
  const permissions = [] as PermissionRow[];
  for (const resource in permissionResourceData) {
    const resourceGroup = permissionResourceData[resource];

    // Group all actions for the same resource into a single permission object
    const actions: Record<string, { id: string; value: boolean }> = {};
    for (let index = 0; index < resourceGroup.length; index++) {
      const element = resourceGroup[index];
      actions[element.action] = { id: element.id, value: false };
    }

    permissions.push({
      resource,
      actions,
    });
  }
  // Initialize form with React Hook Form
  const form = useReactHookForm<CreateRoleFormData>({
    defaultValues: {
      roleName: '',
      description: '',
      accessLevel: 'User' as AccessLevel,
      permissions: permissions,
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = form;

  // Watch access level to update permissions automatically
  const watchedAccessLevel = watch('accessLevel');
  const watchedPermissions = watch('permissions');

  // Load initial data for edit mode
  useEffect(() => {
    if (isEditMode && initialData && isOpen) {
      console.log('Loading initial data for edit mode:', initialData);
      setValue('roleName', initialData.roleName);
      setValue('description', initialData.description || '');
      setValue('accessLevel', initialData.accessLevel);
      setValue('permissions', initialData.permissions);
      setPermissionValidationErrors({}); // Clear validation errors when loading data
    } else if (!isEditMode && isOpen) {
      const permissions = [] as PermissionRow[];
      for (const resource in permissionResourceData) {
        const resourceGroup = permissionResourceData[resource];

        // Group all actions for the same resource into a single permission object
        const actions: Record<string, { id: string; value: boolean }> = {};
        for (let index = 0; index < resourceGroup.length; index++) {
          const element = resourceGroup[index];
          actions[element.action] = { id: element.id, value: false };
        }

        permissions.push({
          resource,
          actions,
        });
      }
      reset({
        roleName: '',
        description: '',
        accessLevel: 'User' as AccessLevel,
        permissions: permissions,
      });
      setPermissionValidationErrors({}); // Clear validation errors for new form
    }
  }, [
    isEditMode,
    initialData,
    isOpen,
    setValue,
    reset,
    permissionResources,
    permissionResourceData,
  ]);

  // Update permissions when access level changes (only in create mode or when explicitly requested)
  useEffect(() => {
    if (!isEditMode && watchedAccessLevel && isOpen) {
      console.log(
        'Updating permissions for access level change (create mode only)',
      );
      const allResources = [...permissionResources];
      // actions: defaultPerm?.action
      const updatedPermissions = allResources.map((resource) => {
        return {
          resource,
          actions: {},
        };
      });

      setValue('permissions', updatedPermissions);
    }
  }, [watchedAccessLevel, setValue, isEditMode, permissionResources, isOpen]);

  // Handle form submission with comprehensive validation
  const handleFormSubmit = async (data: CreateRoleFormData) => {
    try {
      setIsSubmitting(true);

      // Clear any previous form errors
      form.clearErrors();

      // 1. Validate role name uniqueness (this would typically be done server-side)
      if (!data.roleName.trim()) {
        form.setError('roleName', {
          type: 'manual',
          message: 'Role name is required',
        });
        return;
      }

      // 2. Validate permission table - at least one permission must be selected
      const hasPermissions = data.permissions.some((p) =>
        Object.values(p.actions).some((action) => action?.value === true),
      );
      if (!hasPermissions) {
        // Set a general form error for permissions
        form.setError('permissions', {
          type: 'manual',
          message: 'Please select at least one permission for this role',
        });
        showToast(
          'Please select at least one permission for this role',
          'error',
        );
        return;
      }

      // 3. Check for specific permission validation errors
      if (Object.keys(permissionValidationErrors).length > 0) {
        const errorResources = Object.keys(permissionValidationErrors);
        form.setError('permissions', {
          type: 'manual',
          message: `Please fix validation errors for: ${errorResources.join(', ')}`,
        });
        showToast(
          `Please fix validation errors for: ${errorResources.join(', ')}`,
          'error',
        );
        return;
      }

      // 4. Validate that each selected resource has at least one action
      const invalidResources = data.permissions.filter((p) => {
        const hasAnyAction = Object.values(p.actions).some(
          (action) => action?.value === true,
        );
        const hasSelectedActions = Object.keys(p.actions).length > 0;
        // If resource has actions defined but none are true, it's invalid
        return hasSelectedActions && !hasAnyAction;
      });

      if (invalidResources.length > 0) {
        const resourceNames = invalidResources
          .map((r) => r.resource)
          .join(', ');
        form.setError('permissions', {
          type: 'manual',
          message: `Please select at least one action for: ${resourceNames}`,
        });
        showToast(
          `Please select at least one action for: ${resourceNames}`,
          'error',
        );
        return;
      }

      // 5. Transform form data to API payload
      const payload: CreateRolePayload = {
        ...(isEditMode && initialData?.id && { id: initialData.id }),
        roleName: data.roleName.trim(),
        description: data.description?.trim(),
        accessLevel: data.accessLevel,
        permissions: data.permissions
          .filter((p) => Object.values(p.actions).some(Boolean))
          .map((p) => ({
            resource: p.resource,
            actions: Object.entries(p.actions)
              .filter(([, value]) => value.value === true)
              .map(([action, value]) => ({ id: value.id, action })),
          })),
      };

      // 6. Attempt to submit to API
      await onSubmit(payload);

      // Success - show confirmation and close modal
      const actionText = isEditMode ? 'updated' : 'created';
      showToast(
        `Role "${data.roleName}" ${actionText} successfully`,
        'success',
      );

      // Reset form and close modal
      handleClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} role:`,
        error,
      );

      // Handle different types of errors
      if (error instanceof Error) {
        // Check for specific error types and set appropriate form errors
        if (
          error.message.toLowerCase().includes('duplicate') ||
          error.message.toLowerCase().includes('already exists')
        ) {
          form.setError('roleName', {
            type: 'manual',
            message: 'A role with this name already exists',
          });
        } else if (error.message.toLowerCase().includes('permission')) {
          form.setError('permissions', {
            type: 'manual',
            message: error.message,
          });
        } else if (error.message.toLowerCase().includes('name')) {
          form.setError('roleName', {
            type: 'manual',
            message: error.message,
          });
        } else if (error.message.toLowerCase().includes('description')) {
          form.setError('description', {
            type: 'manual',
            message: error.message,
          });
        } else {
          // Generic form error
          form.setError('root', {
            type: 'manual',
            message: error.message,
          });
        }

        // Always show toast for user feedback
        showToast(error.message, 'error');
      } else {
        // Unknown error type
        const actionText = isEditMode ? 'update' : 'create';
        const fallbackMessage = `Failed to ${actionText} role. Please try again.`;

        form.setError('root', {
          type: 'manual',
          message: fallbackMessage,
        });
        showToast(fallbackMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    reset();
    setPermissionValidationErrors({});
    onClose();
  };

  // Handle permissions change with real-time validation
  const handlePermissionsChange = (permissions: PermissionRow[]) => {
    setValue('permissions', permissions, { shouldValidate: true });

    // Clear form errors when user starts making changes
    if (form.formState.errors.permissions) {
      form.clearErrors('permissions');
    }

    // Real-time validation for individual permission rows
    const newValidationErrors: { [resource: string]: string } = {};

    permissions.forEach((permission) => {
      const hasActions = Object.keys(permission.actions).length > 0;
      const hasSelectedActions = Object.values(permission.actions).some(
        (action) => action?.value === true,
      );

      // If resource has actions defined but none are selected, it's an error
      if (hasActions && !hasSelectedActions) {
        newValidationErrors[permission.resource] =
          `Please select at least one action for ${permission.resource}`;
      }
    });

    setPermissionValidationErrors(newValidationErrors);
  };

  // Calculate validation status
  const hasValidationErrors = Object.keys(errors).length > 0;
  const isLoading = loading || resourcesLoading;
  const canSubmit =
    isValid && !hasValidationErrors && !isSubmitting && !isLoading;

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <Modal
      show={isOpen}
      onClose={handleClose}
      size='4xl'
      dismissible={!isSubmitting && !isLoading}
      className='roleModal'
    >
      <motion.div
        variants={modalVariants}
        animate='visible'
        exit='exit'
        transition={{ duration: 0.2 }}
        className='p-6'
      >
        {/* Modal Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
              {isEditMode ? 'Edit Role' : 'Create New Role'}
            </h3>
            <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Configure role permissions and access levels for your organization
            </p>
          </div>

          {/* Loading indicator */}
          {(isSubmitting || isLoading) && (
            <div className='flex items-center space-x-2 text-indigo-600'>
              <Spinner size='sm' />
              <span className='text-sm'>
                {isSubmitting
                  ? `${isEditMode ? 'Updating' : 'Creating'} role...`
                  : 'Loading...'}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
          <div className='h-[100%]'>
            {/* Basic Information */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Role Name */}
              <div>
                <Label htmlFor='roleName' className='mb-2 block'>
                  Role Name <span className='text-red-500'>*</span>
                </Label>
                <Controller
                  name='roleName'
                  control={control}
                  rules={VALIDATION_RULES.roleName}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      id='roleName'
                      type='text'
                      placeholder='Enter role name (e.g., Content Manager)'
                      color={errors.roleName ? 'failure' : 'gray'}
                      disabled={isSubmitting || isLoading}
                      autoFocus
                      onChange={(e) => {
                        field.onChange(e);
                        // Clear form errors when user starts typing
                        if (errors.roleName) {
                          form.clearErrors('roleName');
                        }
                        if (errors.root) {
                          form.clearErrors('root');
                        }
                      }}
                    />
                  )}
                />
                {errors.roleName && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.roleName.message}
                  </p>
                )}
              </div>

              {/* Access Level */}
              <div>
                <Label htmlFor='accessLevel' className='mb-2 block'>
                  Access Level <span className='text-red-500'>*</span>
                </Label>
                <Controller
                  name='accessLevel'
                  control={control}
                  rules={VALIDATION_RULES.accessLevel}
                  render={({ field }) => (
                    <Select
                      {...field}
                      id='accessLevel'
                      color={errors.accessLevel ? 'failure' : 'gray'}
                      disabled={isSubmitting || isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        // Clear form errors when user makes a selection
                        if (errors.accessLevel) {
                          form.clearErrors('accessLevel');
                        }
                        if (errors.root) {
                          form.clearErrors('root');
                        }
                      }}
                    >
                      {Object.entries(ACCESS_LEVELS).map(([level, config]) => (
                        <option key={level} value={level}>
                          {level} (Level {config.level}) - {config.description}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {errors.accessLevel && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {errors.accessLevel.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor='description' className='mb-2 block'>
                Description
                <span className='ml-1 text-sm text-gray-400'>(optional)</span>
              </Label>
              <Controller
                name='description'
                control={control}
                rules={VALIDATION_RULES.description}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id='description'
                    placeholder="Describe the role's purpose and responsibilities..."
                    rows={1}
                    color={errors.description ? 'failure' : 'gray'}
                    disabled={isSubmitting || isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      // Clear form errors when user starts typing
                      if (errors.description) {
                        form.clearErrors('description');
                      }
                      if (errors.root) {
                        form.clearErrors('root');
                      }
                    }}
                  />
                )}
              />
              {errors.description && (
                <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Permissions Table */}
            <div>
              <Label htmlFor='permissions' className='mb-2 block'>
                Role Permissions <span className='text-red-500'>*</span>
              </Label>
              <PermissionsTable
                permissions={watchedPermissions}
                onChange={handlePermissionsChange}
                className='h-[24vh] max-h-[300px] min-h-[200px] p-0'
                validationErrors={permissionValidationErrors}
              />
              {errors.permissions && (
                <p className='mt-2 text-sm text-red-600 dark:text-red-400'>
                  {errors.permissions.message}
                </p>
              )}
            </div>

            {/* General form errors */}
            {errors.root && (
              <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-red-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                      {errors.root.message}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className='flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700'>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                {watchedPermissions?.filter((p) =>
                  Object.values(p.actions).some(
                    (action) => action?.value === true,
                  ),
                ).length || 0}{' '}
                of {permissionResources.length} resources configured
              </div>

              <div className='flex space-x-3'>
                <Button
                  color='gray'
                  onClick={handleClose}
                  disabled={isSubmitting || isLoading}
                  type='button'
                >
                  Cancel
                </Button>

                <Button
                  type='submit'
                  disabled={!canSubmit}
                  className='bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
                >
                  {isSubmitting || isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <Spinner size='sm' />
                      <span>
                        {isEditMode ? 'Updating Role...' : 'Creating Role...'}
                      </span>
                    </div>
                  ) : isEditMode ? (
                    'Update Role'
                  ) : (
                    'Create Role'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
};
