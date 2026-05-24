import { randomBytes } from "node:crypto";

export type LogLevel = "info" | "warn" | "error";

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface SpanContext extends TraceContext {
  name: string;
  startedAt: string;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId: string;
  spanId?: string;
  runId?: string;
  correlationId?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

export interface StructuredLogger {
  log: (entry: StructuredLogEntry) => void;
}

export interface SpanOptions {
  runId?: string;
  correlationId?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

export interface StartSpanOptions extends SpanOptions {
  parent?: TraceContext;
}

function hex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

export function createTraceId(): string {
  return hex(16);
}

export function createSpanId(): string {
  return hex(8);
}

export function defaultLogger(entry: StructuredLogEntry): void {
  const payload: StructuredLogEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString()
  };
  console.log(JSON.stringify(payload));
}

export function startSpan(name: string, options: StartSpanOptions = {}): SpanContext {
  const traceId = options.parent?.traceId ?? createTraceId();
  const spanId = createSpanId();
  return {
    traceId,
    spanId,
    parentSpanId: options.parent?.spanId,
    name,
    startedAt: new Date().toISOString()
  };
}

export async function withSpan<T>(
  name: string,
  run: (span: SpanContext) => Promise<T>,
  options: StartSpanOptions & { logger?: StructuredLogger } = {}
): Promise<T> {
  const span = startSpan(name, options);
  const logger = options.logger;
  const baseEntry = {
    traceId: span.traceId,
    spanId: span.spanId,
    runId: options.runId,
    correlationId: options.correlationId,
    component: options.component
  };

  logger?.log({
    timestamp: new Date().toISOString(),
    level: "info",
    message: "span_started",
    ...baseEntry,
    metadata: { spanName: name, ...(options.metadata ?? {}) }
  });

  const startedAt = Date.now();
  try {
    const result = await run(span);
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "span_completed",
      ...baseEntry,
      metadata: { spanName: name, durationMs: Date.now() - startedAt }
    });
    return result;
  } catch (error) {
    logger?.log({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "span_failed",
      ...baseEntry,
      metadata: {
        spanName: name,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown_error"
      }
    });
    throw error;
  }
}

