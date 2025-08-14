"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Modal,
  Label,
  TextInput,
  Badge,
  Textarea,
  Checkbox,
} from "flowbite-react";
import { usePaginatedUserManagement } from "@/hooks/usePaginatedUserManagement";
import { Pagination } from "@/components/pagination";
import { Department, CreateDepartmentInput } from "@/interfaces/UserManagement";
import { DEFAULT_PAGE_SIZE } from "@/interfaces/Pagination";

export default function DepartmentsPage() {
  const { departments, loading, error, getDepartmentsPaginated, clearError } =
    usePaginatedUserManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateDepartmentInput>({
    name: "",
    description: "",
    is_active: true,
    settings: {},
  });

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState("");
  const initialLoadRef = useRef(false);

  // Load data with debouncing for search/filters, immediate for initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        await getDepartmentsPaginated({
          page: 1,
          pageSize,
          search: searchTerm,
          is_active:
            statusFilter === "active"
              ? true
              : statusFilter === "inactive"
                ? false
                : undefined,
        });
        setCurrentPage(1);
        if (!initialLoadRef.current) {
          initialLoadRef.current = true;
        }
      } catch (error) {
        console.error("Error loading departments data:", error);
      }
    };

    // Initial load without debouncing
    if (!initialLoadRef.current) {
      loadData();
      return;
    }

    // Subsequent loads with debouncing
    const timeoutId = setTimeout(loadData, 200);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, pageSize, statusFilter]); // Intentionally omitting getDepartmentsPaginated

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      getDepartmentsPaginated({
        page,
        pageSize,
        search: searchTerm,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
    },
    [pageSize, searchTerm, statusFilter, getDepartmentsPaginated],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setCurrentPage(1);
      getDepartmentsPaginated({
        page: 1,
        pageSize: newPageSize,
        search: searchTerm,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
    },
    [searchTerm, statusFilter, getDepartmentsPaginated],
  );

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
      settings: {},
    });
    setSelectedDepartment(null);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setShowCreateModal(false);
      resetForm();
      // Refresh current page
      getDepartmentsPaginated({
        page: currentPage,
        pageSize,
        search: searchTerm,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
    } catch (error) {
      console.error("Error creating department:", error);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    try {
      // Will implement with service integration
      setShowEditModal(false);
      resetForm();
      // Refresh current page
      getDepartmentsPaginated({
        page: currentPage,
        pageSize,
        search: searchTerm,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
    } catch (error) {
      console.error("Error updating department:", error);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      setShowDeleteModal(false);
      setSelectedDepartment(null);
      // Refresh current page
      getDepartmentsPaginated({
        page: currentPage,
        pageSize,
        search: searchTerm,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  const toggleDepartmentStatus = async (department: Department) => {
    try {
      console.log(department);
      // Refresh current page
      getDepartmentsPaginated({
        page: currentPage,
        pageSize,
        search: searchTerm,
        is_active:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
              ? false
              : undefined,
      });
    } catch (error) {
      console.error("Error toggling department status:", error);
    }
  };

  // Modal openers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || "",
      is_active: department.is_active,
      settings: department.settings || {},
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteModal(true);
  };

  // Utility functions
  const getDepartmentIcon = (name: string) => {
    const first = name.charAt(0).toUpperCase();
    const icons: Record<string, string> = {
      E: "💻", // Engineering
      M: "📊", // Marketing
      S: "💼", // Sales
      H: "👥", // HR
      F: "💰", // Finance
      O: "⚙️", // Operations
      I: "💡", // IT
      D: "🎨", // Design
      P: "📈", // Product
      L: "⚖️", // Legal
    };
    return icons[first] || "🏢";
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-red-500">Error loading departments</div>
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
            Departments Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage organizational departments and teams
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
          Create Department
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Departments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {departments?.pagination.total || 0}
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
                Active Departments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {departments?.data.filter((d) => d.is_active).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Inactive Departments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {departments?.data.filter((d) => !d.is_active).length || 0}
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {departments?.data.length
                  ? `${Math.round((departments.data.filter((d) => d.is_active).length / departments.data.length) * 100)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="statusFilter">Filter by Status</Label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              color="gray"
              onClick={() => {
                setStatusFilter("");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Departments Table */}
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
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                      Created By
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
                  {departments?.data.map((department) => (
                    <tr
                      key={department.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-purple-400 text-lg text-white">
                              {getDepartmentIcon(department.name)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {department.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {department.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {department.created_by || "System"}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {new Date(department.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            size="xs"
                            color="gray"
                            onClick={() => openEditModal(department)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            color="failure"
                            onClick={() => openDeleteModal(department)}
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
              {departments && (
                <div className="p-6">
                  <Pagination
                    currentPage={departments.pagination.page}
                    totalPages={departments.pagination.totalPages}
                    pageSize={departments.pagination.pageSize}
                    total={departments.pagination.total}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Search departments by name or description..."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Create Department Modal */}
      <Modal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="lg"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Create New Department
          </h3>
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div>
              <Label htmlFor="name">Department Name *</Label>
              <TextInput
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the department's purpose and responsibilities..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              <Label htmlFor="is_active">Active Department</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Department"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="lg"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Edit Department
          </h3>
          <form onSubmit={handleUpdateDepartment} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Department Name *</Label>
              <TextInput
                id="edit_name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              <Label htmlFor="edit_is_active">Active Department</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button color="gray" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Department"}
              </Button>
            </div>
          </form>
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
              Are you sure you want to delete the department{" "}
              <span className="font-semibold">
                &ldquo;{selectedDepartment?.name}&rdquo;
              </span>
              ?
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This action cannot be undone. Users in this department will need
              to be reassigned.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <Button
                color="failure"
                onClick={handleDeleteDepartment}
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
