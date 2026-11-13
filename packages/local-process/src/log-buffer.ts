/** The last lines written by a process, kept in memory (200 by default, as the page shows). */
export class LogBuffer {
  private readonly lines: string[] = [];
  private partial = "";
  private readonly size: number;

  constructor(size = 200) {
    this.size = size;
  }

  /** Accepts chunks cut anywhere: a line is kept once its end arrives. */
  write(chunk: string): string[] {
    const parts = (this.partial + chunk).split(/\r?\n/);
    this.partial = parts.pop() ?? "";
    const complete = parts.filter((line) => line.length > 0);
    for (const line of complete) this.push(line);
    return complete;
  }

  push(line: string): void {
    this.lines.push(line);
    if (this.lines.length > this.size) this.lines.splice(0, this.lines.length - this.size);
  }

  all(): string[] {
    return this.partial ? [...this.lines, this.partial] : [...this.lines];
  }
}
