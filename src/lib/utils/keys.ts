import { randomBytes } from "crypto";
import { PUBLIC_KEY_PREFIX, PUBLIC_KEY_BYTES } from "@/config/constants";

export function generatePublicKey(): string {
  return PUBLIC_KEY_PREFIX + randomBytes(PUBLIC_KEY_BYTES).toString("hex");
}
