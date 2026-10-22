import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  CATEGORY_LABELS,
  CHARACTER_DEFINITIONS,
  STAGE_DESCRIPTIONS,
} from "./character-definitions.mjs";
import {
  inspectCharacterCoordinates,
  renderCharacter,
} from "./pixel-art.mjs";

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, "public", "characters");
const generatedDirectory = path.join(
  projectRoot,
  "src",
  "lib",
  "characters",
);
const coordinateDebugRoot = path.join(
  projectRoot,
  "public",
  "characters-coordinate-debug",
);
const coordinateReportDirectory = path.join(
  projectRoot,
  "reports",
  "characters",
);

const generateCoordinateDebug =
  process.env.CHARACTER_COORDINATE_DEBUG === "1";
const strictCoordinateCheck =
  process.env.CHARACTER_COORDINATE_STRICT === "1";

function quote(value) {
  return JSON.stringify(value);
}

function toGeneratedTypesSource() {
  const types = CHARACTER_DEFINITIONS.map((definition) => definition.type);
  const categories = Object.keys(CATEGORY_LABELS);

  return `/* このファイルは scripts/generate-character-svgs.mjs により自動生成されます． */

export const CHARACTER_TYPES = ${JSON.stringify(types, null, 2)} as const;

export type CharacterType =
  (typeof CHARACTER_TYPES)[number];

export const CHARACTER_CATEGORIES = ${JSON.stringify(categories, null, 2)} as const;

export type CharacterCategory =
  (typeof CHARACTER_CATEGORIES)[number];
`;
}

function toGeneratedCatalogSource() {
  const entries = CHARACTER_DEFINITIONS.map((definition) => {
    const evolutions = definition.evolutionNames.map((name, index) => ({
      level: index + 1,
      name,
      imagePath: `/characters/${definition.type}/level-${index + 1}.svg`,
      description: STAGE_DESCRIPTIONS[index],
    }));

    return `  ${quote(definition.type)}: {
    type: ${quote(definition.type)},
    category: ${quote(definition.category)},
    name: ${quote(definition.name)},
    description: ${quote(definition.description)},
    evolutions: ${JSON.stringify(evolutions, null, 6).replace(/^/gm, "    ").trimStart()},
  }`;
  });

  return `/* このファイルは scripts/generate-character-svgs.mjs により自動生成されます． */

import type {
  CharacterCategory,
  CharacterType,
} from "@/lib/characters/generated-types";

export type GeneratedEvolutionStage = {
  level: number;
  name: string;
  imagePath: string;
  description: string;
};

export type GeneratedCharacterDefinition = {
  type: CharacterType;
  category: CharacterCategory;
  name: string;
  description: string;
  evolutions: GeneratedEvolutionStage[];
};

export const CATEGORY_LABELS: Record<
  CharacterCategory,
  string
> = ${JSON.stringify(CATEGORY_LABELS, null, 2)};

export const GENERATED_CHARACTER_CATALOG: Record<
  CharacterType,
  GeneratedCharacterDefinition
> = {
${entries.join(",\n")}
};
`;
}

function addEvolutionCoordinateChecks(reports) {
  const grouped = new Map();
  for (const report of reports) {
    const entries = grouped.get(report.characterType) ?? [];
    entries.push(report);
    grouped.set(report.characterType, entries);
  }

  for (const entries of grouped.values()) {
    entries.sort((a, b) => a.stage - b.stage);
    const baselineCenterX = entries[0]?.frame.centerX;

    for (let index = 0; index < entries.length; index += 1) {
      const report = entries[index];
      const previous = entries[index - 1];
      report.evolutionCoordinateCheck = {
        baselineCenterX,
        centerStable: report.frame.centerX === baselineCenterX,
        deltaFromPrevious: previous
          ? {
              left: report.frame.left - previous.frame.left,
              right: report.frame.right - previous.frame.right,
              top: report.frame.top - previous.frame.top,
              bottom: report.frame.bottom - previous.frame.bottom,
              centerX:
                report.frame.centerX - previous.frame.centerX,
            }
          : null,
      };

      if (report.frame.centerX !== baselineCenterX) {
        report.errors.push(
          `evolution: 中心軸がLv.1の${baselineCenterX}から${report.frame.centerX}へ移動しています。`,
        );
      }
      report.errors = [...new Set(report.errors)];
      report.warnings = [...new Set(report.warnings)];
      report.status =
        report.errors.length > 0
          ? "error"
          : report.warnings.length > 0
            ? "warning"
            : "ok";
    }
  }
}

function coordinateReportText(reports) {
  const lines = [
    "Character SVG coordinate report",
    `grid: 32 x 32 / records: ${reports.length}`,
    "",
  ];

  for (const report of reports) {
    lines.push(
      `[${report.status.toUpperCase()}] ${report.characterType} Lv.${report.stage} (${report.kind}/${report.effect ?? "no-effect"})`,
      `  frame: left=${report.frame.left}, right=${report.frame.right}, top=${report.frame.top}, bottom=${report.frame.bottom}, centerX=${report.frame.centerX}`,
      `  body: ${JSON.stringify(report.bodyBounds)}`,
      `  silhouette: ${JSON.stringify(report.silhouetteBounds)}`,
      `  effect: ${JSON.stringify(report.effectBounds)}`,
      `  effectCenterDeltaX: ${report.effectCenterDeltaX}`,
      `  symmetryMode: ${report.symmetryMode}`,
      `  symmetryChecks: ${JSON.stringify(report.symmetryChecks)}`,
      `  evolutionCheck: ${JSON.stringify(report.evolutionCoordinateCheck)}`,
    );
    for (const warning of report.warnings) {
      lines.push(`  WARNING: ${warning}`);
    }
    for (const error of report.errors) {
      lines.push(`  ERROR: ${error}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function symmetryReportText(reports) {
  const lines = [
    "Character SVG symmetry report",
    `axis: x=16 / records: ${reports.length}`,
    "",
  ];

  for (const report of reports) {
    const checks = Object.entries(report.symmetryChecks ?? {});
    const failures = checks.filter(([, check]) => !check.symmetric);
    lines.push(
      `[${failures.length === 0 ? "OK" : "ERROR"}] ${report.characterType} Lv.${report.stage}`,
    );
    for (const [layerName, check] of checks) {
      lines.push(
        `  ${layerName}: ${check.symmetric ? "symmetric" : `unmatched=${check.unmatchedCount}`}`,
      );
    }
    if (failures.length > 0) {
      for (const [layerName, check] of failures) {
        lines.push(
          `  DETAIL ${layerName}: ${JSON.stringify(check.unmatched)}`,
        );
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function writeCoordinateReports(reports) {
  await mkdir(coordinateReportDirectory, { recursive: true });
  await writeFile(
    path.join(coordinateReportDirectory, "coordinate-report.json"),
    `${JSON.stringify(reports, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(coordinateReportDirectory, "coordinate-report.txt"),
    coordinateReportText(reports),
    "utf8",
  );
  await writeFile(
    path.join(coordinateReportDirectory, "symmetry-report.txt"),
    symmetryReportText(reports),
    "utf8",
  );
}

async function generateSvgFiles() {
  await mkdir(outputRoot, { recursive: true });
  if (generateCoordinateDebug) {
    await rm(coordinateDebugRoot, {
      recursive: true,
      force: true,
    });
    await mkdir(coordinateDebugRoot, { recursive: true });
  }

  const coordinateReports = [];

  for (const definition of CHARACTER_DEFINITIONS) {
    const characterDirectory = path.join(outputRoot, definition.type);
    const debugCharacterDirectory = path.join(
      coordinateDebugRoot,
      definition.type,
    );

    await rm(characterDirectory, {
      recursive: true,
      force: true,
    });
    await mkdir(characterDirectory, {
      recursive: true,
    });
    if (generateCoordinateDebug) {
      await mkdir(debugCharacterDirectory, {
        recursive: true,
      });
    }

    for (let stage = 1; stage <= 5; stage += 1) {
      const coordinateReport = inspectCharacterCoordinates(
        definition,
        stage,
      );
      coordinateReports.push(coordinateReport);

      const svg = renderCharacter(definition, stage);
      const outputPath = path.join(
        characterDirectory,
        `level-${stage}.svg`,
      );
      await writeFile(outputPath, svg, "utf8");

      if (generateCoordinateDebug) {
        const debugSvg = renderCharacter(definition, stage, {
          debugCoordinates: true,
          includeCoordinateMetadata: true,
        });
        await writeFile(
          path.join(
            debugCharacterDirectory,
            `level-${stage}.svg`,
          ),
          debugSvg,
          "utf8",
        );
      }
    }
  }

  addEvolutionCoordinateChecks(coordinateReports);
  await writeCoordinateReports(coordinateReports);

  const errors = coordinateReports.flatMap((report) =>
    report.errors.map((message) => ({ report, message })),
  );
  const warnings = coordinateReports.flatMap((report) =>
    report.warnings.map((message) => ({ report, message })),
  );

  const symmetryFailures = coordinateReports.flatMap((report) =>
    Object.entries(report.symmetryChecks ?? {})
      .filter(([, check]) => !check.symmetric)
      .map(([layerName, check]) => ({ report, layerName, check })),
  );

  console.log(
    `座標・左右対称確認: ${coordinateReports.length}件 / ` +
      `エラー ${errors.length}件 / 警告 ${warnings.length}件 / ` +
      `非対称レイヤー ${symmetryFailures.length}件`,
  );
  console.log(
    "reports/characters/coordinate-report.json、coordinate-report.txt、symmetry-report.txt を出力しました．",
  );
  if (generateCoordinateDebug) {
    console.log(
      "座標グリッド付きSVGを public/characters-coordinate-debug に出力しました．",
    );
  }

  if (strictCoordinateCheck && errors.length > 0) {
    const sample = errors
      .slice(0, 8)
      .map(
        ({ report, message }) =>
          `${report.characterType} Lv.${report.stage}: ${message}`,
      )
      .join("\n");
    throw new Error(
      `座標エラーが ${errors.length}件あります．\n${sample}`,
    );
  }

  return coordinateReports;
}

async function generateTypeScriptFiles() {
  await mkdir(generatedDirectory, {
    recursive: true,
  });

  await writeFile(
    path.join(generatedDirectory, "generated-types.ts"),
    toGeneratedTypesSource(),
    "utf8",
  );

  await writeFile(
    path.join(generatedDirectory, "generated-catalog.ts"),
    toGeneratedCatalogSource(),
    "utf8",
  );
}

await generateSvgFiles();
await generateTypeScriptFiles();

const characterCount = CHARACTER_DEFINITIONS.length;
const imageCount = characterCount * 5;

console.log(
  `${characterCount}種類 × 5段階 = ${imageCount}枚のドット絵SVGを生成しました．`,
);
console.log(
  "generated-types.ts と generated-catalog.ts も更新しました．",
);
