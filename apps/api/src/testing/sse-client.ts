/** One server-sent event, with the time it reached the client. */
export interface ReceivedEvent {
  event: string;
  data: unknown;
  receivedAtMs: number;
}

function parseBlock(block: string): { event: string; data: unknown } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7);
    else if (line.startsWith("data: ")) data.push(line.slice(6));
  }
  return data.length > 0 ? { event, data: JSON.parse(data.join("\n")) as unknown } : null;
}

/**
 * Streaming SSE client: calls `onEvent` for each event as it arrives, keeps nothing.
 * For long runs with many clients (load test, spec J4).
 */
export function streamSse(url: string, onEvent: (event: ReceivedEvent) => void) {
  const controller = new AbortController();
  const done = (async () => {
    const response = await fetch(url, { signal: controller.signal });
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const parsed = parseBlock(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (parsed) onEvent({ ...parsed, receivedAtMs: Date.now() });
      }
    }
  })().catch(() => {});
  return {
    /** Resolves when the connection has ended (closed by either side). */
    done,
    close: async () => {
      controller.abort();
      await done;
    },
  };
}

/** Minimal SSE client for tests: records every event until `close()`. */
export function openSse(url: string) {
  const events: ReceivedEvent[] = [];
  const { close } = streamSse(url, (event) => events.push(event));
  return { events, close };
}
