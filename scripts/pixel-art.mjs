const GRID = 32;
const SCALE = 8;

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function rect(x, y, width, height, fill, opacity = 1) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" opacity="${opacity}" />`;
}

export function pixel(x, y, fill, opacity = 1) {
  return rect(x, y, 1, 1, fill, opacity);
}

function normalizeLayer(layer, index) {
  if (!layer) return null;
  if (typeof layer === "string") {
    return { name: `layer-${index}`, markup: layer };
  }
  return {
    name: layer.name ?? `layer-${index}`,
    markup: layer.markup ?? "",
  };
}

function layer(name, markup) {
  return { name, markup };
}

function escapeCdata(value) {
  return String(value).replaceAll("]]>", "]]\\u003e");
}

export function spriteSvg(title, layers, options = {}) {
  const normalizedLayers = layers
    .map(normalizeLayer)
    .filter((entry) => entry?.markup);
  const metadata = options.coordinateMetadata
    ? `<metadata id="coordinate-report"><![CDATA[${escapeCdata(
        JSON.stringify(options.coordinateMetadata),
      )}]]></metadata>`
    : "";
  const layerMarkup = normalizedLayers
    .map(
      (entry) =>
        `<g data-layer="${esc(entry.name)}">\n${entry.markup}\n</g>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${GRID * SCALE}" height="${GRID * SCALE}" viewBox="0 0 ${GRID} ${GRID}" shape-rendering="crispEdges" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  ${metadata}
  ${layerMarkup}
  ${options.debugLayer ?? ""}
</svg>\n`;
}

function shadow() {
  return [
    rect(8, 28, 16, 2, "#020617", 0.22),
    rect(10, 27, 12, 1, "#020617", 0.15),
  ].join("\n");
}

function star(x, y, color) {
  return [
    pixel(x, y - 1, color),
    pixel(x - 1, y, color),
    rect(x, y, 1, 2, color),
    pixel(x + 1, y, color),
  ].join("\n");
}

const DEFAULT_SYMMETRY_AXIS_X = GRID / 2;

function mirroredRectX(x, width, centerX = DEFAULT_SYMMETRY_AXIS_X) {
  return 2 * centerX - x - width;
}

function mirrorRectMarkup(markup, centerX = DEFAULT_SYMMETRY_AXIS_X) {
  if (!markup) return "";
  return markup.replace(/<rect\b([^>]*)\/?\s*>/g, (full, rawAttributes) => {
    const xMatch = rawAttributes.match(/\bx="([^"]+)"/);
    const widthMatch = rawAttributes.match(/\bwidth="([^"]+)"/);
    if (!xMatch || !widthMatch) return full;

    const x = Number(xMatch[1]);
    const width = Number(widthMatch[1]);
    if (!Number.isFinite(x) || !Number.isFinite(width)) return full;

    const mirroredX = mirroredRectX(x, width, centerX);
    return full.replace(`x="${xMatch[1]}"`, `x="${mirroredX}"`);
  });
}

function symmetricPair(markup, centerX = DEFAULT_SYMMETRY_AXIS_X) {
  if (!markup) return "";
  return [markup, mirrorRectMarkup(markup, centerX)].join("\n");
}

function centerSparkle(centerX, y, color, opacity = 1) {
  return [
    rect(centerX - 1, y - 2, 2, 1, color, opacity),
    rect(centerX - 2, y - 1, 4, 2, color, opacity),
    rect(centerX - 1, y + 1, 2, 1, color, opacity),
  ].join("\n");
}

function parseRectangles(markup, layerName = "unknown") {
  if (!markup) return [];

  const rectangles = [];
  const rectPattern = /<rect\b([^>]*)\/?\s*>/g;
  let match;

  while ((match = rectPattern.exec(markup)) !== null) {
    const attributes = {};
    const attributePattern = /([\w:-]+)="([^"]*)"/g;
    let attributeMatch;
    while ((attributeMatch = attributePattern.exec(match[1])) !== null) {
      attributes[attributeMatch[1]] = attributeMatch[2];
    }

    const x = Number(attributes.x);
    const y = Number(attributes.y);
    const width = Number(attributes.width);
    const height = Number(attributes.height);
    rectangles.push({
      layer: layerName,
      x,
      y,
      width,
      height,
      right: x + width,
      bottom: y + height,
      fill: attributes.fill ?? "",
      opacity: Number(attributes.opacity ?? 1),
    });
  }

  return rectangles;
}

function boundsFromRectangles(rectangles) {
  if (rectangles.length === 0) return null;
  return rectangles.reduce(
    (bounds, item) => ({
      left: Math.min(bounds.left, item.x),
      top: Math.min(bounds.top, item.y),
      right: Math.max(bounds.right, item.right),
      bottom: Math.max(bounds.bottom, item.bottom),
    }),
    {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
    },
  );
}

function boundsFromMarkup(markup, layerName) {
  return boundsFromRectangles(parseRectangles(markup, layerName));
}

function unionBounds(...boundsList) {
  const valid = boundsList.flat().filter(Boolean);
  if (valid.length === 0) return null;
  return valid.reduce(
    (bounds, item) => ({
      left: Math.min(bounds.left, item.left),
      top: Math.min(bounds.top, item.top),
      right: Math.max(bounds.right, item.right),
      bottom: Math.max(bounds.bottom, item.bottom),
    }),
    valid[0],
  );
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteCoordinate(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function centerOf(bounds) {
  if (!bounds) return { x: GRID / 2, y: GRID / 2 };
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}

function createCoordinateModel(def, stage, coreLayers) {
  const layerBounds = Object.fromEntries(
    coreLayers.map((entry) => [
      entry.name,
      boundsFromMarkup(entry.markup, entry.name),
    ]),
  );
  const bodyBounds = layerBounds.body;
  const characterBounds = unionBounds(
    layerBounds.body,
    layerBounds.headgear,
  );
  const silhouetteBounds = unionBounds(
    characterBounds,
    layerBounds.offhand,
    layerBounds.weapon,
  );
  const bodyCenter = centerOf(bodyBounds ?? characterBounds ?? silhouetteBounds);
  const tuning = def.effectCoordinates ?? {};
  const symmetryMode = "mirror";
  const baseCenterX = Math.round(
    tuning.allowCenterOverride === true
      ? finiteCoordinate(tuning.centerX, DEFAULT_SYMMETRY_AXIS_X)
      : DEFAULT_SYMMETRY_AXIS_X,
  );
  const rawHorizontalRadius = Math.ceil(
    Math.max(
      baseCenterX - (silhouetteBounds?.left ?? baseCenterX - 10),
      (silhouetteBounds?.right ?? baseCenterX + 10) - baseCenterX,
    ) + 2,
  );
  const maximumRadius = Math.min(baseCenterX - 2, 30 - baseCenterX);
  const xOffset = finiteCoordinate(tuning.x);
  const yOffset = finiteCoordinate(tuning.y);
  const leftTuning = finiteCoordinate(tuning.left);
  const rightTuning = finiteCoordinate(tuning.right);
  const symmetricExtra = Math.max(
    0,
    Math.abs(xOffset),
    Math.abs(leftTuning),
    Math.abs(rightTuning),
  );
  const radius = clamp(
    Math.ceil(rawHorizontalRadius + (symmetryMode === "mirror" ? symmetricExtra : 0)),
    10,
    maximumRadius,
  );

  let centerX = baseCenterX;
  let left;
  let right;

  if (symmetryMode === "mirror") {
    // 左右の個別補正は片側だけを動かさず、半径の拡張として吸収する。
    // これにより全キャラクターのエフェクト軸が進化中に揺れない。
    left = centerX - radius;
    right = centerX + radius;
  } else {
    centerX = baseCenterX + xOffset;
    left = baseCenterX - radius + xOffset + leftTuning;
    right = baseCenterX + radius + xOffset + rightTuning;
  }

  let top =
    Math.floor((silhouetteBounds?.top ?? 4) - 2) +
    yOffset +
    finiteCoordinate(tuning.top);
  let bottom =
    Math.ceil((silhouetteBounds?.bottom ?? 27) + 1) +
    yOffset +
    finiteCoordinate(tuning.bottom);

  centerX = clamp(Math.round(centerX), 2, 30);
  left = clamp(Math.round(left), 2, centerX - 2);
  right = clamp(Math.round(right), centerX + 2, 30);
  top = clamp(Math.round(top), 1, 25);
  bottom = clamp(Math.round(bottom), top + 8, 29);

  if (symmetryMode === "mirror") {
    const clampedRadius = Math.min(centerX - left, right - centerX);
    left = centerX - clampedRadius;
    right = centerX + clampedRadius;
  }

  const frame = { left, right, top, bottom, centerX };
  const anchors = {
    center: {
      x: centerX,
      y: Math.round(bodyCenter.y + yOffset),
    },
    head: {
      x: centerX,
      y: characterBounds?.top ?? top + 2,
    },
    feet: {
      x: centerX,
      y: characterBounds?.bottom ?? bottom - 1,
    },
    leftEquipment: centerOf(layerBounds.offhand),
    rightEquipment: centerOf(layerBounds.weapon),
  };

  return {
    grid: GRID,
    stage,
    kind: def.kind,
    symmetryMode,
    frame,
    anchors,
    layerBounds,
    bodyBounds,
    characterBounds,
    silhouetteBounds,
    tuning: {
      x: xOffset,
      y: yOffset,
      left: leftTuning,
      right: rightTuning,
      top: finiteCoordinate(tuning.top),
      bottom: finiteCoordinate(tuning.bottom),
      centerX: baseCenterX,
      symmetry: symmetryMode,
    },
  };
}

function rectangleSignature(item) {
  return [
    item.x,
    item.y,
    item.width,
    item.height,
    item.fill,
    Number(item.opacity ?? 1),
  ].join("|");
}

function mirroredRectangleSignature(item, centerX) {
  return rectangleSignature({
    ...item,
    x: mirroredRectX(item.x, item.width, centerX),
  });
}

function inspectLayerSymmetry(rectangles, centerX) {
  const counts = new Map();
  for (const item of rectangles) {
    const key = rectangleSignature(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const inspected = new Set();
  const unmatched = [];
  for (const item of rectangles) {
    const key = rectangleSignature(item);
    if (inspected.has(key)) continue;
    const mirrorKey = mirroredRectangleSignature(item, centerX);
    inspected.add(key);
    inspected.add(mirrorKey);

    const count = counts.get(key) ?? 0;
    const mirrorCount = counts.get(mirrorKey) ?? 0;
    const difference = key === mirrorKey ? 0 : Math.abs(count - mirrorCount);
    if (difference > 0) {
      unmatched.push({
        rectangle: {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          fill: item.fill,
          opacity: item.opacity,
        },
        mirrorX: mirroredRectX(item.x, item.width, centerX),
        difference,
      });
    }
  }

  return {
    symmetric: unmatched.length === 0,
    unmatchedCount: unmatched.reduce(
      (total, item) => total + item.difference,
      0,
    ),
    unmatched: unmatched.slice(0, 20),
  };
}

function headgearAllowsAsymmetry(type) {
  return false;
}

function analyzeCoordinates(def, stage, layers, model) {
  const errors = [];
  const warnings = [];
  const layerBounds = {};
  const rectangles = [];
  const rectanglesByLayer = {};

  for (const entry of layers) {
    const items = parseRectangles(entry.markup, entry.name);
    rectangles.push(...items);
    rectanglesByLayer[entry.name] = items;
    layerBounds[entry.name] = boundsFromRectangles(items);

    for (const item of items) {
      const coordinateValues = [item.x, item.y, item.width, item.height];
      if (coordinateValues.some((value) => !Number.isFinite(value))) {
        errors.push(`${entry.name}: 数値ではない座標があります。`);
        continue;
      }
      if (item.width <= 0 || item.height <= 0) {
        errors.push(
          `${entry.name}: 幅または高さが0以下です (${item.x}, ${item.y}, ${item.width}, ${item.height})。`,
        );
      }
      if (
        item.x < 0 ||
        item.y < 0 ||
        item.right > GRID ||
        item.bottom > GRID
      ) {
        errors.push(
          `${entry.name}: 描画範囲外です (${item.x}, ${item.y})-(${item.right}, ${item.bottom})。`,
        );
      }
      if (coordinateValues.some((value) => !Number.isInteger(value))) {
        warnings.push(
          `${entry.name}: ドットグリッド外の小数座標があります (${item.x}, ${item.y}, ${item.width}, ${item.height})。`,
        );
      }
    }
  }

  const frame = model.frame;
  const leftRadius = frame.centerX - frame.left;
  const rightRadius = frame.right - frame.centerX;
  if (leftRadius !== rightRadius) {
    errors.push(
      `effect-frame: 左右幅が非対称です (left=${leftRadius}, right=${rightRadius})。`,
    );
  }

  const symmetryChecks = {};
  const mandatorySymmetryLayers = ["shadow", "body", "effect-behind", "effect-front"];
  for (const layerName of mandatorySymmetryLayers) {
    const check = inspectLayerSymmetry(
      rectanglesByLayer[layerName] ?? [],
      frame.centerX,
    );
    symmetryChecks[layerName] = check;
    if (!check.symmetric) {
      errors.push(
        `${layerName}: 鏡像になっていない矩形が ${check.unmatchedCount} 個あります。`,
      );
    }
  }

  if (rectanglesByLayer.headgear?.length) {
    const check = inspectLayerSymmetry(
      rectanglesByLayer.headgear,
      frame.centerX,
    );
    symmetryChecks.headgear = check;
    if (!check.symmetric && !headgearAllowsAsymmetry(def.headgear)) {
      warnings.push(
        `headgear: 左右非対称です。意図的なデザインなら headgearAllowsAsymmetry に登録してください。`,
      );
    }
  }

  const effectBounds = unionBounds(
    layerBounds["effect-behind"],
    layerBounds["effect-front"],
  );
  const effectCenter = centerOf(effectBounds);
  const effectCenterDeltaX = effectBounds
    ? Number((effectCenter.x - frame.centerX).toFixed(2))
    : 0;
  if (effectBounds && effectCenterDeltaX !== 0) {
    errors.push(
      `effect: 見た目の中心がキャラクター中心から ${effectCenterDeltaX}px ずれています。`,
    );
  }

  return {
    characterType: def.type ?? def.name,
    characterName: def.name,
    kind: def.kind,
    effect: def.effect ?? null,
    stage,
    status: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ok",
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    symmetryMode: model.symmetryMode,
    symmetryChecks,
    frame,
    anchors: model.anchors,
    bodyBounds: model.bodyBounds,
    characterBounds: model.characterBounds,
    silhouetteBounds: model.silhouetteBounds,
    effectBounds,
    effectCenterDeltaX,
    layerBounds,
    tuning: model.tuning,
    rectangleCount: rectangles.length,
  };
}

function boundsOutline(bounds, stroke, name) {
  if (!bounds) return "";
  return `<rect data-coordinate-box="${esc(name)}" x="${bounds.left}" y="${bounds.top}" width="${bounds.right - bounds.left}" height="${bounds.bottom - bounds.top}" fill="none" stroke="${stroke}" stroke-width="0.25" vector-effect="non-scaling-stroke" />`;
}

function anchorCross(anchor, stroke, name) {
  if (!anchor || !Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) {
    return "";
  }
  return `<g data-coordinate-anchor="${esc(name)}" stroke="${stroke}" stroke-width="0.25" vector-effect="non-scaling-stroke">
  <line x1="${anchor.x - 1}" y1="${anchor.y}" x2="${anchor.x + 1}" y2="${anchor.y}" />
  <line x1="${anchor.x}" y1="${anchor.y - 1}" x2="${anchor.x}" y2="${anchor.y + 1}" />
</g>`;
}

function symmetryMismatchDebug(symmetryChecks, centerX) {
  const items = [];
  for (const [layerName, check] of Object.entries(symmetryChecks ?? {})) {
    for (const mismatch of check.unmatched ?? []) {
      const source = mismatch.rectangle;
      items.push(
        `<rect data-symmetry-mismatch="${esc(layerName)}" x="${source.x}" y="${source.y}" width="${source.width}" height="${source.height}" fill="none" stroke="#ef4444" stroke-width="0.35" vector-effect="non-scaling-stroke" />`,
        `<rect data-symmetry-expected="${esc(layerName)}" x="${mismatch.mirrorX}" y="${source.y}" width="${source.width}" height="${source.height}" fill="none" stroke="#f97316" stroke-dasharray="0.6 0.4" stroke-width="0.25" vector-effect="non-scaling-stroke" />`,
      );
    }
  }
  return items.join("\n");
}

function coordinateDebugLayer(model, diagnostics) {
  const minorGrid = [];
  const majorGrid = [];
  const labels = [];

  for (let coordinate = 0; coordinate <= GRID; coordinate += 1) {
    const target = coordinate % 4 === 0 ? majorGrid : minorGrid;
    target.push(`M ${coordinate} 0V${GRID} M 0 ${coordinate}H${GRID}`);
  }
  for (let coordinate = 0; coordinate < GRID; coordinate += 4) {
    labels.push(
      `<text x="${coordinate + 0.25}" y="1.4" font-size="1.25" fill="#ffffff" stroke="#000000" stroke-width="0.15" paint-order="stroke">${coordinate}</text>`,
      `<text x="0.25" y="${coordinate + 1.4}" font-size="1.25" fill="#ffffff" stroke="#000000" stroke-width="0.15" paint-order="stroke">${coordinate}</text>`,
    );
  }

  const frameBounds = {
    left: model.frame.left,
    top: model.frame.top,
    right: model.frame.right,
    bottom: model.frame.bottom,
  };

  return `<g data-coordinate-debug="true" pointer-events="none">
  <path d="${minorGrid.join(" ")}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="0.08" />
  <path d="${majorGrid.join(" ")}" fill="none" stroke="#ffffff" stroke-opacity="0.32" stroke-width="0.12" />
  <line x1="${model.frame.centerX}" y1="0" x2="${model.frame.centerX}" y2="${GRID}" stroke="#fb7185" stroke-opacity="0.9" stroke-width="0.2" vector-effect="non-scaling-stroke" />
  ${boundsOutline(model.bodyBounds, "#22c55e", "body")}
  ${boundsOutline(model.silhouetteBounds, "#38bdf8", "silhouette")}
  ${boundsOutline(frameBounds, "#f472b6", "effect-frame")}
  ${boundsOutline(diagnostics.effectBounds, "#facc15", "effect")}
  ${anchorCross(model.anchors.center, "#ffffff", "center")}
  ${anchorCross(model.anchors.head, "#22c55e", "head")}
  ${anchorCross(model.anchors.leftEquipment, "#38bdf8", "left-equipment")}
  ${anchorCross(model.anchors.rightEquipment, "#38bdf8", "right-equipment")}
  ${symmetryMismatchDebug(diagnostics.symmetryChecks, model.frame.centerX)}
  ${labels.join("\n  ")}
</g>`;
}

function sparkleSet(color, stage, frame) {
  if (stage < 4) return "";

  const { left, top, bottom, centerX } = frame;
  const items = [
    symmetricPair(star(left + 2, top + 5, color), centerX),
  ];

  if (stage >= 5) {
    items.push(
      symmetricPair(star(left + 1, bottom - 7, color), centerX),
      symmetricPair(star(left + 5, top + 12, color), centerX),
      centerSparkle(centerX, top + 2, color, 0.9),
    );
  }

  return items.join("\n");
}

function localSparkles(x, y, color, stage) {
  if (stage < 4) return "";

  const items = [star(x - 1, y - 2, color)];
  if (stage >= 5) {
    items.push(star(x + 4, y + 1, color), pixel(x + 1, y - 4, color));
  }
  return items.join("\n");
}

function finalEvolutionBurst(color, frame) {
  const { left, top, bottom, centerX } = frame;
  const side = [
    rect(left, top + 4, 1, bottom - top - 8, color, 0.18),
    rect(left + 2, top + 1, 6, 1, color, 0.35),
    rect(left + 2, bottom - 1, 7, 1, color, 0.3),
    pixel(left, top + 11, color, 0.7),
    pixel(left + 4, bottom - 9, color, 0.55),
  ].join("\n");

  return [
    symmetricPair(side, centerX),
    rect(centerX - 2, top, 4, 1, color, 0.65),
    rect(centerX - 5, bottom - 3, 10, 1, color, 0.18),
  ].join("\n");
}

function effectLayer(def, stage, frame, front = false) {
  if (stage < 4 || !def.effect) return "";

  const effect = def.effect;
  const palette = def.palette;
  const { left, top, bottom, centerX } = frame;
  const a = palette.accent;
  const p = palette.primary;
  const d = palette.dark;

  const behind = [];
  const foreground = [];
  let burstColor = a;

  switch (effect) {
    case "flame":
    case "rage":
    case "black_flame": {
      const fire = effect === "black_flame" ? "#7e22ce" : effect === "rage" ? "#ef4444" : "#fb923c";
      const core = effect === "black_flame" ? "#18181b" : "#fde047";
      burstColor = fire;
      const side = [
        rect(left + 1, bottom - 9, 2, 8, fire),
        rect(left + 2, bottom - 12, 1, 4, core),
        stage >= 5 ? rect(left, top + 9, 2, 11, fire) : "",
        stage >= 5 ? rect(left + 4, top + 3, 2, 7, core) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? rect(centerX - 1, top + 1, 2, 5, fire, 0.75) : "",
      );
      break;
    }
    case "holy":
    case "light":
    case "rival_light":
    case "guard": {
      const light = effect === "rival_light" ? "#fb7185" : effect === "guard" ? "#60a5fa" : a;
      burstColor = light;
      const side = [
        rect(centerX - 9, top + 1, 2, 1, light, 0.55),
        stage >= 5 ? rect(left + 1, top + 4, 1, bottom - top - 6, light, 0.3) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        rect(centerX - 7, top, 14, 1, light, 0.75),
        symmetricPair(side, centerX),
        sparkleSet(light, stage, frame),
        stage >= 5 ? rect(centerX - 10, top + 3, 20, 1, light, 0.2) : "",
      );
      break;
    }
    case "arcane":
    case "curse":
    case "ritual":
    case "necro": {
      const magic = effect === "necro" ? "#a3e635" : effect === "curse" ? "#c026d3" : effect === "ritual" ? "#e11d48" : a;
      burstColor = magic;
      const side = [
        pixel(left + 3, bottom - 3, magic),
        pixel(left + 6, bottom - 1, magic),
        stage >= 5 ? rect(left, bottom - 7, 1, 6, magic, 0.55) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        rect(left + 2, bottom - 2, centerX - left - 2, 1, magic, 0.65),
        mirrorRectMarkup(rect(left + 2, bottom - 2, centerX - left - 2, 1, magic, 0.65), centerX),
        rect(left + 4, bottom, centerX - left - 4, 1, magic, 0.35),
        mirrorRectMarkup(rect(left + 4, bottom, centerX - left - 4, 1, magic, 0.35), centerX),
        symmetricPair(side, centerX),
        stage >= 5 ? rect(centerX - 9, bottom - 4, 18, 1, magic, 0.25) : "",
        stage >= 5 ? sparkleSet(magic, stage, frame) : "",
      );
      break;
    }
    case "wind":
    case "afterimage":
    case "slash": {
      const wind = effect === "afterimage" ? "#a78bfa" : effect === "slash" ? "#38bdf8" : "#bef264";
      burstColor = wind;
      const side = [
        rect(left, top + 7, 9, 1, wind, 0.5),
        rect(left + 2, top + 10, 8, 1, wind, 0.35),
        stage >= 5 ? rect(left, top + 4, 13, 1, wind, 0.45) : "",
        stage >= 5 ? rect(left + 3, top + 14, 7, 1, wind, 0.25) : "",
      ].filter(Boolean).join("\n");
      behind.push(symmetricPair(side, centerX));
      break;
    }
    case "coin":
    case "dark_gold": {
      const coin = "#facc15";
      burstColor = coin;
      const side = [
        rect(left + 1, top + 4, 2, 2, coin),
        rect(left + 2, bottom - 6, 2, 2, coin),
        stage >= 5 ? rect(left + 5, top + 11, 2, 2, coin, 0.8) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? rect(centerX - 1, top, 2, 2, coin) : "",
        stage >= 5 ? sparkleSet(coin, stage, frame) : "",
      );
      break;
    }
    case "music": {
      const upperNote = [
        rect(left + 1, top + 6, 1, 5, a),
        rect(left + 2, top + 6, 3, 1, a),
        rect(left + 4, top + 10, 2, 2, a),
      ].join("\n");
      behind.push(symmetricPair(upperNote, centerX));
      if (stage >= 5) {
        const lowerNote = [
          rect(left + 1, bottom - 8, 1, 5, p),
          rect(left + 2, bottom - 8, 3, 1, p),
          rect(left + 4, bottom - 4, 2, 2, p),
        ].join("\n");
        behind.push(symmetricPair(lowerNote, centerX));
      }
      break;
    }
    case "poison": {
      burstColor = "#84cc16";
      const side = [
        rect(left + 1, bottom - 8, 2, 4, "#84cc16"),
        pixel(left + 2, bottom - 10, "#bef264"),
        stage >= 5 ? rect(left + 4, top + 4, 2, 3, "#84cc16") : "",
        stage >= 5 ? rect(left + 5, bottom - 12, 2, 2, "#65a30d", 0.8) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? centerSparkle(centerX, top + 3, "#bef264", 0.8) : "",
      );
      break;
    }
    case "ki": {
      burstColor = "#fde047";
      const side = [
        rect(left + 1, top + 6, 1, bottom - top - 10, "#fde047", 0.5),
        stage >= 5 ? rect(left, top + 9, 1, 9, "#facc15", 0.35) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        sparkleSet("#fde047", stage, frame),
        stage >= 5 ? rect(centerX - 4, top + 1, 8, 1, "#fde047", 0.5) : "",
      );
      break;
    }
    case "mechanical":
    case "synthetic": {
      const spark = effect === "synthetic" ? "#67e8f9" : a;
      burstColor = spark;
      const side = [
        pixel(left + 1, top + 6, spark),
        pixel(left + 3, top + 4, spark),
        rect(left, top + 12, 3, 1, spark),
        stage >= 5 ? rect(left + 3, bottom - 3, 5, 1, spark, 0.3) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? sparkleSet(spark, stage, frame) : "",
      );
      break;
    }
    case "command": {
      const side = [
        rect(left, top + 4, 1, bottom - top - 6, d),
        rect(left + 1, top + 4, 6, 5, p),
        stage >= 5 ? rect(left - 1, top + 2, 1, bottom - top - 2, a, 0.4) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? rect(centerX - 3, top, 6, 1, a, 0.45) : "",
      );
      break;
    }
    case "trap": {
      const side = [
        rect(left, bottom - 3, 7, 1, a),
        pixel(left + 1, bottom - 4, a),
        pixel(left + 5, bottom - 4, a),
        stage >= 5 ? rect(left, bottom - 11, 1, 8, a, 0.45) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? rect(centerX - 8, bottom - 1, 16, 1, a, 0.3) : "",
      );
      break;
    }
    case "control": {
      const side = [
        rect(centerX - 6, top - 1, 1, 7, a, 0.7),
        rect(centerX - 3, top, 1, 6, a, 0.5),
        stage >= 5 ? rect(left + 2, top + 1, 1, bottom - top - 4, a, 0.3) : "",
      ].filter(Boolean).join("\n");
      behind.push(
        symmetricPair(side, centerX),
        stage >= 5 ? rect(centerX - 10, top + 3, 20, 1, a, 0.2) : "",
      );
      break;
    }
    case "dust": {
      burstColor = "#a16207";
      const side = [
        rect(left, bottom - 3, 4, 2, "#a16207", 0.5),
        stage >= 5 ? rect(left + 3, bottom - 6, 3, 1, "#ca8a04", 0.35) : "",
        stage >= 5 ? pixel(left + 5, bottom - 9, "#eab308", 0.45) : "",
      ].filter(Boolean).join("\n");
      behind.push(symmetricPair(side, centerX));
      break;
    }
    case "nature":
    case "stars": {
      const sparkle = effect === "nature" ? "#86efac" : a;
      burstColor = sparkle;
      behind.push(sparkleSet(sparkle, stage, frame));
      if (stage >= 5) {
        const side = rect(left + 1, bottom - 5, 4, 1, sparkle, 0.35);
        behind.push(
          symmetricPair(side, centerX),
          rect(centerX - 1, top + 5, 2, 2, sparkle, 0.55),
        );
      }
      break;
    }
  }

  if (stage >= 5) {
    behind.push(finalEvolutionBurst(burstColor, frame));
  }

  if (front) {
    if (stage >= 5) {
      switch (effect) {
        case "flame":
        case "black_flame":
        case "rage": {
          const side = [
            pixel(centerX - 4, top + 7, burstColor),
            rect(centerX - 8, bottom - 9, 1, 4, burstColor, 0.55),
          ].join("\n");
          foreground.push(symmetricPair(side, centerX));
          break;
        }
        case "wind":
        case "afterimage":
        case "slash": {
          const side = rect(centerX - 9, top + 10, 5, 1, burstColor, 0.45);
          foreground.push(symmetricPair(side, centerX));
          break;
        }
        default: {
          const side = pixel(centerX - 6, top + 8, burstColor, 0.8);
          foreground.push(symmetricPair(side, centerX));
        }
      }
    }
    return foreground.join("\n");
  }

  return behind.filter(Boolean).join("\n");
}

function drawHeadgear(type, palette, stage) {
  if (stage < 2 || !type) return "";
  const p = palette.primary;
  const s = palette.secondary;
  const a = palette.accent;
  const d = palette.dark;

  switch (type) {
    case "helmet":
      return [rect(11, 6, 10, 3, s), rect(10, 8, 12, 2, p), rect(10, 10, 2, 3, d), rect(20, 10, 2, 3, d), stage >= 4 ? rect(15, 4, 2, 3, a) : ""].join("\n");
    case "horned_helmet":
      return [rect(11, 6, 10, 4, s), rect(9, 5, 2, 4, a), rect(21, 5, 2, 4, a), stage >= 4 ? rect(14, 4, 4, 2, p) : ""].join("\n");
    case "wizard_hat":
      return [
        rect(9, 9, 14, 2, p),
        rect(12, 5, 8, 4, s),
        rect(14, 2, 4, 3, p),
        stage >= 4 ? symmetricPair(star(9, 5, a)) : "",
      ].join("\n");
    case "hood":
      return [rect(10, 6, 12, 4, p), rect(9, 9, 3, 6, s), rect(20, 9, 3, 6, s), stage >= 4 ? rect(15, 5, 2, 2, a) : ""].join("\n");
    case "circlet":
      return [rect(11, 8, 10, 1, a), rect(15, 7, 2, 1, p), stage >= 4 ? rect(14, 5, 4, 2, a) : ""].join("\n");
    case "feather_cap":
      return [
        rect(10, 7, 12, 3, p),
        symmetricPair(rect(10, 4, 2, 4, a)),
        symmetricPair(rect(8, 3, 2, 3, a)),
        stage >= 4 ? symmetricPair(rect(9, 6, 4, 1, s)) : "",
      ].join("\n");
    case "headband":
      return [
        rect(10, 8, 12, 1, a),
        symmetricPair(rect(7, 9, 4, 1, a)),
        stage >= 4 ? symmetricPair(rect(6, 10, 2, 1, a)) : "",
      ].join("\n");
    case "merchant_hat":
    case "wide_hat":
      return [rect(8, 8, 16, 2, s), rect(11, 5, 10, 3, p), stage >= 4 ? rect(14, 4, 4, 1, a) : ""].join("\n");
    case "top_hat":
      return [rect(9, 8, 14, 2, d), rect(12, 3, 8, 5, p), rect(11, 6, 10, 2, a), stage >= 4 ? rect(15, 2, 2, 1, a) : ""].join("\n");
    case "bandana":
      return [
        rect(10, 8, 12, 2, p),
        symmetricPair(rect(7, 9, 4, 1, p)),
        stage >= 4 ? symmetricPair(rect(6, 10, 2, 2, a)) : "",
      ].join("\n");
    case "mask":
      return [rect(10, 10, 12, 3, d), rect(12, 11, 2, 1, a), rect(18, 11, 2, 1, a), stage >= 4 ? rect(15, 6, 2, 3, p) : ""].join("\n");
    case "mitre":
      return [
        rect(11, 5, 10, 5, p),
        rect(13, 2, 6, 3, s),
        rect(15, 3, 2, 5, a),
        stage >= 4 ? symmetricPair(star(10, 4, a)) : "",
      ].join("\n");
    case "visor":
      return [rect(10, 8, 12, 3, s), rect(11, 10, 10, 1, a), stage >= 4 ? rect(14, 5, 4, 3, p) : ""].join("\n");
    case "plumed_helmet":
      return [
        rect(10, 7, 12, 4, s),
        rect(15, 2, 2, 5, a),
        symmetricPair(rect(13, 3, 2, 4, a)),
        stage >= 4 ? rect(13, 5, 6, 2, p) : "",
      ].join("\n");
    default:
      return "";
  }
}

function drawWeapon(type, palette, stage, side = "right") {
  if (!type || type === "none") return "";
  const flip = side === "left";
  const x = flip ? 4 : 24;
  const p = palette.primary;
  const s = palette.secondary;
  const a = palette.accent;
  const d = palette.dark;
  const metal = "#e2e8f0";
  const wood = "#854d0e";
  const lengthBonus = stage >= 3 ? 2 : 0;

  switch (type) {
    case "sword":
    case "cursed_sword":
    case "command_sword":
    case "energy_blade": {
      const blade = type === "cursed_sword" ? "#7e22ce" : type === "energy_blade" ? "#22d3ee" : type === "command_sword" ? a : metal;
      return [rect(x, 12 - lengthBonus, 2, 10 + lengthBonus, blade), rect(x - 1, 21, 4, 1, a), rect(x, 22, 2, 4, d), stage >= 5 ? rect(x, 7, 2, 4, blade, 0.65) : ""].join("\n");
    }
    case "axe":
    case "great_axe":
      return [rect(x, 10 - lengthBonus, 1, 16 + lengthBonus, wood), rect(flip ? x - 3 : x, 9 - lengthBonus, 4, type === "great_axe" ? 5 : 4, metal), stage >= 5 ? rect(flip ? x - 4 : x + 1, 8, 2, 2, a) : ""].join("\n");
    case "staff":
    case "dark_staff":
    case "crooked_staff":
      return [rect(x, 9 - lengthBonus, 1, 18 + lengthBonus, wood), rect(x - 1, 7 - lengthBonus, 3, 3, type === "dark_staff" ? "#c026d3" : type === "crooked_staff" ? "#a3e635" : a), stage >= 4 ? star(x, 5, a) : ""].join("\n");
    case "mace":
      return [rect(x, 13, 1, 13, wood), rect(x - 1, 10, 3, 4, metal), stage >= 4 ? rect(x - 2, 9, 5, 1, a) : ""].join("\n");
    case "dual_daggers":
      return [
        symmetricPair(rect(4, 16, 2, 7, metal)),
        symmetricPair(rect(3, 22, 4, 1, a)),
        stage >= 5 ? symmetricPair(rect(2, 13, 1, 5, a, 0.6)) : "",
      ].join("\n");
    case "bow":
      return [rect(x, 9, 1, 16, wood), rect(flip ? x - 2 : x + 1, 10, 1, 14, a), pixel(flip ? x - 1 : x + 1, 9, a), pixel(flip ? x - 1 : x + 1, 24, a), stage >= 4 ? rect(x, 7, 1, 3, p) : ""].join("\n");
    case "gauntlets":
      return [
        symmetricPair(rect(4, 17, 4, 5, p)),
        symmetricPair(rect(5, 18, 2, 2, a)),
        stage >= 5 ? symmetricPair(rect(3, 15, 2, 2, a, 0.7)) : "",
      ].join("\n");
    case "coin_staff":
    case "gold_cane":
      return [rect(x, 11, 1, 16, wood), rect(x - 1, 9, 3, 3, "#facc15"), stage >= 4 ? rect(x - 2, 8, 5, 1, a) : ""].join("\n");
    case "lute":
      return [rect(23, 15, 5, 8, wood), rect(25, 10, 1, 7, wood), rect(24, 17, 3, 3, a), stage >= 4 ? pixel(28, 13, a) : ""].join("\n");
    case "club":
      return [rect(x, 11, 2, 15, wood), rect(x - 1, 9, 4, 5, "#57534e"), stage >= 4 ? rect(x - 2, 8, 1, 2, metal) : ""].join("\n");
    case "spear":
      return [rect(x, 8, 1, 20, wood), rect(x - 1, 5, 3, 4, metal), stage >= 4 ? rect(x, 3, 1, 3, a) : ""].join("\n");
    case "crossbow":
      return [rect(22, 16, 7, 2, wood), rect(25, 12, 1, 9, metal), rect(22, 14, 7, 1, a), stage >= 4 ? pixel(29, 16, a) : ""].join("\n");
    case "ritual_dagger":
      return [rect(x, 15, 2, 8, "#e11d48"), rect(x - 1, 22, 4, 1, d), stage >= 4 ? star(x, 12, a) : ""].join("\n");
    case "katana":
      return [rect(x, 10 - lengthBonus, 1, 15 + lengthBonus, metal), rect(x - 1, 23, 3, 1, a), stage >= 5 ? rect(x + (flip ? -2 : 2), 8, 1, 10, a, 0.35) : ""].join("\n");
    default:
      return [rect(x, 12, 1, 14, s), rect(x - 1, 10, 3, 3, a)].join("\n");
  }
}

function drawOffhand(type, palette, stage) {
  if (!type || type === "none") return "";
  const p = palette.primary;
  const s = palette.secondary;
  const a = palette.accent;
  const d = palette.dark;

  switch (type) {
    case "shield":
    case "dark_shield":
      return [rect(3, 15, 5, 9, type === "dark_shield" ? d : s), rect(4, 16, 3, 6, type === "dark_shield" ? "#7e22ce" : p), stage >= 4 ? rect(5, 17, 1, 4, a) : ""].join("\n");
    case "orb":
    case "core":
      return [
        rect(4, 17, 4, 4, a),
        rect(5, 18, 2, 2, "#f8fafc"),
        localSparkles(6, 19, a, stage),
      ].join("\n");
    case "holy_book":
    case "dark_book":
      return [rect(3, 17, 5, 6, type === "dark_book" ? d : p), rect(5, 18, 1, 4, a)].join("\n");
    case "quiver":
      return [rect(5, 12, 3, 10, s), rect(5, 9, 1, 5, a), rect(7, 9, 1, 5, a)].join("\n");
    case "bag":
    case "money_bag":
      return [rect(3, 18, 6, 6, type === "money_bag" ? "#ca8a04" : s), rect(5, 17, 2, 1, a), stage >= 4 ? pixel(6, 20, "#facc15") : ""].join("\n");
    case "dagger":
      return drawWeapon("sword", palette, 1, "left");
    case "poison_vial":
      return [rect(4, 18, 3, 5, "#84cc16"), rect(5, 16, 1, 2, "#e2e8f0")].join("\n");
    case "skull":
      return [rect(3, 17, 5, 5, "#e5e7eb"), pixel(4, 19, d), pixel(6, 19, d), rect(4, 22, 3, 1, "#e5e7eb")].join("\n");
    case "trap":
      return [rect(3, 21, 6, 2, s), pixel(4, 20, a), pixel(7, 20, a)].join("\n");
    case "talisman":
      return [rect(4, 16, 4, 7, p), rect(5, 17, 2, 4, a)].join("\n");
    case "scabbard":
      return [rect(4, 11, 1, 15, d), rect(3, 11, 3, 1, a)].join("\n");
    case "banner":
      return [rect(3, 6, 1, 21, d), rect(4, 7, 7, 7, p), rect(6, 9, 3, 3, a)].join("\n");
    default:
      return "";
  }
}

function humanBody(def, stage) {
  const { palette } = def;
  const skin = palette.skin ?? "#efc39c";
  const hair = palette.hair ?? "#713f12";
  const p = palette.primary;
  const s = palette.secondary;
  const a = palette.accent;
  const d = palette.dark;

  const layers = [];

  if (def.cape && stage >= 2) {
    layers.push(rect(9, 14, 14, 11, s), rect(8, 17, 2, 7, s), rect(22, 17, 2, 7, s));
  }

  layers.push(rect(11, 23, 4, 5, d), rect(17, 23, 4, 5, d));
  layers.push(rect(10, 27, 5, 2, s), rect(17, 27, 5, 2, s));

  layers.push(rect(10, 14, 12, 10, p));
  layers.push(rect(9, 16, 3, 7, p), rect(20, 16, 3, 7, p));
  layers.push(rect(8, 21, 3, 3, skin), rect(21, 21, 3, 3, skin));

  if (stage >= 2) {
    layers.push(rect(10, 20, 12, 2, s), rect(15, 20, 2, 2, a));
  }
  if (stage >= 3) {
    layers.push(
      rect(8, 14, 5, 3, s),
      rect(19, 14, 5, 3, s),
      rect(8, 17, 2, 5, s),
      rect(22, 17, 2, 5, s),
      rect(14, 17, 4, 2, a),
      rect(11, 25, 4, 1, a),
      rect(17, 25, 4, 1, a),
    );
  }
  if (stage >= 4) {
    layers.push(
      rect(12, 15, 8, 6, s),
      rect(15, 16, 2, 4, a),
      rect(9, 13, 4, 2, a),
      rect(19, 13, 4, 2, a),
    );
  }
  if (stage >= 5) {
    layers.push(
      rect(10, 13, 12, 1, a),
      rect(14, 12, 4, 1, a),
      rect(7, 15, 2, 5, a, 0.8),
      rect(23, 15, 2, 5, a, 0.8),
      rect(12, 22, 8, 1, a),
    );
    if (def.cape) {
      layers.push(
        rect(7, 19, 2, 7, s),
        rect(23, 19, 2, 7, s),
        rect(9, 25, 3, 2, a, 0.7),
        rect(20, 25, 3, 2, a, 0.7),
      );
    }
  }

  layers.push(rect(11, 7, 10, 7, skin));
  layers.push(rect(10, 8, 2, 5, hair), rect(20, 8, 2, 5, hair), rect(12, 6, 8, 2, hair));
  layers.push(pixel(13, 10, def.category === "enemy" ? "#ef4444" : "#0f172a"), pixel(18, 10, def.category === "enemy" ? "#ef4444" : "#0f172a"));
  layers.push(rect(15, 12, 2, 1, "#7c2d12"));

  return layers.join("\n");
}

function coordinateOptions(def, options = {}) {
  return {
    debugCoordinates:
      options.debugCoordinates ?? def.debugCoordinates ?? false,
    includeCoordinateMetadata:
      options.includeCoordinateMetadata ??
      options.debugCoordinates ??
      def.debugCoordinates ??
      false,
  };
}

function composeCharacter(def, stage, coreLayers, options = {}) {
  const model = createCoordinateModel(def, stage, coreLayers);
  const layers = [
    layer("effect-behind", effectLayer(def, stage, model.frame, false)),
    ...coreLayers,
    layer("effect-front", effectLayer(def, stage, model.frame, true)),
  ].filter((entry) => entry.markup);
  const diagnostics = analyzeCoordinates(def, stage, layers, model);
  const normalizedOptions = coordinateOptions(def, options);
  const svg = spriteSvg(`${def.name} Lv.${stage}`, layers, {
    coordinateMetadata: normalizedOptions.includeCoordinateMetadata
      ? diagnostics
      : null,
    debugLayer: normalizedOptions.debugCoordinates
      ? coordinateDebugLayer(model, diagnostics)
      : "",
  });

  return { svg, diagnostics, model };
}

function renderHumanBundle(def, stage, options = {}) {
  const coreLayers = [
    layer("shadow", shadow()),
    layer("body", humanBody(def, stage)),
    layer("headgear", drawHeadgear(def.headgear, def.palette, stage)),
    layer("offhand", drawOffhand(def.offhand, def.palette, stage)),
    layer("weapon", drawWeapon(def.weapon, def.palette, stage, "right")),
  ];
  return composeCharacter(def, stage, coreLayers, options);
}

export function renderHuman(def, stage, options = {}) {
  return renderHumanBundle(def, stage, options).svg;
}

function plantBody(def, stage) {
  const p = def.palette.primary;
  const s = def.palette.secondary;
  const a = def.palette.accent;
  const centerX = DEFAULT_SYMMETRY_AXIS_X;
  const paired = (markup) => symmetricPair(markup, centerX);

  return [
    rect(15, 8, 2, 8, s),
    paired(rect(10, 11, 4, 2, p)),
    stage >= 2 ? paired(rect(7, 14, 5, 2, p)) : "",
    stage >= 3 ? paired(rect(6, 10, 3, 8, s)) : "",
    stage >= 3 ? paired(rect(5, 9, 3, 2, p)) : "",
    stage >= 4 ? rect(13, 6, 6, 3, "#f9a8d4") : "",
    stage >= 4 ? paired(rect(13, 5, 2, 2, a)) : "",
    stage >= 5 ? paired(rect(8, 3, 4, 4, a)) : "",
    stage >= 5 ? paired(rect(4, 15, 4, 2, p)) : "",
    stage >= 5 ? paired(rect(7, 17, 3, 7, s)) : "",
    rect(9, 15, 14, 10, p),
    rect(11, 13, 10, 3, p),
    stage >= 3 ? rect(12, 16, 8, 2, s) : "",
    stage >= 3 ? rect(15, 16, 2, 3, a) : "",
    stage >= 4 ? rect(10, 18, 12, 2, s) : "",
    stage >= 5 ? paired(rect(8, 20, 2, 4, a, 0.75)) : "",
    paired(rect(11, 24, 4, 3, s)),
    stage >= 3 ? paired(rect(10, 27, 5, 1, a)) : "",
    paired(pixel(13, 19, "#052e16")),
    rect(14, 22, 4, 1, "#166534"),
  ].filter(Boolean).join("\n");
}

function renderPlantBundle(def, stage, options = {}) {
  return composeCharacter(
    def,
    stage,
    [layer("shadow", shadow()), layer("body", plantBody(def, stage))],
    options,
  );
}

export function renderPlant(def, stage, options = {}) {
  return renderPlantBundle(def, stage, options).svg;
}

function slimeBody(def, stage) {
  const p = def.palette.primary;
  const s = def.palette.secondary;
  const a = def.palette.accent;
  return [
    stage >= 2 ? rect(10, 9, 3, 4, s) : "",
    stage >= 2 ? rect(19, 9, 3, 4, s) : "",
    stage >= 3 ? rect(4, 17, 4, 5, s) : "",
    stage >= 3 ? rect(24, 17, 4, 5, s) : "",
    stage >= 3 ? rect(5, 15, 3, 3, p) : "",
    stage >= 3 ? rect(24, 15, 3, 3, p) : "",
    stage >= 4 ? rect(11, 6, 10, 3, a) : "",
    stage >= 4 ? rect(13, 4, 2, 3, a) : "",
    stage >= 4 ? rect(17, 4, 2, 3, a) : "",
    stage >= 5 ? rect(8, 7, 3, 5, a) : "",
    stage >= 5 ? rect(21, 7, 3, 5, a) : "",
    stage >= 5 ? rect(6, 12, 3, 4, s) : "",
    stage >= 5 ? rect(23, 12, 3, 4, s) : "",
    rect(7, 14, 18, 11, p),
    rect(9, 11, 14, 5, p),
    rect(6, 20, 20, 5, p),
    stage >= 3 ? rect(13, 15, 6, 2, a) : "",
    stage >= 4 ? rect(14, 18, 4, 3, s) : "",
    stage >= 5 ? rect(8, 22, 4, 2, a, 0.8) : "",
    stage >= 5 ? rect(20, 22, 4, 2, a, 0.8) : "",
    pixel(12, 18, stage >= 5 ? a : "#0f172a"),
    pixel(19, 18, stage >= 5 ? a : "#0f172a"),
    rect(14, 21, 4, 1, s),
    stage >= 3 ? rect(8, 23, 16, 2, "#ef4444") : "",
    stage >= 5 ? pixel(10, 13, a) : "",
    stage >= 5 ? pixel(21, 13, a) : "",
  ].filter(Boolean).join("\n");
}

function renderSlimeBundle(def, stage, options = {}) {
  return composeCharacter(
    def,
    stage,
    [layer("shadow", shadow()), layer("body", slimeBody(def, stage))],
    options,
  );
}

export function renderSlime(def, stage, options = {}) {
  return renderSlimeBundle(def, stage, options).svg;
}

function robotBody(def, stage) {
  const p = def.palette.primary;
  const s = def.palette.secondary;
  const a = def.palette.accent;
  const d = def.palette.dark;
  return [
    stage >= 5 ? rect(3, 11, 6, 13, "#6366f1") : "",
    stage >= 5 ? rect(23, 11, 6, 13, "#6366f1") : "",
    stage >= 5 ? rect(2, 14, 2, 7, a, 0.6) : "",
    stage >= 5 ? rect(28, 14, 2, 7, a, 0.6) : "",
    stage >= 2 ? rect(15, 3, 2, 4, s) : "",
    stage >= 2 ? rect(14, 2, 4, 2, "#f43f5e") : "",
    stage >= 5 ? rect(13, 1, 6, 1, a) : "",
    rect(10, 7, 12, 8, p),
    rect(11, 8, 10, 2, s),
    pixel(13, 11, a),
    pixel(18, 11, a),
    stage >= 3 ? rect(7, 13, 4, 4, a) : "",
    stage >= 3 ? rect(21, 13, 4, 4, a) : "",
    rect(9, 15, 14, 10, p),
    stage >= 3 ? rect(5, 16, 4, 8, s) : "",
    stage >= 3 ? rect(23, 16, 4, 8, s) : "",
    stage >= 3 ? rect(6, 18, 2, 3, a) : "",
    stage >= 3 ? rect(24, 18, 2, 3, a) : "",
    stage >= 4 ? rect(10, 16, 12, 2, "#6366f1") : "",
    stage >= 4 ? rect(12, 19, 8, 5, s) : "",
    rect(14, 18, 4, 4, a),
    stage >= 5 ? rect(13, 17, 6, 6, a, 0.45) : "",
    rect(11, 24, 4, 4, d),
    rect(17, 24, 4, 4, d),
    stage >= 3 ? rect(10, 27, 5, 1, a) : "",
    stage >= 3 ? rect(17, 27, 5, 1, a) : "",
    stage >= 5 ? rect(8, 28, 3, 1, a, 0.7) : "",
    stage >= 5 ? rect(21, 28, 3, 1, a, 0.7) : "",
  ].filter(Boolean).join("\n");
}

function renderRobotBundle(def, stage, options = {}) {
  return composeCharacter(
    def,
    stage,
    [layer("shadow", shadow()), layer("body", robotBody(def, stage))],
    options,
  );
}

export function renderRobot(def, stage, options = {}) {
  return renderRobotBundle(def, stage, options).svg;
}

function renderCharacterBundle(definition, stage, options = {}) {
  if (!Number.isInteger(stage) || stage < 1 || stage > 5) {
    throw new RangeError(`stage must be an integer from 1 to 5: ${stage}`);
  }

  switch (definition.kind) {
    case "plant":
      return renderPlantBundle(definition, stage, options);
    case "slime":
      return renderSlimeBundle(definition, stage, options);
    case "robot":
      return renderRobotBundle(definition, stage, options);
    case "human":
      return renderHumanBundle(definition, stage, options);
    default:
      throw new Error(`Unsupported character kind: ${definition.kind}`);
  }
}

export function inspectCharacterCoordinates(definition, stage) {
  return renderCharacterBundle(definition, stage, {
    debugCoordinates: false,
    includeCoordinateMetadata: false,
  }).diagnostics;
}

export function renderCharacter(definition, stage, options = {}) {
  return renderCharacterBundle(definition, stage, options).svg;
}
