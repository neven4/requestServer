interface Request {
  url: string;
  method: "POST" | "GET" | "DELETE" | "PUT" | "PATCH";
  body?: Record<string, unknown> | null | void;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: string;
}

interface CustomResponse {
  ok: boolean;
  body: any;
  status: number;
  headers: Record<string, string>;
}

export async function requestServer({
  url,
  method,
  ...options
}: Request): Promise<CustomResponse> {
  const headers = new window.Headers({
    ...options.headers,
    cookie: combineCookies(options.headers?.cookie, options.cookies),
  });
  contentSetDefault(headers, "application/json; charset=utf-8");

  const body =
    contentIs(headers, "application/json") && options.body
      ? JSON.stringify(options.body)
      : undefined;

  try {
    const response = await window.fetch(url, {
      method,
      headers,
      body,
    });

    const answer = contentIs(response.headers, "application/json")
      ? await response.json()
      : await response.text();

    const parsedResponse: CustomResponse = {
      ok: response.ok,
      body: answer,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };

    if (response.ok) {
      return parsedResponse;
    }

    throw parsedResponse;
  } catch (error) {
    if (error instanceof Error) {
      const errorResponse: CustomResponse = {
        ok: false,
        body: error,
        status: 900,
        headers: {},
      };

      return errorResponse;
    }

    return error;
  }
}

function combineCookies(...cookies: Array<string | undefined>): string {
  return cookies.filter(Boolean).join("; ");
}

/**
 * Check if content-type JSON
 */
function contentIs(headers: Headers, type: string): boolean {
  return headers.get("content-type")?.includes(type) ?? false;
}

function contentSetDefault(headers: Headers, type: string): Headers {
  if (!headers.has("content-type")) {
    headers.set("content-type", type);
  }
  return headers;
}
