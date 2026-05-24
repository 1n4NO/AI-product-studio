import test from "node:test";
import assert from "node:assert/strict";
import { createSloAlert, dispatchAlert, dryRunTransport, routeAlert } from "../src/alerts";

test("createSloAlert formats structured alert payload", () => {
  const alert = createSloAlert(
    {
      indicator: "availability",
      observed: 0.97,
      target: 0.995,
      severity: "critical",
      message: "Availability below target"
    },
    { environment: "production", service: "studio-web" }
  );

  assert.equal(alert.severity, "critical");
  assert.equal(alert.tags.includes("slo"), true);
  assert.equal(alert.metadata.environment, "production");
});

test("routeAlert sends critical to pager and warning to slack", () => {
  const critical = routeAlert({
    id: "a1",
    createdAt: new Date().toISOString(),
    severity: "critical",
    title: "critical",
    summary: "critical",
    tags: [],
    metadata: {}
  });
  const warning = routeAlert({
    id: "a2",
    createdAt: new Date().toISOString(),
    severity: "warning",
    title: "warning",
    summary: "warning",
    tags: [],
    metadata: {}
  });

  assert.deepEqual(critical.channels, ["pager", "slack", "email"]);
  assert.deepEqual(warning.channels, ["slack"]);
});

test("dispatchAlert sends to each routed channel", async () => {
  const alert = createSloAlert(
    {
      indicator: "latency",
      observed: 4200,
      target: 3000,
      severity: "warning",
      message: "Latency high"
    },
    { environment: "staging", service: "studio-web" }
  );
  const route = routeAlert(alert);
  const results = await dispatchAlert(alert, route, dryRunTransport);

  assert.equal(results.length, route.channels.length);
  assert.equal(results.every((r) => r.delivered), true);
});
