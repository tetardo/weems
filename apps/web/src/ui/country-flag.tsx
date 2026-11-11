import "flag-icons/css/flag-icons.min.css";

/**
 * Flag of a country as an image (flag-icons, MIT): Windows does not draw flag emoji.
 * `code` comes from the API, already checked as two capital letters.
 */
export function CountryFlag({ code, name }: { code: string; name: string }) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={`fi fi-${code.toLowerCase()} rounded-[3px] shadow-[0_0_0_1px_var(--color-line)]`}
    />
  );
}
