import { NextResponse } from "next/server";
import { createSloAlert, dispatchAlert, dryRunTransport, routeAlert, type SloBreach } from "@product-studio/agent-runtime";

interface Body {
  breach?: Partial<SloBreach>;
  environment?: string;
  service?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  const breach: SloBreach = {
    indicator: body.breach?.indicator ?? "availability",
    observed: Number(body.breach?.observed ?? 0.97),
    target: Number(body.breach?.target ?? 0.995),
    severity: body.breach?.severity ?? "warning",
    message: body.breach?.message ?? "SLO breach detected"
  };

  const alert = createSloAlert(breach, {
    environment: body.environment ?? "development",
    service: body.service ?? "studio-web"
  });
  const route = routeAlert(alert);
  const results = await dispatchAlert(alert, route, dryRunTransport);

  return NextResponse.json({
    alert,
    route,
    results
  });
}
