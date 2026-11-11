import assert from "node:assert/strict";
import test from "node:test";
import { geoOrthographic, geoPath } from "d3-geo";
import { COUNTRY_FEATURES, COUNTRY_NAMES_EN, SMALL_COUNTRIES } from "./globe-data";

test("globe geometry preserves valid, closed country boundaries", () => {
  assert.equal(COUNTRY_FEATURES.length, 166);
  assert.equal(new Set(COUNTRY_FEATURES.map(country => country.id)).size, COUNTRY_FEATURES.length);
  for (const country of COUNTRY_FEATURES) {
    assert.ok(country.geometry.coordinates.length > 0, `${country.properties.name} has no polygons`);
    for (const polygon of country.geometry.coordinates) {
      for (const ring of polygon) {
        assert.ok(ring.length >= 4, `${country.properties.name} has an incomplete boundary`);
        assert.deepEqual(ring[0], ring[ring.length - 1], `${country.properties.name} has an open boundary`);
        for (const [longitude, latitude] of ring) {
          assert.ok(longitude >= -180 && longitude <= 180, `${country.properties.name} longitude is out of range`);
          assert.ok(latitude >= -90 && latitude <= 90, `${country.properties.name} latitude is out of range`);
        }
      }
    }
  }
});

test("orthographic globe renders visible lands and clips the far hemisphere", () => {
  const projection = geoOrthographic().translate([320, 220]).scale(190).clipAngle(90);
  const path = geoPath(projection);
  const france = COUNTRY_FEATURES.find(country => country.id === "FRA");
  const australia = COUNTRY_FEATURES.find(country => country.id === "AUS");
  const southAfrica = COUNTRY_FEATURES.find(country => country.id === "ZAF");
  assert.ok(france);
  assert.ok(australia);
  assert.ok(southAfrica);
  assert.ok(path(france));
  assert.equal(path(australia), null);
  assert.equal(southAfrica.geometry.coordinates[0]?.length, 2);
});

test("microstate markers have coordinates suitable for globe projection", () => {
  assert.equal(SMALL_COUNTRIES.length, 29);
  assert.ok(SMALL_COUNTRIES.every(country =>
    country.coordinates.length === 2
    && country.coordinates[0] >= -180 && country.coordinates[0] <= 180
    && country.coordinates[1] >= -90 && country.coordinates[1] <= 90
  ));
});

test("English map labels cover every polygon country and microstate", () => {
  for (const country of COUNTRY_FEATURES) {
    assert.ok(COUNTRY_NAMES_EN.get(country.properties.id), `${country.properties.id} has no English name`);
  }
  for (const country of SMALL_COUNTRIES) {
    assert.ok(COUNTRY_NAMES_EN.get(country.id), `${country.id} has no English name`);
  }
});
