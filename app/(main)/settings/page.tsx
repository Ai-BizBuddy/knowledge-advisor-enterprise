'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { usePermissionManagement } from '@/hooks';
import { usePaginatedUserManagement } from '@/hooks/usePaginatedUserManagement';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { UserStatus } from '@/interfaces/UserManagement';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Spinner,
  TabItem,
  Tabs,
} from 'flowbite-react';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

export default function SettingsPage() {
  const { setLoading } = useLoading();
  const { systemStatus } = useSystemStatus();

  // Data hooks
  const {
    users,
    roles,
    departments,
    loading: loadingUM,
    error: errorUM,
    getUsersPaginated,
    getUserStatistics,
    getRolesPaginated,
    getDepartmentsPaginated,
  } = usePaginatedUserManagement();

  const {
    resources: permissionResources,
    loading: loadingPerm,
    error: errorPerm,
    clearError: clearPermError,
  } = usePermissionManagement();

  // Local tab state is driven by Tabs internals; no external usage needed

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  // Initial lightweight loads for dashboard previews
  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          getUsersPaginated({ page: 1, pageSize: 5 }),
          getUserStatistics(),
          getRolesPaginated({ page: 1, pageSize: 5 }),
          getDepartmentsPaginated({ page: 1, pageSize: 5 }),
        ]);
  } catch {
        // handled via hook error states
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usersPreview = useMemo(() => users?.data?.slice(0, 5) ?? [], [users]);
  const rolesPreview = useMemo(() => roles?.data?.slice(0, 5) ?? [], [roles]);
  const departmentsPreview = useMemo(
    () => departments?.data?.slice(0, 5) ?? [],
    [departments],
  );

  const LoadingBlock = (
    <div className='flex h-32 items-center justify-center'>
      <Spinner size='lg' />
    </div>
  );

  const ErrorBlock = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <Alert color='failure'>
      <div className='flex items-center justify-between'>
        <span>{message}</span>
        {onRetry && (
          <Button size='xs' color='gray' onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );

  return (
    <div className='space-y-6'>
      {/* System status summary */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <div className='flex items-center'>
            <div className='rounded-lg bg-blue-100 p-3 dark:bg-blue-900'>
              <svg className='h-6 w-6 text-blue-600 dark:text-blue-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>Total Users</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{systemStatus.loading ? '...' : systemStatus.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center'>
            <div className='rounded-lg bg-green-100 p-3 dark:bg-green-900'>
              <svg className='h-6 w-6 text-green-600 dark:text-green-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>Active Sessions</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{systemStatus.loading ? '...' : systemStatus.activeSessions}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center'>
            <div className='rounded-lg bg-purple-100 p-3 dark:bg-purple-900'>
              <svg className='h-6 w-6 text-purple-600 dark:text-purple-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>System Roles</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{systemStatus.loading ? '...' : systemStatus.systemRoles}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs: Users | Roles | Permissions | Departments */}
      <Card className='p-2'>
  <Tabs aria-label='Settings tabs' variant='underline'>
          <TabItem active title='Users'>
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Users</h2>
                <p className='text-sm text-gray-600 dark:text-gray-400'>Manage user accounts, profiles, and access</p>
              </div>
              <Link href='/settings/users'>
                <Button>Open Users</Button>
              </Link>
            </div>
            <div className='overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
              {loadingUM && usersPreview.length === 0 ? (
                LoadingBlock
              ) : errorUM ? (
                <ErrorBlock message={errorUM} onRetry={() => getUsersPaginated({ page: 1, pageSize: 5 })} />
              ) : usersPreview.length === 0 ? (
                <div className='p-8 text-center text-sm text-gray-500 dark:text-gray-400'>No users yet</div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead className='bg-gray-50 dark:bg-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>User</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Role</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Status</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Created</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                      {usersPreview.map((u) => (
                        <tr key={u.id} className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'>
                          <td className='px-6 py-4'>
                            <div className='flex items-center'>
                              <Avatar img={u.avatar_url} rounded size='sm' className='mr-3' />
                              <div>
                                <div className='text-sm font-medium text-gray-900 dark:text-white'>{u.display_name || u.email}</div>
                                <div className='text-xs text-gray-500 dark:text-gray-400'>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <Badge color='purple' size='sm'>
                              {u.user_roles && u.user_roles.length > 0 ? u.user_roles[0]?.role?.name || 'Unknown' : 'No Role'}
                            </Badge>
                          </td>
                          <td className='px-6 py-4'>
                            <Badge color={u.status === UserStatus.ACTIVE ? 'success' : u.status === UserStatus.SUSPENDED ? 'failure' : u.status === UserStatus.PENDING ? 'warning' : 'gray'}>
                              {u.status.charAt(0).toUpperCase() + u.status.slice(1).toLowerCase()}
                            </Badge>
                          </td>
                          <td className='px-6 py-4'>
                            <span className='text-sm text-gray-500 dark:text-gray-400'>{new Date(u.created_at).toLocaleDateString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabItem>

          <TabItem title='Roles'>
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Roles</h2>
                <p className='text-sm text-gray-600 dark:text-gray-400'>Configure user roles and permission levels</p>
              </div>
              <Link href='/settings/roles'>
                <Button>Open Roles</Button>
              </Link>
            </div>
            <div className='overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
              {loadingUM && rolesPreview.length === 0 ? (
                LoadingBlock
              ) : errorUM ? (
                <ErrorBlock message={errorUM} onRetry={() => getRolesPaginated({ page: 1, pageSize: 5 })} />
              ) : rolesPreview.length === 0 ? (
                <div className='p-8 text-center text-sm text-gray-500 dark:text-gray-400'>No roles yet</div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead className='bg-gray-50 dark:bg-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Role</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Level</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Type</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Created</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                      {rolesPreview.map((r) => (
                        <tr key={r.id} className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'>
                          <td className='px-6 py-4'>
                            <div>
                              <div className='text-sm font-medium text-gray-900 dark:text-white'>{r.name}</div>
                              <div className='text-xs text-gray-500 dark:text-gray-400'>{r.description || '—'}</div>
                            </div>
                          </td>
                          <td className='px-6 py-4'>
                            <Badge color={(r.level || 0) >= 90 ? 'failure' : (r.level || 0) >= 70 ? 'warning' : 'info'}>
                              {r.level || 0}
                            </Badge>
                          </td>
                          <td className='px-6 py-4'>
                            <Badge color={r.is_system_role ? 'blue' : 'gray'} size='sm'>
                              {r.is_system_role ? 'System' : 'Custom'}
                            </Badge>
                          </td>
                          <td className='px-6 py-4'>
                            <span className='text-sm text-gray-500 dark:text-gray-400'>{new Date(r.created_at).toLocaleDateString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabItem>

          <TabItem title='Permissions'>
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Permissions</h2>
                <p className='text-sm text-gray-600 dark:text-gray-400'>Set up granular access for resources and actions</p>
              </div>
              <Link href='/settings/permissions'>
                <Button>Open Permissions</Button>
              </Link>
            </div>
            <div className='overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
              {loadingPerm && permissionResources.length === 0 ? (
                LoadingBlock
              ) : errorPerm ? (
                <ErrorBlock message={errorPerm} onRetry={clearPermError} />
              ) : permissionResources.length === 0 ? (
                <div className='p-8 text-center text-sm text-gray-500 dark:text-gray-400'>No permission resources</div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead className='bg-gray-50 dark:bg-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Resource</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Description</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                      {permissionResources.slice(0, 5).map((res) => (
                        <tr key={res.key} className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'>
                          <td className='px-6 py-4 font-medium text-gray-900 dark:text-white'>{res.name}</td>
                          <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-300'>{res.description}</td>
                          <td className='px-6 py-4'>
                            <div className='flex flex-wrap gap-2'>
                              {res.actions.slice(0, 6).map((a) => (
                                <Badge key={`${res.key}-${a}`} color='indigo' size='sm'>
                                  {a.toUpperCase()}
                                </Badge>
                              ))}
                              {res.actions.length > 6 && (
                                <Badge color='gray' size='sm'>+{res.actions.length - 6} more</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabItem>

          <TabItem title='Departments'>
            <div className='mb-4 flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Departments</h2>
                <p className='text-sm text-gray-600 dark:text-gray-400'>Organize users by departments and teams</p>
              </div>
              <Link href='/settings/departments'>
                <Button>Open Departments</Button>
              </Link>
            </div>
            <div className='overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700'>
              {loadingUM && departmentsPreview.length === 0 ? (
                LoadingBlock
              ) : errorUM ? (
                <ErrorBlock message={errorUM} onRetry={() => getDepartmentsPaginated({ page: 1, pageSize: 5 })} />
              ) : departmentsPreview.length === 0 ? (
                <div className='p-8 text-center text-sm text-gray-500 dark:text-gray-400'>No departments yet</div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                    <thead className='bg-gray-50 dark:bg-gray-700'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Name</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Description</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Status</th>
                        <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Created</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                      {departmentsPreview.map((d) => (
                        <tr key={d.id} className='transition-colors hover:bg-gray-50 dark:hover:bg-gray-700'>
                          <td className='px-6 py-4 font-medium text-gray-900 dark:text-white'>{d.name}</td>
                          <td className='px-6 py-4 text-sm text-gray-600 dark:text-gray-300'>
                            {d.description || '—'}
                          </td>
                          <td className='px-6 py-4'>
                            <Badge color={d.is_active ? 'success' : 'gray'} size='sm'>
                              {d.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className='px-6 py-4'>
                            <span className='text-sm text-gray-500 dark:text-gray-400'>{new Date(d.created_at).toLocaleDateString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabItem>
        </Tabs>
      </Card>
    </div>
  );
}
