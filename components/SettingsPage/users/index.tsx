'use client';

import { TableSearch } from '@/components';
import { Pagination } from '@/components/pagination';
import { ProfilePictureUpload } from '@/components/profilePictureUpload';
import { useToast } from '@/components/toast';
import { UserFormModal } from '@/components/userManagement';
import { SUCCESS_MESSAGES } from '@/constants';
import { usePaginatedUserManagement } from '@/hooks/usePaginatedUserManagement';
import { DEFAULT_PAGE_SIZE } from '@/interfaces/Pagination';
import { User, UserRoleRow, UserStatus } from '@/interfaces/UserManagement';
import { Avatar, Badge, Button, Label, Modal } from 'flowbite-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function UsersPage() {
  const { showToast } = useToast();
  const {
    users,
    allRoles,
    allDepartments,
    userStatistics,
    loading,
    error,
    uploadingImage,
    getUsersPaginated,
    getAllRoles,
    getAllDepartments,
    getUserStatistics,
    deleteUser,
    uploadProfilePicture,
    updateUserProfile,
    clearError,
  } = usePaginatedUserManagement();

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>(
    'create',
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  // Track initial load and prevent duplicate API calls
  const initialLoadDone = useRef(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized getUsersPaginated to prevent unnecessary re-renders
  const stableGetUsersPaginated = useCallback(
    (
      params: { page: number; pageSize: number; search?: string },
      filter: { search?: string } = {},
    ) => {
      return getUsersPaginated(params, filter);
    },
    [getUsersPaginated],
  );

  // Single useEffect for initial data loading
  useEffect(() => {
    if (!initialLoadDone.current) {
      const loadInitialData = async () => {
        try {
          // Load all initial data in parallel for better performance
          await Promise.all([
            stableGetUsersPaginated({ page: 1, pageSize: DEFAULT_PAGE_SIZE }),
            getAllRoles(),
            getAllDepartments(),
            getUserStatistics(),
          ]);
          initialLoadDone.current = true;
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      };
      loadInitialData();
    }
  }, [
    stableGetUsersPaginated,
    getAllRoles,
    getAllDepartments,
    getUserStatistics,
  ]);

  // Handle search and pagination changes with debouncing
  useEffect(() => {
    // Skip if initial load hasn't completed
    if (!initialLoadDone.current) {
      return;
    }

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      stableGetUsersPaginated(
        { page: currentPage, pageSize, search: searchTerm },
        { search: searchTerm },
      );
    }, 500);

    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, pageSize, currentPage, stableGetUsersPaginated]);

  // Handle search term changes and reset to first page
  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  // Handle successful user creation/edit from the unified modal
  const handleUserSuccess = async (user: User) => {
    console.log(user);
    // Show success toast based on the current mode
    const message =
      userModalMode === 'create'
        ? SUCCESS_MESSAGES.USER_CREATED
        : SUCCESS_MESSAGES.USER_UPDATED;
    showToast(message, 'success');

    // Close modal
    setShowUserModal(false);
    setSelectedUser(null);

    // Refresh users list and statistics
    await Promise.all([
      stableGetUsersPaginated({
        page: currentPage,
        pageSize,
        search: searchTerm,
      }),
      getUserStatistics(),
    ]);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const success = await deleteUser(selectedUser.id);
      if (success) {
        showToast(SUCCESS_MESSAGES.USER_DELETED, 'success');
        setShowDeleteModal(false);
        setSelectedUser(null);
        // Refresh user statistics after deleting a user
        await getUserStatistics();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to delete user',
        'error',
      );
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!selectedUser) return null;

    try {
      const avatarUrl = await uploadProfilePicture(selectedUser.id, file);
      if (avatarUrl) {
        await updateUserProfile(selectedUser.id, { avatar_url: avatarUrl });
        showToast('Profile picture updated successfully', 'success');
        return avatarUrl;
      }
      return null;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to upload profile picture',
        'error',
      );
      return null;
    }
  };

  // Modal openers
  const openCreateModal = () => {
    setSelectedUser(null);
    setUserModalMode('create');
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setUserModalMode('edit');
    setShowUserModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openProfileModal = (user: User) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  // Utility functions
  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.INACTIVE:
        return 'gray';
      case UserStatus.SUSPENDED:
        return 'failure';
      case UserStatus.PENDING:
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getStatusDisplayName = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Active';
      case UserStatus.INACTIVE:
        return 'Inactive';
      case UserStatus.SUSPENDED:
        return 'Suspended';
      case UserStatus.PENDING:
        return 'Pending';
      default:
        return status;
    }
  };

  const getRoleName = (roleIds: UserRoleRow[]) => {
    if (roleIds == undefined || roleIds.length === 0) return 'No Role';
    if (roleIds.length === 1) {
      if (!roleIds[0]) {
        return 'No Role';
      }
      const role = allRoles.find((r) => r.id === roleIds[0].role.id);
      return role?.name || 'Unknown';
    }
    const role = allRoles.find((r) => r.id === roleIds[0].role.id);
    const roleName = role?.name || 'Unknown';
    return `${roleName} (+${roleIds.length - 1})`;
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const department = allDepartments.find((d) => d.id === departmentId);
    return department?.name || 'Unknown';
  };

  if (error) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='mb-2 text-red-500'>Error loading users</div>
          <div className='text-gray-500'>{error}</div>
          <Button
            onClick={() => {
              clearError();
              // Retry loading initial data
              const retryLoad = async () => {
                try {
                  await Promise.all([
                    stableGetUsersPaginated({
                      page: 1,
                      pageSize: DEFAULT_PAGE_SIZE,
                    }),
                    getAllRoles(),
                    getAllDepartments(),
                    getUserStatistics(),
                  ]);
                } catch (retryError) {
                  showToast(
                    retryError instanceof Error
                      ? retryError.message
                      : 'Failed to load users',
                    'error',
                  );
                }
              };
              retryLoad();
            }}
            className='mt-4'
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-end w-full'>
        <Button
          onClick={openCreateModal}
          className='bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none w-full sm:w-auto'
        >
          <svg
            className='mr-2 h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 4v16m8-8H4'
            />
          </svg>
          <span className='block sm:hidden'>Add</span>
          <span className='hidden sm:block'>Add User</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className='mb-6'>
        <TableSearch
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder='Search users by name or email...'
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Users Table */}
      <div className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800'>
        {loading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600'></div>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className='block lg:hidden'>
              <div className='divide-y divide-gray-200 dark:divide-gray-700'>
                {users?.data.map((user) => (
                  <div
                    key={user.id}
                    className='cursor-pointer p-3 sm:p-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <div className='flex items-start space-x-3'>
                      <Avatar
                        img={user.avatar_url}
                        alt={user.display_name || user.email}
                        rounded
                        size='sm'
                        className='flex-shrink-0'
                      />
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                          {user.display_name || user.email}
                        </div>
                        <div className='mt-1 text-xs text-gray-500 dark:text-gray-400 truncate'>
                          {user.email}
                        </div>
                        <div className='mt-2 flex flex-wrap items-center gap-2'>
                          <Badge color='purple' size='sm'>
                            {getRoleName(user.user_roles ?? [])}
                          </Badge>
                          <Badge
                            color={getStatusBadgeColor(user.status)}
                            size='sm'
                          >
                            {getStatusDisplayName(user.status)}
                          </Badge>
                        </div>
                        <div className='mt-2 flex items-center justify-between'>
                          <div className='text-xs text-gray-500 dark:text-gray-400'>
                            {getDepartmentName(user.department_id)} • Created{' '}
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                          <div className='flex items-center space-x-1'>
                            <button
                              onClick={() => openProfileModal(user)}
                              className='p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900'
                              title='View user'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className='p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700'
                              title='Edit user'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className='p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-red-900'
                              title='Delete user'
                            >
                              <svg
                                className='h-4 w-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className='hidden lg:block'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                  <thead className='bg-gray-50 dark:bg-gray-700'>
                    <tr>
                      <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                        User
                      </th>
                      <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                        Role
                      </th>
                      <th className='hidden px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase md:table-cell sm:px-6 dark:text-gray-400'>
                        Department
                      </th>
                      <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                        Status
                      </th>
                      <th className='hidden px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase xl:table-cell sm:px-6 dark:text-gray-400'>
                        Created
                      </th>
                      <th className='px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6 dark:text-gray-400'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                    {users?.data.map((user) => (
                      <tr
                        key={user.id}
                        className='cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700'
                      >
                        <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                          <div className='flex items-center'>
                            <Avatar
                              img={user.avatar_url}
                              alt={user.display_name || user.email}
                              rounded
                              size='sm'
                              className='mr-2 sm:mr-3 flex-shrink-0'
                            />
                            <div className='min-w-0'>
                              <div className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                                {user.display_name || user.email}
                              </div>
                              <div className='truncate text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                          <span className='inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 sm:px-2.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300'>
                            {getRoleName(user.user_roles ?? [])}
                          </span>
                        </td>
                        <td className='hidden px-3 py-4 whitespace-nowrap md:table-cell sm:px-6'>
                          <span className='text-sm text-gray-900 dark:text-white'>
                            {getDepartmentName(user.department_id)}
                          </span>
                        </td>
                        <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 text-xs font-medium ${
                              user.status === UserStatus.ACTIVE
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : user.status === UserStatus.INACTIVE
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                  : user.status === UserStatus.SUSPENDED
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                          >
                            {getStatusDisplayName(user.status)}
                          </span>
                        </td>
                        <td className='hidden px-3 py-4 whitespace-nowrap xl:table-cell sm:px-6'>
                          <span className='text-sm text-gray-500 dark:text-gray-400'>
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className='px-3 py-4 whitespace-nowrap sm:px-6'>
                          <div className='flex items-center space-x-1 sm:space-x-2'>
                            <button
                              onClick={() => openProfileModal(user)}
                              className='inline-flex items-center rounded-md bg-blue-100 px-2 py-1.5 sm:px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
                              title='View user'
                            >
                              <span className='hidden sm:block'>View</span>
                              <svg className='h-4 w-4 sm:hidden' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                              </svg>
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className='inline-flex items-center rounded-md bg-gray-100 px-2 py-1.5 sm:px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              title='Edit user'
                            >
                              <span className='hidden sm:block'>Edit</span>
                              <svg className='h-4 w-4 sm:hidden' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className='inline-flex items-center rounded-md bg-red-100 px-2 py-1.5 sm:px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                              title='Delete user'
                            >
                              <span className='hidden sm:block'>Delete</span>
                              <svg className='h-4 w-4 sm:hidden' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!users?.data || users.data.length === 0) && (
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
                                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                              />
                            </svg>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                              No users found
                            </p>
                            <p className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                              {searchTerm
                                ? 'Try adjusting your search criteria'
                                : 'Get started by adding your first user'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {users && (
              <div className='border-t border-gray-200 bg-gray-50 px-3 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800'>
                <Pagination
                  currentPage={users.pagination.page}
                  totalPages={users.pagination.totalPages}
                  pageSize={users.pagination.pageSize}
                  total={users.pagination.total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Unified User Modal - Handles both create and edit */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onSuccess={handleUserSuccess}
        mode={userModalMode}
        user={selectedUser}
        availableRoles={allRoles}
        availableDepartments={allDepartments}
      />

      {/* Profile Modal */}
      <Modal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        size='xl'
        className='z-[100] p-2 sm:p-4'
      >
        <div className='relative p-4 sm:p-6'>
          <h3 className='mb-6 text-lg font-bold text-gray-900 dark:text-white'>
            User Profile
          </h3>
          {selectedUser && (
            <div className='space-y-6'>
              <div className='text-center'>
                <ProfilePictureUpload
                  currentAvatarUrl={selectedUser.avatar_url}
                  onUpload={handleProfilePictureUpload}
                  loading={uploadingImage}
                  size='lg'
                />
                <h3 className='mt-4 text-lg font-medium text-gray-900 dark:text-white'>
                  {selectedUser.display_name || selectedUser.email}
                </h3>
                <p className='text-gray-500 dark:text-gray-400 break-words'>
                  {selectedUser.email}
                </p>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <Label>Role</Label>
                  <div className='mt-1'>
                    <Badge color='purple'>
                      {getRoleName(selectedUser.user_roles ?? [])}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className='mt-1 text-sm text-gray-900 dark:text-white'>
                    {getDepartmentName(selectedUser.department_id)}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className='mt-1'>
                    <Badge color={getStatusBadgeColor(selectedUser.status)}>
                      {getStatusDisplayName(selectedUser.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className='mt-1 text-sm text-gray-900 dark:text-white'>
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2 sm:space-y-0'>
                <Button color='gray' onClick={() => setShowProfileModal(false)} className='w-full sm:w-auto'>
                  Close
                </Button>
                <Button onClick={() => openEditModal(selectedUser)} className='w-full sm:w-auto'>
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal - Updated design */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size='lg'
        className='z-[100] p-2 sm:p-4'
      >
        <div className='relative p-4 sm:p-8'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
              <svg
                className='h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400'
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
            </div>

            <h3 className='mb-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-white'>
              Delete User
            </h3>

            <p className='mb-2 text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete{' '}
              <span className='font-semibold text-gray-900 dark:text-white break-words'>
                {selectedUser?.display_name || selectedUser?.email}
              </span>
              ?
            </p>

            <div className='rounded-lg bg-red-50 p-3 sm:p-4 dark:bg-red-900/20'>
              <div className='flex items-start'>
                <div className='flex-shrink-0'>
                  <svg
                    className='h-5 w-5 text-red-600 dark:text-red-400'
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
                </div>
                <div className='ml-3'>
                  <h4 className='text-sm font-medium text-red-800 dark:text-red-200'>
                    Warning: This action cannot be undone
                  </h4>
                  <p className='mt-1 text-sm text-red-700 dark:text-red-300'>
                    All user data, permissions, and access will be permanently
                    removed from the system.
                  </p>
                </div>
              </div>
            </div>

            <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-4'>
              <Button color='gray' onClick={() => setShowDeleteModal(false)} className='w-full sm:w-auto'>
                Cancel
              </Button>
              <Button
                color='failure'
                onClick={handleDeleteUser}
                disabled={loading}
                className='focus:ring-red-300 w-full sm:w-auto'
              >
                {loading ? (
                  <div className='flex items-center justify-center'>
                    <svg
                      className='mr-2 h-4 w-4 animate-spin'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    Deleting...
                  </div>
                ) : (
                  'Yes, delete user'
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
