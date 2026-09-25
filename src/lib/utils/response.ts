import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ status: "ok", data }, { status });
}

export function error(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ status: "error", error: message }, { status });
}
