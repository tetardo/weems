import { type NextRequest, NextResponse } from "next/server";
import { isAllowedHost } from "./server/allowed-hosts.ts";

/** Every request: refused unless addressed to the console's own address (server actions too). */
export default function proxy(request: NextRequest) {
  if (!isAllowedHost(request.headers.get("host")))
    return new NextResponse("Forbidden", { status: 403 });
  return NextResponse.next();
}
