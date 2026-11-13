import { WarningIcon } from "./icons.ts";

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="errbox" role="alert">
      <WarningIcon size={16} />
      <div>{message}</div>
    </div>
  );
}
