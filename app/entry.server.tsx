import { renderToReadableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { EntryContext } from "react-router";

// Abort delay for streaming - bots get full page, users get streaming
const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  let didError = false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ABORT_DELAY);

  let stream: Awaited<ReturnType<typeof renderToReadableStream>>;
  try {
    stream = await renderToReadableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        signal: controller.signal,
        onError(error: unknown) {
          didError = true;
          if (error instanceof Error) {
            console.error("Streaming render error:", error.message);
            console.error(error.stack);
          } else {
            console.error("Streaming render error:", error);
          }
        },
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Bots need the full page before responding; users get streamed content
  const userAgent = request.headers.get("user-agent");
  if (isbot(userAgent)) {
    try {
      await stream.allReady;
    } catch (error) {
      // Render was aborted (e.g. timeout); respond with whatever was generated
      console.error("Bot render aborted:", error);
    }
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(stream, {
    headers: responseHeaders,
    status: didError ? 500 : responseStatusCode,
  });
}
