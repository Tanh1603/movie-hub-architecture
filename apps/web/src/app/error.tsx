'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen px-2 bg-gradient-to-r from-slate-200 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-red-600">Error</h1>
        <p className="text-2xl font-medium mt-4 text-black dark:text-white">
          Something went wrong!
        </p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 mt-8 bg-white font-semibold rounded-full hover:bg-purple-100 transition duration-300 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
