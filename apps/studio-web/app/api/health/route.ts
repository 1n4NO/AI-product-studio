import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "studio-web",
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development"
    },
    { status: 200 }
  );
}

