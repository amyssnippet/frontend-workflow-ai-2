export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-center">
      <h1 className="text-9xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-6">
        404
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
        The page you are looking for does not exist in the workspace.
      </p>
      <a
        href="/workspace"
        className="text-indigo-600 dark:text-indigo-400 hover:underline text-lg font-semibold"
      >
        Return to Workspace Home
      </a>
    </div>
  );
}
