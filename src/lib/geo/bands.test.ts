import { describe, it, expect } from "vitest";
import { slimBandFeature, type RawBandFeature } from "./bands";

const raw: RawBandFeature = {
  type: "Feature",
  properties: { Color: "Verde", Bateria_Linea: "Línea", Res_NumPlazas: 5 },
  geometry: {
    type: "LineString",
    coordinates: [
      [-3.7038123456, 40.4167987654],
      [-3.7039, 40.4168],
    ],
  },
};

describe("slimBandFeature", () => {
  it("classifies the colour into a zone type and keeps the plaza count", () => {
    const f = slimBandFeature(raw);
    expect(f.properties.z).toBe("verde");
    expect(f.properties.n).toBe(5);
  });

  it("rounds coordinates to 6 decimal places to shrink the payload", () => {
    const f = slimBandFeature(raw);
    expect(f.geometry.coordinates[0]).toEqual([-3.703812, 40.416799]);
  });

  it("maps the grey band to the free zone type", () => {
    const f = slimBandFeature({ ...raw, properties: { Color: "Gris" } });
    expect(f.properties.z).toBe("libre");
  });
});
