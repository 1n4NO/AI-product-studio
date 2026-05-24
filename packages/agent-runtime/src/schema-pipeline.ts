import { type StructuredLogger, type TraceContext, withSpan } from "./observability";

export type SchemaValidator<T> = (value: unknown) => value is T;

export interface ValidationFailure {
  attempt: number;
  reason: string;
  payloadPreview: string;
}

export interface SchemaRetryPolicy {
  maxAttempts: number;
}

export interface ExecuteWithSchemaOptions<T> {
  taskName: string;
  run: (attempt: number) => Promise<unknown>;
  validate: SchemaValidator<T>;
  retryPolicy?: SchemaRetryPolicy;
  runId?: string;
  correlationId?: string;
  trace?: TraceContext;
  logger?: StructuredLogger;
}

export interface ExecuteWithSchemaSuccess<T> {
  ok: true;
  taskName: string;
  attempts: number;
  value: T;
}

export interface ExecuteWithSchemaError {
  ok: false;
  taskName: string;
  attempts: number;
  failures: ValidationFailure[];
  message: string;
}

export type ExecuteWithSchemaResult<T> = ExecuteWithSchemaSuccess<T> | ExecuteWithSchemaError;

const DEFAULT_RETRY_POLICY: SchemaRetryPolicy = {
  maxAttempts: 3
};

export async function executeWithSchema<T>(options: ExecuteWithSchemaOptions<T>): Promise<ExecuteWithSchemaResult<T>> {
  const retryPolicy = options.retryPolicy ?? DEFAULT_RETRY_POLICY;

  if (retryPolicy.maxAttempts < 1) {
    throw new Error("retryPolicy.maxAttempts must be >= 1");
  }

  return withSpan(
    `schema_task:${options.taskName}`,
    async () => {
      const failures: ValidationFailure[] = [];

      for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
        options.logger?.log({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "schema_attempt_started",
          traceId: options.trace?.traceId ?? "no-trace",
          spanId: options.trace?.spanId,
          runId: options.runId,
          correlationId: options.correlationId,
          component: "schema-pipeline",
          metadata: { taskName: options.taskName, attempt }
        });

        try {
          const payload = await options.run(attempt);
          if (options.validate(payload)) {
            options.logger?.log({
              timestamp: new Date().toISOString(),
              level: "info",
              message: "schema_validation_passed",
              traceId: options.trace?.traceId ?? "no-trace",
              spanId: options.trace?.spanId,
              runId: options.runId,
              correlationId: options.correlationId,
              component: "schema-pipeline",
              metadata: { taskName: options.taskName, attempt }
            });

            return {
              ok: true,
              taskName: options.taskName,
              attempts: attempt,
              value: payload
            };
          }

          failures.push({
            attempt,
            reason: "schema_validation_failed",
            payloadPreview: toPreview(payload)
          });
        } catch (error) {
          failures.push({
            attempt,
            reason: error instanceof Error ? error.message : "unknown_error",
            payloadPreview: "<execution_failed>"
          });
        }
      }

      options.logger?.log({
        timestamp: new Date().toISOString(),
        level: "error",
        message: "schema_task_failed",
        traceId: options.trace?.traceId ?? "no-trace",
        spanId: options.trace?.spanId,
        runId: options.runId,
        correlationId: options.correlationId,
        component: "schema-pipeline",
        metadata: { taskName: options.taskName, maxAttempts: retryPolicy.maxAttempts }
      });

      return {
        ok: false,
        taskName: options.taskName,
        attempts: retryPolicy.maxAttempts,
        failures,
        message: `Task '${options.taskName}' failed schema validation after ${retryPolicy.maxAttempts} attempts`
      };
    },
    {
      parent: options.trace,
      runId: options.runId,
      correlationId: options.correlationId,
      component: "schema-pipeline",
      logger: options.logger
    }
  );
}

function toPreview(value: unknown): string {
  try {
    const raw = JSON.stringify(value);
    if (!raw) return "<empty>";
    return raw.length > 500 ? `${raw.slice(0, 500)}...` : raw;
  } catch {
    return "<unserializable>";
  }
}
