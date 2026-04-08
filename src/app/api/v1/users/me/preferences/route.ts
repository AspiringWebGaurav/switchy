import { NextRequest } from "next/server";
import { verifySession } from "@/lib/services/auth.service";
import { getUserPreferences, updateUserPreferences } from "@/lib/services/user.service";
import { updatePreferencesSchema } from "@/lib/validators/user";
import { success, error } from "@/lib/utils/response";

export async function GET() {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const preferences = await getUserPreferences(user.uid);
    return success(preferences);
  } catch (err) {
    console.error("[Preferences] Get failed:", err);
    return error("Failed to get preferences", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifySession();
    if (!user) return error("Unauthorized", 401);

    const body = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message, 400);
    }

    const updated = await updateUserPreferences(user.uid, parsed.data);
    return success(updated);
  } catch (err) {
    console.error("[Preferences] Update failed:", err);
    return error("Failed to update preferences", 500);
  }
}
