/**
 * Create User Form Component
 *
 * Modal form for creating new users with proper React Hook Form integration,
 * error handling, and validation following the project's standards.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button, Label, TextInput, Select } from "flowbite-react";
import { useReactHookForm, useUserManagement } from "@/hooks";
import type {
  CreateUserFormProps,
  CreateUserFormData,
} from "./CreateUserForm.types";
import type {
  CreateUserInput,
  UserManagementError,
} from "@/interfaces/UserManagement";

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableRoles = [],
  availableDepartments = [],
}) => {
  const {
    createUser,
    getRoles,
    getDepartments,
    roles: stateRoles,
    departments: stateDepartments,
    error,
    clearError,
  } = useUserManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // Use provided roles/departments or fetch from state
  const roles = availableRoles.length > 0 ? availableRoles : stateRoles;
  const departments =
    availableDepartments.length > 0 ? availableDepartments : stateDepartments;

  // Handle role checkbox changes
  const handleRoleChange = (roleId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoles((prev) => [...prev, roleId]);
      form.setValue("role_ids", [...selectedRoles, roleId]);
    } else {
      setSelectedRoles((prev) => prev.filter((id) => id !== roleId));
      form.setValue(
        "role_ids",
        selectedRoles.filter((id) => id !== roleId),
      );
    }
  };

  const form = useReactHookForm<CreateUserFormData>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      display_name: "",
      role_ids: [], // Start with empty array for multiple selection
      department_id: "",
    },
  });

  // Load roles and departments if not provided and not already loaded
  useEffect(() => {
    const loadData = async () => {
      const promises: Promise<void>[] = [];

      if (availableRoles.length === 0 && stateRoles.length === 0) {
        promises.push(getRoles());
      }

      if (availableDepartments.length === 0 && stateDepartments.length === 0) {
        promises.push(getDepartments());
      }

      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (error) {
          console.warn("Could not load form data:", error);
        }
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [
    isOpen,
    availableRoles.length,
    stateRoles.length,
    availableDepartments.length,
    stateDepartments.length,
    getRoles,
    getDepartments,
  ]);

  // Clear form and errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSelectedRoles([]);
      clearError();
    }
  }, [isOpen, form, clearError]);

  const onSubmit = async (data: CreateUserFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      clearError();

      // Validate that at least one role is selected
      if (selectedRoles.length === 0) {
        form.setError("role_ids", {
          type: "manual",
          message: "Please select at least one role",
        });
        return;
      }

      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        form.setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        return;
      }

      // Prepare create user input
      const createUserData: CreateUserInput = {
        email: data.email.trim(),
        password: data.password,
        display_name: data.display_name.trim() || data.email.split("@")[0],
        role_ids: selectedRoles.length > 0 ? selectedRoles : [3], // Default to basic user role if none selected
        department_id: data.department_id || undefined,
        metadata: {
          created_by: "admin", // TODO: Get from current user context
          created_via: "admin_panel",
        },
      };

      const newUser = await createUser(createUserData);

      if (newUser) {
        // Success - reset form and close modal
        form.reset();
        setSelectedRoles([]);
        onSuccess?.(newUser);
        onClose();
      }
    } catch (err) {
      // Handle specific email exists error
      if (err instanceof Error) {
        const error = err as UserManagementError;
        if (error.code === "email_exists") {
          form.setError("email", {
            type: "manual",
            message: error.message,
          });
        } else {
          form.setError("root", {
            type: "manual",
            message: error.message || "Failed to create user",
          });
        }
      } else {
        form.setError("root", {
          type: "manual",
          message: "An unexpected error occurred",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create New User
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a new user to the system
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Global error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Root form error */}
        {form.formState.errors.root && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900 dark:text-red-300">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="mb-2 block">
              Email Address *
            </Label>
            <TextInput
              id="email"
              type="email"
              placeholder="user@example.com"
              {...form.register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Please enter a valid email address",
                },
              })}
              color={form.formState.errors.email ? "failure" : "gray"}
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Display Name Field */}
          <div>
            <Label htmlFor="display_name" className="mb-2 block">
              Display Name
            </Label>
            <TextInput
              id="display_name"
              type="text"
              placeholder="John Doe"
              {...form.register("display_name", {
                minLength: {
                  value: 2,
                  message: "Display name must be at least 2 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Display name must be less than 100 characters",
                },
              })}
              color={form.formState.errors.display_name ? "failure" : "gray"}
              disabled={isSubmitting}
            />
            {form.formState.errors.display_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.display_name.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" className="mb-2 block">
              Password *
            </Label>
            <TextInput
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                },
              })}
              color={form.formState.errors.password ? "failure" : "gray"}
              disabled={isSubmitting}
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <Label htmlFor="confirmPassword" className="mb-2 block">
              Confirm Password *
            </Label>
            <TextInput
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.register("confirmPassword", {
                required: "Please confirm your password",
              })}
              color={form.formState.errors.confirmPassword ? "failure" : "gray"}
              disabled={isSubmitting}
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Multiple Role Selection */}
          <div>
            <Label className="mb-2 block">Roles *</Label>
            <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-3 dark:border-gray-600">
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading roles...
                </p>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onChange={(e) =>
                        handleRoleChange(role.id, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`role-${role.id}`}
                      className="ml-2 cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      {role.name}
                      {role.description && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}
                          - {role.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
            {form.formState.errors.role_ids && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.role_ids.message}
              </p>
            )}
          </div>

          {/* Department Selection */}
          <div>
            <Label htmlFor="department_id" className="mb-2 block">
              Department
            </Label>
            <Select
              id="department_id"
              {...form.register("department_id")}
              color={form.formState.errors.department_id ? "failure" : "gray"}
              disabled={isSubmitting}
            >
              <option value="">Select a department (optional)</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                  {department.description ? ` - ${department.description}` : ""}
                </option>
              ))}
            </Select>
            {form.formState.errors.department_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.department_id.message}
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              color="gray"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="blue"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
