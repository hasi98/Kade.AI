const MCP_ENDPOINT = "https://mcp.kapruka.com/mcp";

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string };
};

let requestId = 1;

function parseEventStream<T>(text: string): JsonRpcResponse<T> {
  const dataLine = text
    .split(/\r?\n/)
    .find((line) => line.startsWith("data: "));

  if (!dataLine) {
    throw new Error(`MCP returned no data event: ${text.slice(0, 200)}`);
  }

  return JSON.parse(dataLine.slice(6)) as JsonRpcResponse<T>;
}

async function postMcp<T>(body: Record<string, unknown>, sessionId?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream"
  };

  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }

  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const nextSessionId = res.headers.get("mcp-session-id") ?? sessionId;
  const text = await res.text();

  if (!res.ok && res.status !== 202) {
    throw new Error(`MCP ${res.status}: ${text}`);
  }

  if (res.status === 202 || !text.trim()) {
    return { sessionId: nextSessionId, response: null };
  }

  const response = parseEventStream<T>(text);
  if (response.error) {
    throw new Error(response.error.message);
  }

  return { sessionId: nextSessionId, response };
}

async function createSession() {
  const init = await postMcp({
    jsonrpc: "2.0",
    id: requestId++,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "kade-ai", version: "0.1.0" }
    }
  });

  if (!init.sessionId) {
    throw new Error("MCP did not provide a session id");
  }

  await postMcp(
    {
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {}
    },
    init.sessionId
  );

  return init.sessionId;
}

export async function callKaprukaTool<T>(name: string, params: Record<string, unknown>) {
  const sessionId = await createSession();
  const result = await postMcp<{ content?: Array<{ type: string; text: string }>; structuredContent?: T }>(
    {
      jsonrpc: "2.0",
      id: requestId++,
      method: "tools/call",
      params: {
        name,
        arguments: { params }
      }
    },
    sessionId
  );

  const payload = result.response?.result;
  if (!payload) {
    throw new Error("Empty MCP tool response");
  }

  const text = payload.content?.find((item) => item.type === "text")?.text;
  if (payload.structuredContent) {
    const structured = payload.structuredContent as { result?: unknown };
    if (typeof structured.result === "string") {
      try {
        return JSON.parse(structured.result) as T;
      } catch {
        return { result: structured.result } as T;
      }
    }

    return payload.structuredContent;
  }

  if (!text) {
    throw new Error("MCP tool returned no text content");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { result: text } as T;
  }
}
