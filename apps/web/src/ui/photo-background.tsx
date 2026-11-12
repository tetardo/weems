/** A photo behind a banner: the image and what its crop keeps. */
export interface BannerPhoto {
  src: string;
  /** CSS background-position. */
  position: string;
}

/** One photo for each theme. */
export interface ThemePhotos {
  light: BannerPhoto;
  dark: BannerPhoto;
}

const style = ({ src, position }: BannerPhoto) => ({
  backgroundImage: `url(${src})`,
  backgroundPosition: position,
});

/**
 * Background of a photo banner (home, Découvrir): sky while the photo loads, the photo of each
 * theme (CSS shows the current one: no mismatch with the server) and the veil that keeps the text
 * readable.
 */
export function PhotoBackground({
  photos,
  phoneVeil = true,
}: {
  photos: ThemePhotos;
  /** false: no veil on a phone, where the text sits in its own glass panel. */
  phoneVeil?: boolean;
}) {
  const photo = "absolute inset-0 bg-cover";
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="hero-sky absolute inset-0" />
      <div className={`${photo} light:hidden`} style={style(photos.dark)} />
      <div className={`${photo} hidden light:block`} style={style(photos.light)} />
      <div className={`hero-veil absolute inset-0 ${phoneVeil ? "" : "max-md:hidden"}`} />
    </div>
  );
}
