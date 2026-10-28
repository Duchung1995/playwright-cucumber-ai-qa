import 'dotenv/config';

type BrowserName = 'chromium' | 'firefox' | 'webkit';
type TraceMode = 'on-failure' | 'always' | 'off';

function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env.`);
  }
  return value;
}

export const env = {
  baseUrl: read('BASE_URL', 'https://practicesoftwaretesting.com'),
  apiUrl: read('API_URL', 'https://api.practicesoftwaretesting.com'),
  browser: read('BROWSER', 'chromium') as BrowserName,
  headless: read('HEADLESS', 'true') !== 'false',
  trace: read('TRACE', 'on-failure') as TraceMode,
  defaultTimeoutMs: Number(read('DEFAULT_TIMEOUT_MS', '30000')),
  users: {
    customer: {
      email: read('CUSTOMER_EMAIL', 'customer@practicesoftwaretesting.com'),
      password: read('CUSTOMER_PASSWORD', 'welcome01'),
    },
    admin: {
      email: read('ADMIN_EMAIL', 'admin@practicesoftwaretesting.com'),
      password: read('ADMIN_PASSWORD', 'welcome01'),
    },
  },
} as const;

export type UserRole = keyof typeof env.users;

export function credentialsFor(role: string): { email: string; password: string } {
  if (!(role in env.users)) {
    throw new Error(`Unknown user role "${role}". Expected one of: ${Object.keys(env.users).join(', ')}`);
  }
  return env.users[role as UserRole];
}
