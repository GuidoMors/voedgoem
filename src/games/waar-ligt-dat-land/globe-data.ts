import { geoArea } from "d3-geo";
import type { Feature, MultiPolygon, Position } from "geojson";
import { COUNTRY_PATHS, COUNTRY_POINTS } from "./map-data";

type CountryProperties = { id: string; name: string };
export type CountryFeature = Feature<MultiPolygon, CountryProperties>;

function contains(point: Position, ring: Position[]): boolean {
  const longitude = point[0];
  const latitude = point[1];
  if (longitude === undefined || latitude === undefined) return false;
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    if (!currentPoint || !previousPoint) continue;
    const [currentLongitude, currentLatitude] = currentPoint;
    const [previousLongitude, previousLatitude] = previousPoint;
    if (currentLongitude === undefined || currentLatitude === undefined || previousLongitude === undefined || previousLatitude === undefined) continue;
    const crosses = (currentLatitude > latitude) !== (previousLatitude > latitude);
    if (crosses && longitude < (previousLongitude - currentLongitude) * (latitude - currentLatitude) / (previousLatitude - currentLatitude) + currentLongitude) {
      inside = !inside;
    }
  }
  return inside;
}

function countryFeature(country: typeof COUNTRY_PATHS[number]): CountryFeature {
  const outerRings: Position[][] = [];
  const holeRings: Position[][] = [];

  for (const segment of country.path.split("M").filter(Boolean)) {
    const ring: Position[] = [];
    for (const pair of segment.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
      ring.push([Number(pair[1]) - 180, 90 - Number(pair[2])]);
    }
    if (ring.length < 4) continue;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      ring.push([first[0], first[1]]);
    }
    if (geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI) {
      holeRings.push(ring);
    } else {
      outerRings.push(ring);
    }
  }

  const polygons = outerRings.map(ring => [ring]);
  for (const hole of holeRings) {
    const point = hole[0];
    const polygon = point && polygons.find(([outer]) => outer && contains(point, outer));
    if (!polygon) throw new Error(`Could not place an interior map boundary for ${country.name}.`);
    polygon.push(hole);
  }

  return {
    type: "Feature",
    id: country.id,
    properties: { id: country.id, name: country.name },
    geometry: { type: "MultiPolygon", coordinates: polygons }
  };
}

export const COUNTRY_FEATURES = COUNTRY_PATHS.map(countryFeature);

export const SMALL_COUNTRIES = COUNTRY_POINTS.map(country => ({
  id: country.id,
  coordinates: [country.x - 180, 90 - country.y]
}));

const SMALL_COUNTRY_NAMES_EN: Record<string, string> = {
  AND: "Andorra",
  LIE: "Liechtenstein",
  MLT: "Malta",
  MCO: "Monaco",
  SMR: "San Marino",
  VAT: "Vatican City",
  BHR: "Bahrain",
  MDV: "Maldives",
  SGP: "Singapore",
  COM: "Comoros",
  CPV: "Cabo Verde",
  MUS: "Mauritius",
  STP: "Sao Tome and Principe",
  SYC: "Seychelles",
  ATG: "Antigua and Barbuda",
  BRB: "Barbados",
  DMA: "Dominica",
  GRD: "Grenada",
  KNA: "Saint Kitts and Nevis",
  LCA: "Saint Lucia",
  VCT: "Saint Vincent and the Grenadines",
  WSM: "Samoa",
  KIR: "Kiribati",
  MHL: "Marshall Islands",
  FSM: "Micronesia",
  NRU: "Nauru",
  PLW: "Palau",
  TON: "Tonga",
  TUV: "Tuvalu"
};

export const COUNTRY_NAMES_EN = new Map([
  ...COUNTRY_FEATURES.map(country => [country.properties.id, country.properties.name] as const),
  ...Object.entries(SMALL_COUNTRY_NAMES_EN)
]);
