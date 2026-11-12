import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

/** Paint properties to set on the layers of a basemap, by layer id. */
export type BasemapPaint = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * Copy of `style` with `paint` set on its layers. Ids missing from the style are skipped, so a
 * layer renamed upstream only loses its override, it never breaks the map.
 */
export function withBasemapPaint(
  style: StyleSpecification,
  paint: BasemapPaint,
): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      const override = paint[layer.id];
      if (override === undefined) return layer;
      return { ...layer, paint: { ...layer.paint, ...override } } as LayerSpecification;
    }),
  };
}
