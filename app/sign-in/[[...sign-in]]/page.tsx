import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#F0F0F0] text-[#0D0D0F] flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 select-none">
          <span className="text-[28px] font-bold tracking-tight text-[#0D0D0F]">
            biasly
          </span>
          <span className="text-[28px] font-normal text-[#0D0D0F]">
            News
          </span>
        </Link>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Sign in to access full article analyses and sentiment insights
        </p>
      </div>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}
