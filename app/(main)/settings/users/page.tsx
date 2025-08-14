"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Modal,
  Label,
  TextInput,
  Select,
  Badge,
  Avatar,
} from "flowbite-react";
import { usePaginatedUserManagement } from "@/hooks/usePaginatedUserManagement";
import { Pagination } from "@/components/pagination";
import { ProfilePictureUpload } from "@/components/profilePictureUpload";
import { CreateUserForm } from "@/components/userManagement";
import { useToast } from "@/components/toast";
import {
  User,
  UpdateUserInput,
  UserStatus,
  UserRoleRow,
} from "@/interfaces/UserManagement";
import { DEFAULT_PAGE_SIZE } from "@/interfaces/Pagination";
import { SUCCESS_MESSAGES } from "@/constants";

interface EditUserFormData {
  email: string;
  display_name: string;
  role_ids: number[];
  department_id: string;
  status: UserStatus;
}

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
    updateUser,
    deleteUser,
    uploadProfilePicture,
    updateUserProfile,
    clearError,
  } = usePaginatedUserManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state for editing users only (create form uses React Hook Form)
  const [formData, setFormData] = useState<EditUserFormData>({
    email: "",
    display_name: "",
    role_ids: [], // Default to basic user role
    department_id: "",
    status: UserStatus.ACTIVE,
  });

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
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
          console.error("Error loading initial data:", error);
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

  // Form handlers
  const resetForm = () => {
    setFormData({
      email: "",
      display_name: "",
      role_ids: [],
      department_id: "",
      status: UserStatus.ACTIVE,
    });
    setSelectedUser(null);
  };

  // Handle successful user creation from the new form component
  const handleUserCreationSuccess = async (newUser: User) => {
    console.log(newUser);
    // Show success toast
    showToast(SUCCESS_MESSAGES.USER_CREATED, "success");

    // Close modal
    setShowCreateModal(false);

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

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Validate at least one role is selected
    if (formData.role_ids.length === 0) {
      showToast("Please select at least one role", "error");
      return;
    }

    try {
      const updates: UpdateUserInput = {
        email: formData.email,
        display_name: formData.display_name,
        role_ids: formData.role_ids,
        department_id: formData.department_id,
        status: formData.status,
      };

      const updatedUser = await updateUser(selectedUser.id, updates);
      if (updatedUser) {
        showToast(SUCCESS_MESSAGES.USER_UPDATED, "success");
        setShowEditModal(false);
        resetForm();
        // Refresh user statistics after updating a user
        await getUserStatistics();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update user",
        "error",
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const success = await deleteUser(selectedUser.id);
      if (success) {
        showToast(SUCCESS_MESSAGES.USER_DELETED, "success");
        setShowDeleteModal(false);
        setSelectedUser(null);
        // Refresh user statistics after deleting a user
        await getUserStatistics();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to delete user",
        "error",
      );
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!selectedUser) return null;

    try {
      const avatarUrl = await uploadProfilePicture(selectedUser.id, file);
      if (avatarUrl) {
        await updateUserProfile(selectedUser.id, { avatar_url: avatarUrl });
        showToast("Profile picture updated successfully", "success");
        return avatarUrl;
      }
      return null;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to upload profile picture",
        "error",
      );
      return null;
    }
  };

  // Modal openers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      display_name: user.display_name || "",
      role_ids: user.user_roles?.map((userRole) => userRole.role.id) ?? [],
      department_id: user.department_id || "",
      status: user.status,
    });
    setShowEditModal(true);
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
        return "success";
      case UserStatus.INACTIVE:
        return "gray";
      case UserStatus.SUSPENDED:
        return "failure";
      case UserStatus.PENDING:
        return "warning";
      default:
        return "gray";
    }
  };

  const getStatusDisplayName = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return "Active";
      case UserStatus.INACTIVE:
        return "Inactive";
      case UserStatus.SUSPENDED:
        return "Suspended";
      case UserStatus.PENDING:
        return "Pending";
      default:
        return status;
    }
  };

  const getRoleName = (roleIds: UserRoleRow[]) => {
    if (roleIds == undefined || roleIds.length === 0) return "No Role";
    if (roleIds.length === 1) {
      if (!roleIds[0]) {
        return "No Role";
      }
      const role = allRoles.find((r) => r.id === roleIds[0].role.id);
      return role?.name || "Unknown";
    }
    const role = allRoles.find((r) => r.id === roleIds[0].role.id);
    const roleName = role?.name || "Unknown";
    return `${roleName} (+${roleIds.length - 1})`;
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return "No Department";
    const department = allDepartments.find((d) => d.id === departmentId);
    return department?.name || "Unknown";
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-red-500">Error loading users</div>
          <div className="text-gray-500">{error}</div>
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
                      : "Failed to load users",
                    "error",
                  );
                }
              };
              retryLoad();
            }}
            className="mt-4"
          >
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
            Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user accounts, profiles, and access permissions
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
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStatistics?.totalUsers || 0}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Users
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userStatistics?.activeUsers || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Created
                    </th>
                    <th className="relative px-6 py-3 text-center">
                      <span className="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {users?.data.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            img={user.avatar_url}
                            alt={user.display_name || user.email}
                            rounded
                            size="sm"
                            className="mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.display_name || user.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color="purple" className="justify-center">
                          {getRoleName(user.user_roles ?? [])}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                        {getDepartmentName(user.department_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className="justify-center"
                          color={getStatusBadgeColor(user.status)}
                        >
                          {getStatusDisplayName(user.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              size="xs"
                              color="blue"
                              onClick={() => openProfileModal(user)}
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
                              View
                            </Button>
                            <Button
                              size="xs"
                              color="gray"
                              onClick={() => openEditModal(user)}
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
                              Edit
                            </Button>
                            <Button
                              size="xs"
                              color="alternative"
                              onClick={() => openDeleteModal(user)}
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
                              Delete
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {users && (
                <div className="p-6">
                  <Pagination
                    currentPage={users.pagination.page}
                    totalPages={users.pagination.totalPages}
                    pageSize={users.pagination.pageSize}
                    total={users.pagination.total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    searchValue={searchTerm}
                    onSearchChange={handleSearchChange}
                    searchPlaceholder="Search users by name or email..."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Create User Modal - Using React Hook Form Component */}
      <CreateUserForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreationSuccess}
        availableRoles={allRoles}
        availableDepartments={allDepartments}
      />

      {/* Edit User Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Edit User
          </h3>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="edit_email">Email Address *</Label>
              <TextInput
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_display_name">Display Name</Label>
              <TextInput
                id="edit_display_name"
                type="text"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit_role">Roles *</Label>
              <div className="space-y-2">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-role-${role.id}`}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      checked={formData.role_ids.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            role_ids: [...formData.role_ids, role.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            role_ids: formData.role_ids.filter(
                              (id: number) => id !== role.id,
                            ),
                          });
                        }
                      }}
                    />
                    <label
                      htmlFor={`edit-role-${role.id}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
              {formData.role_ids.length === 0 && (
                <p className="mt-1 text-sm text-red-500">
                  At least one role must be selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit_department">Department</Label>
              <Select
                id="edit_department"
                value={formData.department_id}
                onChange={(e) =>
                  setFormData({ ...formData, department_id: e.target.value })
                }
              >
                <option value="">No Department</option>
                {allDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_status">Status</Label>
              <Select
                id="edit_status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as UserStatus,
                  })
                }
              >
                <option value={UserStatus.ACTIVE}>Active</option>
                <option value={UserStatus.INACTIVE}>Inactive</option>
                <option value={UserStatus.SUSPENDED}>Suspended</option>
                <option value={UserStatus.PENDING}>Pending</option>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.role_ids.length === 0}
              >
                {loading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        size="lg"
      >
        <div className="p-6">
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
            User Profile
          </h3>
          {selectedUser && (
            <div className="space-y-6">
              <div className="text-center">
                <ProfilePictureUpload
                  currentAvatarUrl={selectedUser.avatar_url}
                  onUpload={handleProfilePictureUpload}
                  loading={uploadingImage}
                  size="lg"
                />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {selectedUser.display_name || selectedUser.email}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedUser.email}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Role</Label>
                  <div className="mt-1">
                    <Badge color="purple">
                      {getRoleName(selectedUser.user_roles ?? [])}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {getDepartmentName(selectedUser.department_id)}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge color={getStatusBadgeColor(selectedUser.status)}>
                      {getStatusDisplayName(selectedUser.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button color="gray" onClick={() => setShowProfileModal(false)}>
                  Close
                </Button>
                <Button onClick={() => openEditModal(selectedUser)}>
                  Edit User
                </Button>
              </div>
            </div>
          )}
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
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {selectedUser?.display_name || selectedUser?.email}
              </span>
              ?
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This action cannot be undone. All user data and access will be
              permanently removed.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <Button
                color="failure"
                onClick={handleDeleteUser}
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
