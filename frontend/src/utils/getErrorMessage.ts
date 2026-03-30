/**
 * Extract a human-readable error message from an unknown catch value.
 * Handles API error responses, Error instances, and unknown types.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    const resp = e.response as Record<string, unknown> | undefined;
    const data = resp?.data as Record<string, unknown> | undefined;
    const apiErr = data?.error as Record<string, unknown> | undefined;
    if (typeof apiErr?.message === "string") return apiErr.message;
    if (typeof (data as Record<string, unknown>)?.message === "string")
      return (data as Record<string, unknown>).message as string;
    if (typeof e.message === "string") return e.message;
  }
  return "予期しないエラーが発生しました";
}
