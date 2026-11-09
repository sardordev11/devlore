import { HomeNav } from "@/components/home/HomeNav";

// Sign in and sign up share the homepage nav; the form sits centered below it.
export default function NavAuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HomeNav />
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
