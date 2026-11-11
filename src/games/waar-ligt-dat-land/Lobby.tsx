import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Person } from "../../avatar/Avatar";
import { HostControlsTab } from "../../components/HostControlsTab";
import { KickButton } from "../../components/KickButton";
import type { GameLobbyProps } from "../types";
import { COUNTRY_FEATURES, COUNTRY_NAMES_EN, SMALL_COUNTRIES } from "./globe-data";
import type { WaarLandSnapshot } from "./types";

interface GlobeView {
  longitude: number;
  latitude: number;
  zoom: number;
}

const MAP_WIDTH = 640;
const MAP_HEIGHT = 440;
const GLOBE_RADIUS = 190;
const MIN_ZOOM = 1;
const MAX_ZOOM = 100;

type Language = "nl" | "en";

const TEXT = {
  nl: {
    players: "Spelers", you: "Jij", spectators: "Toeschouwers", backToSpectating: "Terug naar toeschouwers",
    joinGame: "Meedoen", howToPlay: "Speluitleg", drawAndGuess: "Trek een land en vind het in maximaal drie pogingen.",
    closerPoints: "Dichterbij is meer punten: 3, 2 of 1.", triviaPoint: "Vind het land en beantwoord een extra vraag voor een punt.",
    gameEnd: "Na het gekozen aantal beurten per speler wint de speler met de hoogste score.",
    waitingForHost: "Wachten tot {name} het spel start.", roundsPerPlayer: "Rondes per speler",
    startGame: "Start spel", needPlayer: "Er moet minstens één speler meedoen om te starten.",
    quitGame: "Spel beëindigen",
    whereCountry: "Waar ligt dit land?", drawCountry: "Trek een land", yourTurn: "Jij bent aan de beurt", drawButton: "trek",
    selectCountry: "Kies het land op de wereldbol.", searchingCountry: "zoekt dit land.",
    searchCountry: "Zoek een land…", guess: "Raden", searchLabel: "Zoek een land om te raden",
    globeLabel: "Interactieve wereldbol. Sleep om te draaien; gebruik twee vingers om in en uit te zoomen en te richten; gebruik plus en min voor toegankelijk zoomen. Zoek een land om te raden.",
    zoomControls: "Bediening wereldbol", zoomIn: "Inzoomen", zoomOut: "Uitzoomen",
    resetGlobe: "Wereldbol herstellen", rotateHint: "Sleep om de bol te draaien · Knijp of spreid twee vingers om te zoomen op die plek · Scroll of gebruik +/−",
    far: "Ver", close: "Dichtbij", guessInstructions: "Klik op een land op de wereldbol of zoek het hierboven.",
    globeSearch: "Zoeken naar landen", true: "Waar", false: "Niet waar", revealAnswer: "Toon antwoord voor de volgende speler",
    sayAnswer: "Zeg eerst je antwoord hardop; daarna kan de volgende speler het beoordelen.",
    answerForReview: "De speler aan de beurt heeft geantwoord. De volgende speler beoordeelt het antwoord.",
    selectedTrue: "De speler koos: waar.", selectedFalse: "De speler koos: niet waar.",
    approveAnswer: "Goedkeuren", rejectAnswer: "Afkeuren", waitingForReviewer: "Wachten op de beoordeling van {name}.",
    noReviewer: "Er is geen andere speler; jij beoordeelt je eigen antwoord.",
    legacyAnswerPrompt: "Deze oude waar/niet waar-vraag is al beantwoord en wordt automatisch nagekeken.",
    resolveLegacyAnswer: "Toon de uitslag",
    missingLegacyResponse: "De opgeslagen keuze ontbreekt. Start een nieuw spel om verder te spelen.",
    readyNextTurn: "Klaar voor de volgende beurt?", waitingForActive: "Wachten tot de speler aan de beurt verdergaat.",
    nextTurn: "Volgende beurt", gameOver: "Spel afgelopen", points: "punten", returnToLobby: "Terug naar de lobby",
    yourScore: "Jouw score", countriesFound: "Gevonden landen", language: "Taal", explanation: "Uitleg",
  },
  en: {
    players: "Players", you: "You", spectators: "Spectators", backToSpectating: "Back to spectating",
    joinGame: "Join game", howToPlay: "How to play", drawAndGuess: "Draw a country and find it in up to three guesses.",
    closerPoints: "Closer guesses earn more points: 3, 2, or 1.", triviaPoint: "Find the country to answer an extra question for a point.",
    gameEnd: "After each player has taken the chosen number of turns, the highest score wins.",
    waitingForHost: "Waiting for {name} to start.", roundsPerPlayer: "Rounds per player",
    startGame: "Start game", needPlayer: "At least one player must join before starting.",
    quitGame: "Quit game",
    whereCountry: "Where is this country?", drawCountry: "Draw a country", yourTurn: "Your turn", drawButton: "draw",
    selectCountry: "Select the country on the globe.", searchingCountry: "is looking for this country.",
    searchCountry: "Search countries…", guess: "Guess", searchLabel: "Search for a country to guess",
    globeLabel: "Interactive globe. Drag to rotate; use two fingers to zoom in or out around that spot; use plus and minus for accessible zoom. Search for a country to guess.",
    zoomControls: "Globe controls", zoomIn: "Zoom in", zoomOut: "Zoom out",
    resetGlobe: "Reset globe view", rotateHint: "Drag to rotate · Pinch with two fingers to zoom around that spot · Scroll or use +/−",
    far: "Far", close: "Close", guessInstructions: "Click a country on the globe or search its name above.",
    globeSearch: "Search countries", true: "True", false: "False", revealAnswer: "Show answer for the next player",
    sayAnswer: "Say your answer out loud first; then the next player can review it.",
    answerForReview: "The active player has answered. The next player reviews the answer.",
    selectedTrue: "The active player selected: true.", selectedFalse: "The active player selected: false.",
    approveAnswer: "Approve", rejectAnswer: "Reject", waitingForReviewer: "Waiting for {name} to review the answer.",
    noReviewer: "There is no other player, so you review your own answer.",
    legacyAnswerPrompt: "This older true/false question has already been answered and will be checked automatically.",
    resolveLegacyAnswer: "Show result",
    missingLegacyResponse: "The saved choice is missing. Start a new game to continue.",
    readyNextTurn: "Ready for the next turn?", waitingForActive: "Waiting for the active player to continue.",
    nextTurn: "Next turn", gameOver: "Game over", points: "points", returnToLobby: "Return to lobby",
    yourScore: "Your score", countriesFound: "Countries found", language: "Language", explanation: "Explanation",
  }
} as const;

const CATEGORY_NAMES_EN: Record<string, string> = {
  "Taal & Schrift": "Language & Writing",
  "Muziek & Dans": "Music & Dance",
  "Eten & Drinken": "Food & Drink",
  "Cultuur & Tradities": "Culture & Traditions",
  "Natuur & Dieren": "Nature & Wildlife",
  "Geografie & Weetjes": "Geography & Facts"
};

function heatClass(distanceKm: number): string {
  if (distanceKm <= 250) return "heat-6";
  if (distanceKm <= 1000) return "heat-5";
  if (distanceKm <= 2500) return "heat-4";
  if (distanceKm <= 5000) return "heat-3";
  if (distanceKm <= 10000) return "heat-2";
  return "heat-1";
}

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function wrapLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

function countryName(id: string, dutchName: string, language: Language): string {
  return language === "en" ? COUNTRY_NAMES_EN.get(id) ?? dutchName : dutchName;
}

function localizedTurnMessage(snapshot: WaarLandSnapshot, language: Language): string {
  const message = snapshot.turnMessage;
  if (message.startsWith("Not quite.") && snapshot.trivia) {
    return language === "en" ? `Not quite, no points. The answer was:` : `Jammer, geen punten. Het antwoord was:`;
  }
  if (language === "en") return message;
  const score = message.match(/^Correct! \+(\d+) points?\.?$/);
  if (score?.[1]) return `Goed! +${score[1]} punt${score[1] === "1" ? "" : "en"}.`;
  if (message === "Approved! +1 point.") return "Goedgekeurd! +1 punt.";
  if (message === "The answer was not approved.") return "Het antwoord is afgekeurd.";
  if (message.startsWith("Out of guesses.")) {
    const target = snapshot.revealedCountryId
      ? countryName(snapshot.revealedCountryId, snapshot.targetName ?? "", language)
      : snapshot.targetName ?? "";
    return `Geen pogingen meer. Het land was ${target}.`;
  }
  const guess = snapshot.distanceFeedback.at(-1);
  if (guess && snapshot.step === "guess") {
    return `${countryName(guess.countryId, guess.countryName, language)} is ongeveer ${guess.distanceKm.toLocaleString()} km ver.`;
  }
  return message;
}

function WorldMap({ snapshot, canGuess, language, onGuess }: {
  snapshot: WaarLandSnapshot;
  canGuess: boolean;
  language: Language;
  onGuess: (countryId: string) => void;
}) {
  const [view, setView] = useState<GlobeView>({ longitude: 0, latitude: 0, zoom: 1 });
  const viewRef = useRef(view);
  const svgRef = useRef<SVGSVGElement>(null);
  const activePointers = useRef(new Map<number, { point: [number, number]; type: string }>());
  const pinch = useRef<{ distance: number; midpoint: [number, number] } | null>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
    countryId: string | null;
    anchor: [number, number] | null;
    velocityLongitude: number;
    velocityLatitude: number;
    lastMoveTime: number;
  } | null>(null);
  const inertiaFrame = useRef<number | null>(null);
  const wrong = new Set(snapshot.wrongGuesses);
  const distances = new Map(snapshot.distanceFeedback.map(guess => [guess.countryId, guess.distanceKm]));
  const names = new Map(snapshot.countries.map(country => [country.id, countryName(country.id, country.name, language)]));
  const projection = useMemo(
    () => geoOrthographic()
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
      .scale(GLOBE_RADIUS * view.zoom)
      .clipAngle(90)
      .rotate([view.longitude, view.latitude, 0]),
    [view.latitude, view.longitude, view.zoom]
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const pointRadius = 2 * view.zoom;
  const pointPath = useMemo(() => geoPath(projection).pointRadius(pointRadius), [pointRadius, projection]);
  const spherePath = path({ type: "Sphere" }) ?? "";
  const graticulePath = path(geoGraticule10()) ?? "";
  const guess = (countryId: string) => {
    if (canGuess && !wrong.has(countryId)) onGuess(countryId);
  };
  const setGlobeView = (next: GlobeView) => {
    viewRef.current = next;
    setView(next);
  };
  const stopInertia = () => {
    if (inertiaFrame.current !== null) {
      cancelAnimationFrame(inertiaFrame.current);
      inertiaFrame.current = null;
    }
  };
  const zoomBy = (factor: number) => {
    stopInertia();
    setGlobeView({ ...viewRef.current, zoom: clampZoom(viewRef.current.zoom * factor) });
  };
  const resetView = () => {
    stopInertia();
    setGlobeView({ longitude: 0, latitude: 0, zoom: 1 });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const zoomWithWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    svg.addEventListener("wheel", zoomWithWheel, { passive: false });
    return () => {
      svg.removeEventListener("wheel", zoomWithWheel);
      if (inertiaFrame.current !== null) cancelAnimationFrame(inertiaFrame.current);
    };
  }, []);

  const svgCoordinates = (event: ReactPointerEvent<SVGSVGElement>): [number, number] => {
    const point = event.currentTarget.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = event.currentTarget.getScreenCTM();
    const localPoint = matrix ? point.matrixTransform(matrix.inverse()) : null;
    return localPoint ? [localPoint.x, localPoint.y] : [MAP_WIDTH / 2, MAP_HEIGHT / 2];
  };

  const rotateForDrag = (anchor: [number, number] | null, dx: number, dy: number) => {
    const current = viewRef.current;
    const next = { ...current };
    if (anchor) {
      const projectionForDrag = geoOrthographic()
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
        .scale(GLOBE_RADIUS * current.zoom)
        .clipAngle(90);
      const projectAt = (longitude: number, latitude: number) => {
        projectionForDrag.rotate([longitude, latitude, 0]);
        return projectionForDrag(anchor);
      };
      const point = projectAt(current.longitude, current.latitude);
      const longitudePoint = projectAt(current.longitude + 0.1, current.latitude);
      const latitudePoint = projectAt(current.longitude, current.latitude + 0.1);
      if (point && longitudePoint && latitudePoint) {
        const longitudeDx = (longitudePoint[0] - point[0]) / 0.1;
        const longitudeDy = (longitudePoint[1] - point[1]) / 0.1;
        const latitudeDx = (latitudePoint[0] - point[0]) / 0.1;
        const latitudeDy = (latitudePoint[1] - point[1]) / 0.1;
        const determinant = longitudeDx * latitudeDy - latitudeDx * longitudeDy;
        if (Math.abs(determinant) > 0.001) {
          next.longitude = wrapLongitude(current.longitude + (dx * latitudeDy - dy * latitudeDx) / determinant);
          next.latitude = Math.max(-85, Math.min(85, current.latitude + (longitudeDx * dy - longitudeDy * dx) / determinant));
        } else {
          next.longitude = wrapLongitude(current.longitude + dx / (GLOBE_RADIUS * current.zoom) * 180 / Math.PI);
          next.latitude = Math.max(-85, Math.min(85, current.latitude - dy / (GLOBE_RADIUS * current.zoom) * 180 / Math.PI));
        }
      } else {
        next.longitude = wrapLongitude(current.longitude + dx / (GLOBE_RADIUS * current.zoom) * 180 / Math.PI);
        next.latitude = Math.max(-85, Math.min(85, current.latitude - dy / (GLOBE_RADIUS * current.zoom) * 180 / Math.PI));
      }
    } else {
      next.longitude = wrapLongitude(current.longitude + dx / (GLOBE_RADIUS * current.zoom) * 180 / Math.PI);
      next.latitude = Math.max(-85, Math.min(85, current.latitude - dy / (GLOBE_RADIUS * current.zoom) * 180 / Math.PI));
    }
    setGlobeView(next);
  };

  const beginDrag = (pointerId: number, x: number, y: number) => {
    const anchor = projection.invert?.([x, y]) ?? null;
    drag.current = {
      pointerId,
      x,
      y,
      startX: x,
      startY: y,
      moved: false,
      countryId: null,
      anchor: anchor ? [anchor[0], anchor[1]] : null,
      velocityLongitude: 0,
      velocityLatitude: 0,
      lastMoveTime: performance.now()
    };
  };

  const getTouchPoints = () => [...activePointers.current.values()]
    .filter(pointer => pointer.type === "touch")
    .slice(0, 2)
    .map(pointer => pointer.point);

  const projectAnchorTo = (anchor: [number, number], x: number, y: number, zoomFactor: number) => {
    const current = viewRef.current;
    const nextZoom = clampZoom(current.zoom * zoomFactor);
    if (nextZoom === current.zoom) return;
    setGlobeView({ ...current, zoom: nextZoom });
    const projected = geoOrthographic()
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2])
      .scale(GLOBE_RADIUS * nextZoom)
      .clipAngle(90)
      .rotate([current.longitude, current.latitude, 0])(anchor);
    if (projected) rotateForDrag(anchor, x - projected[0], y - projected[1]);
  };

  const finishPointer = (event: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) => {
    const wasPinching = pinch.current !== null;
    activePointers.current.delete(event.pointerId);
    if (wasPinching) {
      pinch.current = null;
      drag.current = null;
      const remaining = activePointers.current.entries().next().value as [number, { point: [number, number]; type: string }] | undefined;
      if (remaining) beginDrag(remaining[0], remaining[1].point[0], remaining[1].point[1]);
      return;
    }
    const current = drag.current;
    drag.current = null;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!cancelled && !current.moved && current.countryId) guess(current.countryId);
    if (!cancelled && current.moved) startInertia(current.velocityLongitude, current.velocityLatitude);
  };

  const startInertia = (longitude: number, latitude: number) => {
    if (Math.hypot(longitude, latitude) < 0.12) return;
    let velocityLongitude = longitude;
    let velocityLatitude = latitude;
    let previousTime = 0;
    const animate = (time: number) => {
      const frameScale = previousTime ? Math.min((time - previousTime) / 16.67, 3) : 1;
      previousTime = time;
      const current = viewRef.current;
      setGlobeView({
        ...current,
        longitude: wrapLongitude(current.longitude + velocityLongitude * frameScale),
        latitude: Math.max(-85, Math.min(85, current.latitude + velocityLatitude * frameScale))
      });
      const friction = 0.92 ** frameScale;
      velocityLongitude *= friction;
      velocityLatitude *= friction;
      if (Math.hypot(velocityLongitude, velocityLatitude) < 0.12) {
        inertiaFrame.current = null;
        return;
      }
      inertiaFrame.current = requestAnimationFrame(animate);
    };
    inertiaFrame.current = requestAnimationFrame(animate);
  };

  return (
    <div className="wld-map-wrap">
      <div className="wld-globe-stage">
        <svg
          ref={svgRef}
          className="wld-map"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="group"
          tabIndex={0}
          aria-label={TEXT[language].globeLabel}
          onKeyDown={event => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
              const current = viewRef.current;
              stopInertia();
              setGlobeView({
                ...current,
                longitude: wrapLongitude(current.longitude + (event.key === "ArrowLeft" ? -8 : event.key === "ArrowRight" ? 8 : 0)),
                latitude: Math.max(-85, Math.min(85, current.latitude + (event.key === "ArrowUp" ? -8 : event.key === "ArrowDown" ? 8 : 0)))
              });
            } else if (event.key === "+" || event.key === "=") {
              event.preventDefault();
              zoomBy(1.15);
            } else if (event.key === "-") {
              event.preventDefault();
              zoomBy(1 / 1.15);
            } else if (event.key === "Home") {
              event.preventDefault();
              resetView();
            }
          }}
          onPointerDown={event => {
            if (event.button !== 0) return;
            stopInertia();
            const [x, y] = svgCoordinates(event);
            activePointers.current.set(event.pointerId, { point: [x, y], type: event.pointerType });
            event.currentTarget.setPointerCapture(event.pointerId);
            const touchPoints = getTouchPoints();
            if (touchPoints.length >= 2) {
              const points = touchPoints;
              const dx = points[1]![0] - points[0]![0];
              const dy = points[1]![1] - points[0]![1];
              pinch.current = {
                distance: Math.hypot(dx, dy),
                midpoint: [(points[0]![0] + points[1]![0]) / 2, (points[0]![1] + points[1]![1]) / 2]
              };
              drag.current = null;
              return;
            }
            const target = event.target;
            const countryId = target instanceof SVGElement ? target.dataset.countryId ?? null : null;
            const anchor = projection.invert?.([x, y]) ?? null;
            drag.current = {
              pointerId: event.pointerId,
              x,
              y,
              startX: x,
              startY: y,
              moved: false,
              countryId,
              anchor: anchor ? [anchor[0], anchor[1]] : null,
              velocityLongitude: 0,
              velocityLatitude: 0,
              lastMoveTime: event.timeStamp
            };
          }}
          onPointerMove={event => {
            if (!activePointers.current.has(event.pointerId)) return;
            const [x, y] = svgCoordinates(event);
            const pointer = activePointers.current.get(event.pointerId)!;
            activePointers.current.set(event.pointerId, { ...pointer, point: [x, y] });
            const touchPoints = getTouchPoints();
            if (touchPoints.length >= 2) {
              const points = touchPoints;
              const dx = points[1]![0] - points[0]![0];
              const dy = points[1]![1] - points[0]![1];
              const nextPinch = {
                distance: Math.hypot(dx, dy),
                midpoint: [(points[0]![0] + points[1]![0]) / 2, (points[0]![1] + points[1]![1]) / 2] as [number, number]
              };
              const previous = pinch.current;
              if (previous && previous.distance > 0 && nextPinch.distance > 0) {
                const anchor = projection.invert?.(previous.midpoint) ?? null;
                if (anchor) {
                  projectAnchorTo([anchor[0], anchor[1]], nextPinch.midpoint[0], nextPinch.midpoint[1], nextPinch.distance / previous.distance);
                } else {
                  zoomBy(nextPinch.distance / previous.distance);
                }
              }
              pinch.current = nextPinch;
              drag.current = null;
              return;
            }
            const current = drag.current;
            if (!current || current.pointerId !== event.pointerId) {
              return;
            }
            if (Math.hypot(x - current.startX, y - current.startY) > 4) current.moved = true;
            if (current.moved) {
              const dx = x - current.x;
              const dy = y - current.y;
              const elapsed = Math.max(1, event.timeStamp - current.lastMoveTime);
              rotateForDrag(current.anchor, dx, dy);
              const angularScale = 180 / Math.PI / (GLOBE_RADIUS * viewRef.current.zoom);
              const velocityScale = 16.67 / elapsed;
              current.velocityLongitude = Math.max(-4, Math.min(4, dx * angularScale * velocityScale));
              current.velocityLatitude = Math.max(-4, Math.min(4, -dy * angularScale * velocityScale));
              current.x = x;
              current.y = y;
              current.lastMoveTime = event.timeStamp;
            }
          }}
          onPointerUp={event => finishPointer(event, false)}
          onPointerCancel={event => finishPointer(event, true)}
        >
          <defs>
            <radialGradient id="wld-ocean-gradient" cx="34%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#71dce7" />
              <stop offset="48%" stopColor="#4a79d2" />
              <stop offset="100%" stopColor="#29245f" />
            </radialGradient>
            <radialGradient id="wld-globe-light" cx="30%" cy="22%" r="78%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".25" />
              <stop offset="75%" stopColor="#15183a" stopOpacity="0" />
              <stop offset="100%" stopColor="#10132e" stopOpacity=".34" />
            </radialGradient>
          </defs>
          <path d={spherePath} className="wld-ocean" />
          <path d={graticulePath} className="wld-graticule" />
          {COUNTRY_FEATURES.map(country => {
            const countryId = country.properties.id;
            const distance = distances.get(countryId);
            const target = snapshot.revealedCountryId === countryId;
            return (
              <path
                key={countryId}
                d={path(country) ?? undefined}
                data-country-id={countryId}
                className={`wld-country${distance !== undefined ? ` ${heatClass(distance)}` : ""}${target ? " target" : ""}`}
                aria-label={names.get(countryId) ?? country.properties.name}
              >
              </path>
            );
          })}
          {SMALL_COUNTRIES.map(country => {
            const distance = distances.get(country.id);
            const target = snapshot.revealedCountryId === country.id;
            const name = names.get(country.id) ?? country.id;
            return (
              <path
                key={country.id}
                d={pointPath({ type: "Point", coordinates: country.coordinates }) ?? undefined}
                data-country-id={country.id}
                className={`wld-country-point${distance !== undefined ? ` ${heatClass(distance)}` : ""}${target ? " target" : ""}`}
                aria-label={name}
              >
              </path>
            );
          })}
          <path d={spherePath} className="wld-globe-light" aria-hidden="true" />
          <path d={spherePath} className="wld-globe-outline" aria-hidden="true" />
        </svg>
        <div className="wld-map-zoom" aria-label={TEXT[language].zoomControls}>
          <button type="button" aria-label={TEXT[language].zoomIn} disabled={view.zoom >= MAX_ZOOM} onClick={() => zoomBy(1.2)}>+</button>
          <button type="button" aria-label={TEXT[language].zoomOut} disabled={view.zoom <= MIN_ZOOM} onClick={() => zoomBy(1 / 1.2)}>−</button>
          <button type="button" aria-label={TEXT[language].resetGlobe} disabled={view.longitude === 0 && view.latitude === 0 && view.zoom === 1} onClick={resetView}>⌂</button>
        </div>
      </div>
      {snapshot.distanceFeedback.length > 0 && (
        <div className="wld-map-legend" aria-label="Guess distance colors">
          <span>{TEXT[language].far}</span>
          <i className="heat-1" /><i className="heat-2" /><i className="heat-3" />
          <i className="heat-4" /><i className="heat-5" /><i className="heat-6" />
          <span>{TEXT[language].close}</span>
        </div>
      )}
      {canGuess && (
        <p className="wld-map-instructions">{TEXT[language].guessInstructions}</p>
      )}
    </div>
  );
}

function PlayerScores({ snapshot, userId }: { snapshot: WaarLandSnapshot; userId: string }) {
  return (
    <ol className="wld-scores">
      {[...snapshot.players].sort((a, b) => b.score - a.score || a.order - b.order).map(player => (
        <li key={player.id} className={`${player.id === snapshot.activePlayerId ? "active" : ""}${player.id === userId ? " me" : ""}`}>
          <Person id={player.id} name={player.username} />
          <strong className="score-bubble">{player.score}</strong>
        </li>
      ))}
    </ol>
  );
}

function GameBrand({ language }: { language: Language }) {
  return (
    <header className="wld-brand">
      <span className="wld-brand-orbit" aria-hidden="true">🌍</span>
      <div>
        <p>{language === "nl" ? "WERELDWIJDE WEETJES" : "WORLDWIDE TRIVIA"}</p>
        <h1>Plenet</h1>
      </div>
      <span className="wld-brand-spark" aria-hidden="true">✦</span>
    </header>
  );
}

function WaitingRoom({ snapshot, userId, isHost, isDisplay, language, send }: GameLobbyProps<WaarLandSnapshot> & { language: Language }) {
  const text = TEXT[language];
  const me = snapshot.players.find(player => player.id === userId);
  const [rounds, setRounds] = useState(String(snapshot.roundsPerPlayer));
  useEffect(() => setRounds(String(snapshot.roundsPerPlayer)), [snapshot.roundsPerPlayer]);
  return (
    <>
      <div className="grid-2">
        <section className="card">
          <h2>{text.players} <span className="pill">{snapshot.players.length}/{snapshot.maxPlayers}</span></h2>
          <ul className="wld-roster">
            {snapshot.players.map(player => (
              <li key={player.id} className="row between">
                <Person id={player.id} name={player.username} />
                <span className="row">
                  {player.id === userId && <span className="pill">{text.you}</span>}
                  <KickButton id={player.id} name={player.username} isHost={isHost} send={send} />
                </span>
              </li>
            ))}
          </ul>
          {me
            ? <button type="button" onClick={() => send({ type: "leave" })}>{text.backToSpectating}</button>
            : !isDisplay && <button type="button" disabled={snapshot.players.length >= snapshot.maxPlayers} onClick={() => send({ type: "join" })}>{text.joinGame}</button>}
          {snapshot.spectators.length > 0 && (
            <>
              <h3>{text.spectators}</h3>
              <ul className="names spectator-names">{snapshot.spectators.map(person => <li key={person.id}><Person id={person.id} name={person.username} /></li>)}</ul>
            </>
          )}
        </section>
        <section className="card">
          <h2>{text.howToPlay}</h2>
          <ol>
            <li>{text.drawAndGuess}</li>
            <li>{text.closerPoints}</li>
            <li>{text.triviaPoint}</li>
            <li>{text.gameEnd}</li>
          </ol>
          {!isHost && <p className="muted small">{text.waitingForHost.replace("{name}", snapshot.host.name)}</p>}
        </section>
      </div>
      {isHost && <HostControlsTab>
        <div className="host-actions wld-host-controls">
          <label>{text.roundsPerPlayer}
            <input
              type="number"
              min={1}
              max={50}
              value={rounds}
              onChange={event => setRounds(event.target.value)}
              onBlur={() => {
                const parsed = Number(rounds);
                if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 50 && parsed !== snapshot.roundsPerPlayer) {
                  send({ type: "setOptions", roundsPerPlayer: parsed });
                } else if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
                  setRounds(String(snapshot.roundsPerPlayer));
                }
              }}
            />
          </label>
          <button className="primary" type="button" disabled={snapshot.players.length === 0} onClick={() => send({ type: "start" })}>{text.startGame}</button>
          {snapshot.players.length === 0 && <p className="muted small">{text.needPlayer}</p>}
        </div>
      </HostControlsTab>}
    </>
  );
}

export function WaarLandLobby(props: GameLobbyProps<WaarLandSnapshot>) {
  const { snapshot, userId, isHost, send } = props;
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem("wld-language") === "en" ? "en" : "nl");
  const [languageSlot, setLanguageSlot] = useState<HTMLElement | null>(null);
  const text = TEXT[language];
  useEffect(() => {
    setLanguageSlot(document.getElementById("plenet-language-slot"));
  }, []);
  const changeLanguage = (next: Language) => {
    localStorage.setItem("wld-language", next);
    setLanguage(next);
  };
  const languageSwitch = (
    <button
      className="wld-language-toggle"
      type="button"
      aria-label={`${text.language}: ${language === "nl" ? "Nederlands" : "English"}. Switch language.`}
      aria-pressed={language === "en"}
      title={`${text.language}: ${language === "nl" ? "Nederlands" : "English"}`}
      onClick={() => changeLanguage(language === "nl" ? "en" : "nl")}
    >
      <span className={language === "nl" ? "active" : ""}>NL</span>
      <span aria-hidden="true">/</span>
      <span className={language === "en" ? "active" : ""}>EN</span>
    </button>
  );
  if (snapshot.phase === "lobby") {
    return (
      <div className="wld-game">
        <GameBrand language={language} />
        {languageSlot && createPortal(languageSwitch, languageSlot)}
        <WaitingRoom {...props} language={language} />
      </div>
    );
  }

  const active = snapshot.activePlayerId === userId;
  const ownPlayer = snapshot.players.find(player => player.id === userId);
  const canGuess = snapshot.phase === "playing" && snapshot.step === "guess" && active;
  const activePlayerName = snapshot.players.find(player => player.id === snapshot.activePlayerId)?.username ?? "Player";
  const reviewerName = snapshot.players.find(player => player.id === snapshot.reviewerId)?.username ?? "Player";

  return (
    <div className="wld-game">
      <GameBrand language={language} />
      {languageSlot && createPortal(languageSwitch, languageSlot)}
      <PlayerScores snapshot={snapshot} userId={userId} />
      {snapshot.phase === "results" ? (
        <section className="card wld-results">
          <h2>{text.gameOver}</h2>
          <ol>
            {snapshot.results.map((result, index) => (
              <li key={result.id}>
                <span>{result.won ? "🏆" : `${index + 1}.`} {result.username}</span>
                <strong>{result.score} {text.points}</strong>
              </li>
            ))}
          </ol>
          {isHost && <button className="primary" type="button" onClick={() => send({ type: "exit" })}>{text.returnToLobby}</button>}
        </section>
      ) : (
        <>
          <div className="wld-turn-status" aria-live="polite">
            <strong>{language === "nl" ? `Ronde ${snapshot.round} van ${snapshot.roundsPerPlayer}` : `Round ${snapshot.round} of ${snapshot.roundsPerPlayer}`}</strong>
            <span>{active ? text.yourTurn : language === "nl" ? `${activePlayerName} is aan de beurt` : `${activePlayerName}'s turn`}</span>
          </div>
          <div className="wld-play-area">
            <section className="card wld-clue-card">
              <h2>{language === "en" ? snapshot.targetNameEn ?? snapshot.targetName ?? text.drawCountry : snapshot.targetName ?? text.drawCountry}</h2>
              {snapshot.step === "draw" && active && <button className="primary" type="button" onClick={() => send({ type: "draw" })}>{text.drawButton}</button>}
              {snapshot.step === "guess" && (
                <>
                  <p>{active ? text.selectCountry : language === "nl" ? `${activePlayerName} zoekt dit land.` : `${activePlayerName} ${text.searchingCountry}`}</p>
                  <p className="wld-attempts" aria-label={`${3 - snapshot.wrongGuesses.length} guesses remaining`}>
                    {"❤️".repeat(3 - snapshot.wrongGuesses.length)}{"🖤".repeat(snapshot.wrongGuesses.length)}
                  </p>
                  {snapshot.distanceFeedback.map(guess => (
                    <p className="wld-distance" key={guess.countryId}>{countryName(guess.countryId, guess.countryName, language)}: {language === "nl" ? `ongeveer ${guess.distanceKm.toLocaleString()} km ver.` : `about ${guess.distanceKm.toLocaleString()} km away.`}</p>
                  ))}
                </>
              )}
              {snapshot.turnMessage && <p className="wld-feedback" aria-live="polite">{localizedTurnMessage(snapshot, language)}</p>}
              {snapshot.step === "trivia" && snapshot.trivia && (
                <div className="wld-question">
                  <strong>{language === "en" ? CATEGORY_NAMES_EN[snapshot.trivia.category] ?? snapshot.trivia.category : snapshot.trivia.category}</strong>
                  <p>{language === "en" ? snapshot.trivia.questionEn ?? snapshot.trivia.question : snapshot.trivia.question}</p>
                  {snapshot.trivia.trueFalse ? (
                    <div className="row">
                      <button type="button" disabled={!active} onClick={() => send({ type: "answer", correct: true })}>{text.true}</button>
                      <button type="button" disabled={!active} onClick={() => send({ type: "answer", correct: false })}>{text.false}</button>
                    </div>
                  ) : (
                    <>
                      {active && (
                        <>
                          <p className="muted small">{text.sayAnswer}</p>
                          <button type="button" onClick={() => send({ type: "revealAnswer" })}>
                            {text.revealAnswer}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
              {snapshot.step === "answer" && snapshot.trivia && (
                <div className="wld-question">
                  <strong>{language === "en" ? CATEGORY_NAMES_EN[snapshot.trivia.category] ?? snapshot.trivia.category : snapshot.trivia.category}</strong>
                  <p>{language === "en" ? snapshot.trivia.questionEn ?? snapshot.trivia.question : snapshot.trivia.question}</p>
                  <p className="wld-answer">{language === "en" ? snapshot.trivia.answerEn ?? snapshot.trivia.answer : snapshot.trivia.answer}</p>
                  {snapshot.trivia.explanation && (
                    <p className="wld-explanation">
                      <strong>{text.explanation}:</strong>{" "}
                      {language === "en" ? snapshot.trivia.explanationEn ?? snapshot.trivia.explanation : snapshot.trivia.explanation}
                    </p>
                  )}
                  {snapshot.trivia.trueFalse ? (
                    <>
                      {snapshot.trivia.response !== null && <p>{snapshot.trivia.response ? text.selectedTrue : text.selectedFalse}</p>}
                      <p className="muted small">{snapshot.trivia.response === null ? text.missingLegacyResponse : text.legacyAnswerPrompt}</p>
                      {active && snapshot.trivia.response !== null && (
                        <button type="button" onClick={() => send({ type: "answer", correct: snapshot.trivia?.response ?? false })}>{text.resolveLegacyAnswer}</button>
                      )}
                    </>
                  ) : (
                    <>
                      {userId === snapshot.reviewerId ? (
                        <>
                          {snapshot.reviewerId === snapshot.activePlayerId && <p className="muted small">{text.noReviewer}</p>}
                          <div className="row">
                            <button type="button" onClick={() => send({ type: "grade", correct: true })}>{text.approveAnswer}</button>
                            <button type="button" onClick={() => send({ type: "grade", correct: false })}>{text.rejectAnswer}</button>
                          </div>
                        </>
                      ) : <p className="muted small">{text.waitingForReviewer.replace("{name}", reviewerName)}</p>}
                    </>
                  )}
                </div>
              )}
              {snapshot.step === "turnComplete" && (
                <>
                  {snapshot.trivia && (
                    <>
                      <p className="wld-answer">{language === "en" ? snapshot.trivia.answerEn ?? snapshot.trivia.answer : snapshot.trivia.answer}</p>
                      {snapshot.trivia.explanation && (
                        <p className="wld-explanation">
                          <strong>{text.explanation}:</strong>{" "}
                          {language === "en" ? snapshot.trivia.explanationEn ?? snapshot.trivia.explanation : snapshot.trivia.explanation}
                        </p>
                      )}
                    </>
                  )}
                  <p>{active ? text.readyNextTurn : text.waitingForActive}</p>
                  {active && <button className="primary" type="button" onClick={() => send({ type: "next" })}>{text.nextTurn}</button>}
                </>
              )}
            </section>
            <WorldMap snapshot={snapshot} canGuess={canGuess} language={language} onGuess={countryId => send({ type: "guess", countryId })} />
          </div>
          {ownPlayer && <p className="muted small">{text.yourScore}: {ownPlayer.score} · {text.countriesFound}: {ownPlayer.countriesFound}</p>}
          {isHost && <HostControlsTab>
            <div className="host-actions wld-host-controls">
              <button className="danger" type="button" onClick={() => send({ type: "exit" })}>{text.quitGame}</button>
            </div>
          </HostControlsTab>}
        </>
      )}
    </div>
  );
}
