import { AppLoading } from '@/components';

export default function TestLoading() {
  return (
    <div className='space-y-8 p-8'>
      <h1 className='text-2xl font-bold'>Loading Components Test</h1>

      <div className='space-y-6'>
        <div>
          <h2 className='mb-4 text-lg font-semibold'>Default Loading</h2>
          <div className='rounded-lg border p-4'>
            <AppLoading message='Loading application...' />
          </div>
        </div>

        <div>
          <h2 className='mb-4 text-lg font-semibold'>Compact Loading</h2>
          <div className='rounded-lg border p-4'>
            <AppLoading variant='compact' message='Loading data...' />
          </div>
        </div>

        <div>
          <h2 className='mb-4 text-lg font-semibold'>Minimal Loading</h2>
          <div className='rounded-lg border p-4'>
            <AppLoading variant='minimal' message='Loading...' />
          </div>
        </div>
      </div>
    </div>
  );
}
