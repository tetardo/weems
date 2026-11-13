import { describe, expect, it } from "vitest";
import { linkUrl, repoPaths } from "./repo.ts";

describe("repo", () => {
  it("opens the site and the pages of the console", () => {
    expect(linkUrl("site")).toBe("http://localhost:3001/fr");
    expect(linkUrl("console")).toBe("http://127.0.0.1:3002/services");
  });

  it("finds the scripts of the Mac in the repository", () => {
    expect(repoPaths("/repo").script("prepare")).toBe("/repo/scripts/mac/prepare.sh");
  });
});
