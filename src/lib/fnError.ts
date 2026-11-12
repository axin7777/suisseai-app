export async function fnErrorMessage(error: any, data: any, fallback: string): Promise<string> {
  if (data?.error) return String(data.error);
  try {
    const body = await error?.context?.json?.();
    if (body?.error) return String(body.error);
  } catch {}
  return fallback;
}
