import { Brain } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-indigo-500">
            <Brain className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold">NeuroSignal</h1>
          <p className="mt-1 text-sm text-indigo-100">
            A private space to write, reflect, and understand your emotions.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
