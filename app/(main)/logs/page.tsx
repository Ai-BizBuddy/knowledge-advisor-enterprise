import { LogTable, PageHeader } from '@/components';
import { Card } from 'flowbite-react';


export default function LogsPage() {

    return <div className='h-full '>
      {/* Main Container with Mac-optimized responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Page Header */}
        <div className='space-y-3 pb-3 '>
          <PageHeader
            title='App Logs'
            subtitle='Manage your enterprise application logs'
          />
        </div>

        <Card>
            <div className='flex h-full flex-col justify-center gap-4 p-6'>
                <LogTable />
            </div>
        </Card>

       
      </div>
    </div>;
}