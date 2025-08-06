import Link from "next/link";

export default function Custom404() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 px-6">
            <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Page not found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
            >
                Go back home
            </Link>
        </div>
    );
}
