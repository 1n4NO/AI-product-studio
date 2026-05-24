const APP_ENVS = ["development", "staging", "production"] as const;

type AppEnv = (typeof APP_ENVS)[number];

interface PublicEnv {
  NEXT_PUBLIC_APP_ENV: AppEnv;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_API_BASE_URL: string;
}

interface ServerEnv extends PublicEnv {
  INTERNAL_API_KEY?: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
}

function isAppEnv(value: string): value is AppEnv {
  return APP_ENVS.includes(value as AppEnv);
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return undefined;
  }
  return value;
}

export function getPublicEnv(): PublicEnv {
  const env = required("NEXT_PUBLIC_APP_ENV");
  if (!isAppEnv(env)) {
    throw new Error("NEXT_PUBLIC_APP_ENV must be one of: development, staging, production");
  }

  return {
    NEXT_PUBLIC_APP_ENV: env,
    NEXT_PUBLIC_APP_URL: required("NEXT_PUBLIC_APP_URL"),
    NEXT_PUBLIC_API_BASE_URL: required("NEXT_PUBLIC_API_BASE_URL")
  };
}

export function getServerEnv(): ServerEnv {
  return {
    ...getPublicEnv(),
    INTERNAL_API_KEY: optional("INTERNAL_API_KEY"),
    OTEL_EXPORTER_OTLP_ENDPOINT: optional("OTEL_EXPORTER_OTLP_ENDPOINT")
  };
}
