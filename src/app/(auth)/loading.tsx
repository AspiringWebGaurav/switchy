import { InlineLoader } from "@/components/shared/logo-loader";

export default function AuthLoading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <InlineLoader text="Authenticating..." />
    </div>
  );
}
