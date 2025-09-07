import {
  AddUserToKnowledgeBaseInput,
  KnowledgeBaseUser,
  KnowledgeBaseUserFilter,
  PaginatedKnowledgeBaseUsers,
  UpdateKnowledgeBaseUserRoleInput,
} from '@/interfaces/KnowledgeBaseUserRole';
import knowledgeBaseUserService, {
  TypedResponse,
  UserSearchResult,
} from '@/services/KnowledgeBaseUserService';

/**
 * Get knowledge base users with pagination and filtering
 */
export async function getKnowledgeBaseUsers(
  knowledgeBaseId: string,
  page: number = 1,
  limit: number = 10,
  filter?: KnowledgeBaseUserFilter,
): Promise<TypedResponse<PaginatedKnowledgeBaseUsers>> {
  return await knowledgeBaseUserService.getKnowledgeBaseUsers(
    knowledgeBaseId,
    page,
    limit,
    filter,
  );
}

/**
 * Add user to knowledge base with specific role
 */
export async function addUserToKnowledgeBase(
  input: AddUserToKnowledgeBaseInput,
): Promise<TypedResponse<KnowledgeBaseUser>> {
  return await knowledgeBaseUserService.addUserToKnowledgeBase(input);
}

/**
 * Update user role in knowledge base
 */
export async function updateKnowledgeBaseUserRole(
  userId: string,
  knowledgeBaseId: string,
  updates: UpdateKnowledgeBaseUserRoleInput,
): Promise<TypedResponse<KnowledgeBaseUser>> {
  return await knowledgeBaseUserService.updateKnowledgeBaseUserRole(
    userId,
    knowledgeBaseId,
    updates,
  );
}

/**
 * Remove user from knowledge base
 */
export async function removeUserFromKnowledgeBase(
  userId: string,
  knowledgeBaseId: string,
): Promise<TypedResponse<void>> {
  return await knowledgeBaseUserService.removeUserFromKnowledgeBase(
    userId,
    knowledgeBaseId,
  );
}

/**
 * Search users for knowledge base assignment
 */
export async function searchUsersForKnowledgeBase(
  knowledgeBaseId: string,
  searchTerm: string,
  limit: number = 10,
): Promise<TypedResponse<UserSearchResult[]>> {
  return await knowledgeBaseUserService.searchUsersForKnowledgeBase(
    knowledgeBaseId,
    searchTerm,
    limit,
  );
}
