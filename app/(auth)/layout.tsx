import { BrandLogo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <BrandLogo markClassName="size-12 rounded-2xl" nameClassName="text-2xl text-white [&>span]:text-cyan-200" className="mb-3 flex-col gap-2" />
          <p className="mt-1 text-sm text-indigo-100">
            A private space to write, reflect, and understand your emotions.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
