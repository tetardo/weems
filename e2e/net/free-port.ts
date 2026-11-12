import { createServer } from "node:net";
import type { AddressInfo } from "node:net";

/**
 * A port free right now on 127.0.0.1, chosen by the system.
 *
 * Never a port drawn at random in a fixed range: fetch (Node and Chrome) refuses some ports
 * ("bad port": 4045, 5060, 5061, 6000…), and two test files could draw the same one. The system
 * hands out ports from its ephemeral range (32768 and up on Linux, 49152 and up on macOS and
 * Windows), where no port is refused.
 */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
}
