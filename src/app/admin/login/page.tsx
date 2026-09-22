import { login } from "@/app/admin/actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <form
        action={login}
        className="w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6"
      >
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-500">price.lk admin dashboard</p>
        {error && (
          <p className="mt-3 rounded-md bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-600">
            Wrong password.
          </p>
        )}
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="mt-4 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
