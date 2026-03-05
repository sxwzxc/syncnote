import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import type { EntryContext } from "react-router";

// Abort delay for streaming - bots get full page, users get streaming
const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");
    
    // Detect if the request is from a bot
    const readyOption = isbot(userAgent)
      ? "onAllReady"  // Bots: wait for everything
      : "onShellReady"; // Users: stream as soon as shell is ready

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true;
          
          // Set headers for streaming
          responseHeaders.set("Content-Type", "text/html");
          
          // Create a PassThrough stream (Node.js stream)
          const nodeStream = new PassThrough();
          
          // Create a Web ReadableStream from the Node.js stream
          const body = new ReadableStream({
            start(controller) {
              nodeStream.on("data", (chunk: Buffer) => {
                controller.enqueue(new Uint8Array(chunk));
              });
              
              nodeStream.on("end", () => {
                controller.close();
              });
              
              nodeStream.on("error", (error) => {
                controller.error(error);
              });
            },
            cancel() {
              nodeStream.destroy();
            },
          });
          
          // Pipe React's stream to the Node.js PassThrough stream
          pipe(nodeStream);

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          
          // Log the error
          if (error instanceof Error) {
            console.error("Streaming render error:", error.message);
            console.error(error.stack);
          } else {
            console.error("Streaming render error:", error);
          }
          
          // If the shell hasn't rendered yet, we can still recover
          if (!shellRendered) {
            reject(error);
          }
        },
      }
    );

    // Abort the stream after a timeout
    setTimeout(abort, ABORT_DELAY);
  });
}
