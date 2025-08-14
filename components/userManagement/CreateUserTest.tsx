/**
 * Create User Form Test Component
 *
 * This component demonstrates how to use the new CreateUserForm
 * and test the email_exists error handling.
 */

"use client";

import React, { useState } from "react";
import { Button } from "flowbite-react";
import { CreateUserForm } from "@/components/userManagement";
import { useUserManagement } from "@/hooks";
import type { User } from "@/interfaces/UserManagement";

export const CreateUserTest: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lastCreatedUser, setLastCreatedUser] = useState<User | null>(null);
  const { roles, getRoles } = useUserManagement();

  // Load roles when component mounts
  React.useEffect(() => {
    if (roles.length === 0) {
      getRoles();
    }
  }, [roles.length, getRoles]);

  const handleUserCreationSuccess = (newUser: User) => {
    setLastCreatedUser(newUser);

    // Show success message
    alert(
      `User "${newUser.display_name || newUser.email}" created successfully!`,
    );
  };

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 dark:bg-gray-800">
      <div>
        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          Create User Form Test
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Test the new React Hook Form implementation with proper error
          handling.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Open Create User Form
        </Button>

        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <h3 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-200">
            Testing Email Exists Error
          </h3>
          <p className="mb-3 text-sm text-yellow-700 dark:text-yellow-300">
            To test the email_exists error handling:
          </p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>
              Create a user with any email (e.g., &quot;test@example.com&quot;)
            </li>
            <li>Try to create another user with the same email</li>
            <li>
              You should see: &quot;A user with this email address has already
              been registered&quot;
            </li>
            <li>
              The error will appear under the email field with red styling
            </li>
          </ol>
        </div>

        {lastCreatedUser && (
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <h3 className="mb-2 font-semibold text-green-800 dark:text-green-200">
              Last Created User
            </h3>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p>
                <strong>ID:</strong> {lastCreatedUser.id}
              </p>
              <p>
                <strong>Email:</strong> {lastCreatedUser.email}
              </p>
              <p>
                <strong>Display Name:</strong>{" "}
                {lastCreatedUser.display_name || "Not set"}
              </p>
              <p>
                <strong>Status:</strong> {lastCreatedUser.status}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(lastCreatedUser.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create User Form Modal */}
      <CreateUserForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleUserCreationSuccess}
        availableRoles={roles}
      />
    </div>
  );
};
