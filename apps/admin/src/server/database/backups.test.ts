import { describe, expect, it } from "vitest";
import { backupName, backupsToDelete, restoreCommand } from "./backups.ts";

describe("backups of the page Base de données", () => {
  it("names a backup by its local date and time, so that names sort by date", () => {
    expect(backupName(new Date(2026, 10, 12, 7, 42, 5))).toBe("weems-2026-11-12-074205.dump");
  });

  it("keeps the 7 newest and never touches another file", () => {
    const names = Array.from({ length: 9 }, (_, i) => `weems-2026-11-0${i + 1}-120000.dump`);
    const deleted = backupsToDelete([...names, "notes.txt", "weems-2026-11-09-1200.dump.part"]);
    expect(deleted).toEqual(["weems-2026-11-02-120000.dump", "weems-2026-11-01-120000.dump"]);
    expect(backupsToDelete(names.slice(0, 3))).toEqual([]);
  });

  it("writes the restore command from the root of the repository", () => {
    expect(restoreCommand("weems-2026-11-12-074205.dump")).toBe(
      "docker compose -f apps/api/docker-compose.yml exec -T db pg_restore -U weems -d weems --clean --if-exists < apps/admin/.data/backups/weems-2026-11-12-074205.dump",
    );
  });
});
