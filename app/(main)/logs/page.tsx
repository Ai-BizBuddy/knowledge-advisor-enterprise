import { PageHeader } from '@/components';
import { LogsTable } from '@/components/logsTable/LogsTableNew';

export default function LogsPageNew() {
  return (
    <div className='h-full'>
      {/* Main Container with Mac-optimized responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Page Header */}
        <div className='space-y-3 pb-3'>
          <PageHeader
            title='Logs'
            subtitle='View and manage system logs and activities.'
          />
        </div>

        <LogsTable />
      </div>
    </div>
  );
}