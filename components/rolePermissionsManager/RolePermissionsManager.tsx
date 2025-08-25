'use client';
/**
 * Role Permissions Management Component
 *
 * Example component demonstrating how to use PermissionsTable
 * for managing role permissions with save functionality.
 */

import { PermissionsTable } from '@/components/PermissionsTable';
import { useToast } from '@/components/toast';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface RolePermissionsManagerProps {
  roleId: number;
  roleName: string;
  onClose?: () => void;
}

export const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  roleId,
  roleName,
  onClose,
}) => {
  const { showToast } = useToast();
  const {
    currentRolePermissions,
    loading,
    error,
    saving,
    loadPermissions,
    loadRolePermissions,
    updateRolePermissions,
    clearError,
  } = useRolePermissions();

  const [pendingPermissions, setPendingPermissions] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadPermissions();
    loadRolePermissions(roleId);
  }, [roleId, loadPermissions, loadRolePermissions]);

  // Track pending changes
  useEffect(() => {
    setPendingPermissions(currentRolePermissions);
  }, [currentRolePermissions]);

  // Check if there are unsaved changes
  useEffect(() => {
    const permissionsChanged =
      pendingPermissions.length !== currentRolePermissions.length ||
      !pendingPermissions.every((id) => currentRolePermissions.includes(id));
    setHasChanges(permissionsChanged);
  }, [pendingPermissions, currentRolePermissions]);

  /**
   * Handle permission changes from the table
   */
  const handlePermissionChange = (permissionIds: number[]) => {
    setPendingPermissions(permissionIds);
  };

  /**
   * Save changes to the role
   */
  const handleSave = async () => {
    try {
      await updateRolePermissions(roleId, pendingPermissions);
      showToast('Permissions saved successfully', 'success');
      setHasChanges(false);
    } catch {
      // Error is already handled by the hook
    }
  };

  /**
   * Discard changes and revert to saved state
   */
  const handleDiscard = () => {
    setPendingPermissions(currentRolePermissions);
    setHasChanges(false);
    showToast('Changes discarded', 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='space-y-6'
    >
      {/* Header */}
      <div className='rounded-lg border border-slate-700/50 bg-slate-900/80 p-6 backdrop-blur-xl'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-slate-100'>
              Manage Permissions
            </h2>
            <p className='mt-1 text-slate-400'>
              Role:{' '}
              <span className='font-medium text-slate-300'>{roleName}</span>
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className='rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300'
              aria-label='Close'
            >
              ✕
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className='mt-4 flex items-center space-x-3'>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'cursor-not-allowed bg-slate-700 text-slate-400'
            } `}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={handleDiscard}
            disabled={!hasChanges || saving}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            } `}
          >
            Discard Changes
          </button>

          {hasChanges && (
            <div className='flex items-center text-sm text-yellow-400'>
              <span className='mr-2 h-2 w-2 rounded-full bg-yellow-400'></span>
              Unsaved changes
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'
        >
          <div className='flex items-center justify-between'>
            <div>
              <div className='font-medium text-red-400'>Error</div>
              <div className='mt-1 text-sm text-red-300'>{error}</div>
            </div>
            <button
              onClick={clearError}
              className='text-red-400 transition-colors hover:text-red-300'
              aria-label='Close error'
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Permissions Table */}
      <PermissionsTable
        selectedPermissions={pendingPermissions}
        onPermissionChange={handlePermissionChange}
        readonly={saving}
        showSummary={true}
        className={`${saving ? 'pointer-events-none opacity-50' : ''} p-0`}
      />

      {/* Loading overlay */}
      {loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
          <div className='flex items-center space-x-3 rounded-lg border border-slate-700 bg-slate-900 p-6'>
            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-500'></div>
            <span className='text-slate-300'>Loading permissions...</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
