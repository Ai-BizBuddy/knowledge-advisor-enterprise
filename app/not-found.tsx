import Link from 'next/link';

export default function Custom404() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-white px-6 dark:bg-gray-900'>
      <h1 className='mb-4 text-6xl font-bold text-blue-600 dark:text-blue-400'>
        404
      </h1>
      <h2 className='mb-2 text-2xl font-semibold text-gray-800 md:text-3xl dark:text-gray-100'>
        Page not found
      </h2>
      <p className='mb-6 text-center text-gray-600 dark:text-gray-400'>
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
        moved.
      </p>
      <Link
        href='/'
        className='inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700'
      >
        Go back home
      </Link>
    </div>
  );
}
