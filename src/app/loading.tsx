import { InlineLoader } from "@/components/shared/logo-loader";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <InlineLoader />
    </div>
  );
}
