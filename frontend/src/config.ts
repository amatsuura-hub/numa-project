function requireEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  apiUrl: requireEnv("VITE_API_URL"),
  cognitoUserPoolId: requireEnv("VITE_COGNITO_USER_POOL_ID"),
  cognitoClientId: requireEnv("VITE_COGNITO_CLIENT_ID"),
  cloudfrontUrl: (import.meta.env.VITE_CLOUDFRONT_URL as string) || "",
} as const;
