/**
 * Errors the API answers on purpose, rendered as RFC 9457 "problem details"
 * by the errors plugin. Services throw them; they know nothing about HTTP otherwise.
 */
export class ApiProblem extends Error {
  readonly status: number;
  readonly title: string;
  readonly type: string;

  constructor(status: number, title: string, detail: string) {
    super(detail);
    this.status = status;
    this.title = title;
    this.type = `https://weems.app/problems/${title.toLowerCase().replaceAll(" ", "-")}`;
  }
}

export const notFound = (detail: string) => new ApiProblem(404, "Not Found", detail);
export const conflict = (detail: string) => new ApiProblem(409, "Conflict", detail);
export const unprocessable = (detail: string) =>
  new ApiProblem(422, "Unprocessable Content", detail);
export const forbidden = (detail: string) => new ApiProblem(403, "Forbidden", detail);
