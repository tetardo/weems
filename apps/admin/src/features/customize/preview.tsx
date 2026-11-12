import type { HomeFocus, HomeTheme } from "@weems/contrats";

/** Same crops as the site's home page (apps/web, home-image.ts). */
const POSITION: Record<HomeFocus, string> = {
  left: "28% center",
  center: "center",
  right: "72% center",
};

/**
 * Small home page of one theme (validated mock-up): the image under the veil, the bar, the slogan
 * and the board, the focus point, and the phone crop in the corner.
 */
export function Preview({
  theme,
  src,
  focus,
}: {
  theme: HomeTheme;
  src: string;
  focus: HomeFocus;
}) {
  const image = { backgroundImage: `url(${src})`, backgroundPosition: POSITION[focus] };
  return (
    <div className={`hprev ${theme}`} style={image} aria-hidden="true">
      <div className="veil" />
      <div className="bar" />
      <div className="slogan">
        Décollez.
        <br />
        Weems s&apos;occupe
        <br />
        du carnet.
      </div>
      <div className="board" />
      <div className="focal" style={{ left: POSITION[focus].split(" ")[0] }} />
      <div className="phone" style={image} />
    </div>
  );
}
