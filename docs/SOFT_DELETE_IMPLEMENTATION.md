# Soft Delete Implementation Guide

## Overview
This document outlines the complete soft delete implementation using `is_deleted`, `deleted_at`, and `deleted_by` fields across the Knowledge Advisor Enterprise application.

## Database Schema Requirements

### Required Fields for All Tables

All tables that support soft delete should have these three fields:

```sql
-- Boolean flag for soft delete status
is_deleted BOOLEAN NOT NULL DEFAULT FALSE

-- Timestamp when the record was deleted
deleted_at TIMESTAMP WITH TIME ZONE

-- User ID who performed the delete operation
deleted_by UUID REFERENCES auth.users(id)
```

### Tables Requiring Soft Delete Fields

1. **knowledge_base** (projects)
   - is_deleted
   - deleted_at
   - deleted_by

2. **documents**
   - is_deleted
   - deleted_at
   - deleted_by

3. **profiles** (users)
   - is_deleted
   - deleted_at
   - deleted_by

4. **roles**
   - is_deleted
   - deleted_at
   - deleted_by

5. **permissions**
   - is_deleted
   - deleted_at
   - deleted_by

6. **departments**
   - is_deleted
   - deleted_at
   - deleted_by

7. **integration_accounts**
   - is_deleted
   - deleted_at
   - deleted_by

8. **delivery_endpoints**
   - is_deleted
   - deleted_at
   - deleted_by

9. **chat_sessions**
   - is_deleted
   - deleted_at
   - deleted_by

## TypeScript Interface Updates ✅ COMPLETED

All core interfaces have been updated with soft delete fields:

### Project.ts
- ✅ Project interface
- ✅ Document interface

### Supabase.ts  
- ✅ SupabaseProjectRow
- ✅ SupabaseDocumentRow

### SupabaseTypes.ts
- ✅ SupabaseDocumentRow
- ✅ DocumentWithProject  
- ✅ AuthProfileRow

### Integration.ts
- ✅ IntegrationAccount
- ✅ DeliveryEndpoint

### UserManagement.ts
- ✅ User
- ✅ Role
- ✅ Permission
- ✅ Department

## Service Layer Updates Required

### Pattern for Delete Operations

```typescript
async deleteRecord(id: string): Promise<void> {
  // Get current user for tracking
  const user = await getCurrentUser();
  const supabase = createClientTable();
  
  const { error } = await supabase
    .from('table_name')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString(),
      deleted_by: user.id 
    })
    .eq('id', id)
    .eq('is_deleted', false); // Only delete if not already deleted
    
  if (error) {
    throw new Error(`Failed to delete record: ${error.message}`);
  }
}
```

### Pattern for Query Operations

```typescript
async getRecords(): Promise<Record[]> {
  const supabase = createClientTable();
  
  const { data, error } = await supabase
    .from('table_name')
    .select(`
      id,
      name,
      ... other fields ...,
      is_deleted,
      deleted_at,
      deleted_by,
      created_at,
      updated_at
    `)
    .eq('is_deleted', false) // Filter out deleted records
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch records: ${error.message}`);
  }
  
  return data || [];
}
```

### Services Requiring Updates

#### 1. services/Project/supabase.ts  
- ✅ deleteProject() - Updated with is_deleted flag and deleted_by
- ✅ deleteDocument() - Updated with is_deleted flag and deleted_by  
- ✅ batchDeleteProjects() - Updated with is_deleted flag and deleted_by
- 🔄 getProjects() - NEEDS: Add is_deleted fields to select query + filter
- 🔄 getProjectById() - NEEDS: Add is_deleted fields to select query + filter
- 🔄 getProjectsWithPagination() - NEEDS: Add filter for is_deleted = false
- 🔄 searchProjects() - NEEDS: Add filter for is_deleted = false
- 🔄 getDocumentsByProjectId() - NEEDS: Add filter for is_deleted = false
- 🔄 getAllUserDocuments() - NEEDS: Add filter for is_deleted = false

#### 2. services/KnowledgeBaseService/index.ts
- 🔄 deleteProject() - NEEDS: Add deleted_by tracking
- 🔄 All fetch methods - NEEDS: Add is_deleted = false filter

#### 3. services/DocumentService/index.ts
- 🔄 deleteDocument() - NEEDS: Add deleted_by tracking
- 🔄 All fetch methods - NEEDS: Add is_deleted = false filter

#### 4. services/UserManagementService/index.ts
- ✅ deleteUser() - Already has deleted_at, needs is_deleted + deleted_by
- ✅ deleteRole() - Already has deleted_at, needs is_deleted + deleted_by
- ✅ deletePermission() - Already has deleted_at, needs is_deleted + deleted_by
- ✅ deleteDepartment() - Already has deleted_at, needs is_deleted + deleted_by
- ✅ getUsers() - Already filters deleted_at, needs is_deleted filter

#### 5. services/IntegrationService/index.ts
- ✅ deleteIntegration() - Already has deleted_at, needs is_deleted + deleted_by
- ✅ deleteEndpoint() - Already has deleted_at, needs is_deleted + deleted_by

#### 6. services/ChatHistoryService/index.ts
- ✅ deleteSession() - Already has deleted_at, needs is_deleted + deleted_by

## SQL Migration Script

```sql
-- Add soft delete fields to knowledge_base table
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_deleted ON knowledge_base(is_deleted);

-- Add soft delete fields to documents table  
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON documents(is_deleted);

-- Add soft delete fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON profiles(is_deleted);

-- Add soft delete fields to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_roles_is_deleted ON roles(is_deleted);

-- Add soft delete fields to permissions table
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_permissions_is_deleted ON permissions(is_deleted);

-- Add soft delete fields to departments table
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_departments_is_deleted ON departments(is_deleted);

-- Add soft delete fields to integration_accounts table  
ALTER TABLE integration_accounts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_integration_accounts_is_deleted ON integration_accounts(is_deleted);

-- Add soft delete fields to delivery_endpoints table
ALTER TABLE delivery_endpoints
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_delivery_endpoints_is_deleted ON delivery_endpoints(is_deleted);

-- Add soft delete fields to chat_sessions table
ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_deleted ON chat_sessions(is_deleted);
```

## RLS Policy Updates

All RLS policies should be updated to exclude deleted records:

```sql
-- Example: Update knowledge_base policies
DROP POLICY IF EXISTS "Users can view own projects" ON knowledge_base;
CREATE POLICY "Users can view own projects" ON knowledge_base
  FOR SELECT USING (
    auth.uid() = owner AND is_deleted = FALSE
  );

-- Example: Update documents policies  
DROP POLICY IF EXISTS "Users can view project documents" ON documents;
CREATE POLICY "Users can view project documents" ON documents
  FOR SELECT USING (
    is_deleted = FALSE AND
    project_id IN (
      SELECT id FROM knowledge_base 
      WHERE owner = auth.uid() AND is_deleted = FALSE
    )
  );
```

## Testing Checklist

### Unit Tests
- [ ] Test delete operations set all three fields correctly
- [ ] Test queries exclude deleted records by default
- [ ] Test deleted_by tracks correct user ID
- [ ] Test cannot delete already deleted records

### Integration Tests  
- [ ] Test cascading deletes (project → documents)
- [ ] Test user can only see non-deleted records
- [ ] Test admin can view deleted records (if implemented)
- [ ] Test restore functionality (if implemented)

### UI Tests
- [ ] Deleted projects don't appear in lists
- [ ] Deleted documents don't appear in project view
- [ ] Delete confirmation shows correct messaging
- [ ] No errors when deleting records

## Best Practices

1. **Always Filter Deleted Records**: Every SELECT query should include `.eq('is_deleted', false)` unless specifically querying deleted records.

2. **Track Deletion User**: Always set `deleted_by` to the current user's ID when performing soft delete.

3. **Use Consistent Pattern**: Follow the established pattern for delete operations across all services.

4. **Index Performance**: Ensure `is_deleted` columns are indexed for query performance.

5. **Document Exceptions**: If any table doesn't use soft delete (e.g., join tables), document why.

6. **Audit Trail**: Consider implementing a separate audit log table for compliance.

## Future Enhancements

1. **Restore Functionality**: Add methods to restore soft-deleted records
2. **Admin View**: Allow admins to view/manage deleted records
3. **Permanent Delete**: Add scheduled job to permanently delete old soft-deleted records
4. **Bulk Operations**: Support bulk restore/permanent delete operations
5. **Audit Dashboard**: UI to view deletion history and statistics

## Status

- ✅ Interface definitions updated
- 🔄 Service layer partially updated (delete operations)
- ❌ Query operations need filtering
- ❌ Database migrations pending
- ❌ RLS policies need updates
- ❌ Tests need implementation
