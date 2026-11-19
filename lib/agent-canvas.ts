import {
  createShapeId,
  toRichText,
  type Editor,
  type TLShape,
  type TLShapeId,
  type TLShapePartial,
  type VecModel,
  type TLDefaultColorStyle,
} from "tldraw";
import { TABLE_WIDTH, getTableHeight, newRow, rowAnchorY, type EntityRow, type EntityTableShape } from "@/components/EntityTable/EntityTableShape";
import { canvasToolDefs, fail, normalizeModelText, ok, type ToolResult } from "@/lib/agent-tools";

// Maps the model's caller-assigned ids ("rect-1") to real tldraw ids, so later calls in the same
// chat can reference shapes it just created. Pre-existing shapes are referenced by their real ids.
export type ShapeIdMap = Map<string, TLShapeId>;

// Compact state sent with every request, so the model only references shapes that exist.
export function summarizeCanvas(editor: Editor) {
  const shapes = editor.getCurrentPageShapes();
  if (shapes.length === 0) return "(empty canvas)";
  return shapes.map(summarizeShape).join("\n");
}

function summarizeShape(shape: TLShape) {
  const base = `- id: ${shape.id}, type: ${shape.type}, position: (${Math.round(shape.x)}, ${Math.round(shape.y)})`;
  if (shape.type === "entity-table") {
    const { tableName, rows } = (shape as EntityTableShape).props;
    const columns = rows.map((r) => `${r.name}:${r.dataType}${r.isPK ? " PK" : ""}${r.isFK ? " FK" : ""}`);
    return `${base}, table: "${tableName}", columns: [${columns.join(", ")}]`;
  }
  const text = "richText" in shape.props ? plainText(shape.props.richText) : "";
  return text ? `${base}, label: "${text}"` : base;
}

// tldraw's richText is a small ProseMirror JSON doc; the agent only needs its text.
function plainText(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  const { text, content } = node as { text?: string; content?: unknown[] };
  return [text ?? "", ...(content ?? []).map(plainText)].filter(Boolean).join(" ");
}

const richText = (text: string) => toRichText(normalizeModelText(text));

function resolveNewId(idMap: ShapeIdMap, callerId: string) {
  const id = idMap.get(callerId) ?? createShapeId();
  idMap.set(callerId, id);
  return id;
}

function lookupShape(editor: Editor, idMap: ShapeIdMap, id: string) {
  return editor.getShape(idMap.get(id) ?? (id as TLShapeId));
}

function lookupTable(editor: Editor, idMap: ShapeIdMap, id: string) {
  const shape = lookupShape(editor, idMap, id);
  return shape?.type === "entity-table" ? (shape as EntityTableShape) : undefined;
}

// Where an arrow should attach on a table: the vertical center of the named column's row.
function rowAnchor(table: EntityTableShape, columnName: string, isSource: boolean): VecModel {
  const index = table.props.rows.findIndex((r) => r.name === columnName);
  const y = index === -1 ? 0.5 : rowAnchorY(index, table.props.rows.length);
  return { x: isSource ? 1.0 : 0.0, y };
}

interface BoundsLike {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  w: number;
  h: number;
  center: { x: number; y: number };
}

function computeSmartPorts(
  fromBounds: BoundsLike,
  toBounds: BoundsLike,
  fromAnchorOverride?: VecModel,
  toAnchorOverride?: VecModel
) {
  const dx = toBounds.center.x - fromBounds.center.x;
  const dy = toBounds.center.y - fromBounds.center.y;

  let fromAnchor: VecModel;
  let toAnchor: VecModel;
  let start: { x: number; y: number };
  let end: { x: number; y: number };

  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontal flow (dominant in architecture diagrams)
    if (dx >= 0) {
      fromAnchor = fromAnchorOverride ?? { x: 1.0, y: 0.5 };
      toAnchor = toAnchorOverride ?? { x: 0.0, y: 0.5 };
      start = { x: fromBounds.maxX, y: fromBounds.minY + fromBounds.h * fromAnchor.y };
      end = { x: toBounds.minX, y: toBounds.minY + toBounds.h * toAnchor.y };
    } else {
      fromAnchor = fromAnchorOverride ?? { x: 0.0, y: 0.5 };
      toAnchor = toAnchorOverride ?? { x: 1.0, y: 0.5 };
      start = { x: fromBounds.minX, y: fromBounds.minY + fromBounds.h * fromAnchor.y };
      end = { x: toBounds.maxX, y: toBounds.minY + toBounds.h * toAnchor.y };
    }
  } else {
    // Vertical flow
    if (dy >= 0) {
      fromAnchor = fromAnchorOverride ?? { x: 0.5, y: 1.0 };
      toAnchor = toAnchorOverride ?? { x: 0.5, y: 0.0 };
      start = { x: fromBounds.minX + fromBounds.w * fromAnchor.x, y: fromBounds.maxY };
      end = { x: toBounds.minX + toBounds.w * toAnchor.x, y: toBounds.minY };
    } else {
      fromAnchor = fromAnchorOverride ?? { x: 0.5, y: 0.0 };
      toAnchor = toAnchorOverride ?? { x: 0.5, y: 1.0 };
      start = { x: fromBounds.minX + fromBounds.w * fromAnchor.x, y: fromBounds.minY };
      end = { x: toBounds.minX + toBounds.w * toAnchor.x, y: toBounds.maxY };
    }
  }

  return { start, end, fromAnchor, toAnchor };
}

function createArrowBetween(
  editor: Editor,
  arrowId: TLShapeId,
  from: { id: TLShapeId; anchor?: VecModel },
  to: { id: TLShapeId; anchor?: VecModel },
  label?: string,
  color?: TLDefaultColorStyle
) {
  const fromBounds = editor.getShapePageBounds(from.id);
  const toBounds = editor.getShapePageBounds(to.id);
  if (!fromBounds || !toBounds) return fail("Could not resolve shape bounds");

  const cleanLabel = label && label.length > 24 ? `${label.slice(0, 22)}…` : label;
  const { start, end, fromAnchor, toAnchor } = computeSmartPorts(fromBounds, toBounds, from.anchor, to.anchor);

  editor.createShape({
    id: arrowId,
    type: "arrow",
    props: {
      start,
      end,
      size: "s",
      ...(color && { color }),
      ...(cleanLabel && { richText: richText(cleanLabel) }),
    },
  });

  const endpoints = [
    { terminal: "start" as const, id: from.id, anchor: fromAnchor },
    { terminal: "end" as const, id: to.id, anchor: toAnchor },
  ];

  for (const { terminal, id, anchor } of endpoints) {
    editor.createBinding({
      type: "arrow",
      fromId: arrowId,
      toId: id,
      props: {
        terminal,
        normalizedAnchor: anchor,
        isPrecise: true,
        isExact: false,
      },
    });
  }
  return ok();
}

function fontSizeToStyle(px: number) {
  if (px <= 18) return "s";
  if (px <= 24) return "m";
  if (px <= 36) return "l";
  return "xl";
}

export function executeCanvasTool(editor: Editor, idMap: ShapeIdMap, toolName: string, rawInput: unknown): ToolResult {
  const defs = canvasToolDefs;
  switch (toolName) {
    case "createRectangle":
    case "createEllipse": {
      const input = defs[toolName].inputSchema.parse(rawInput);
      let width = input.width;
      let height = input.height;
      if (input.label) {
        const textLen = input.label.length;
        // Eraser-style auto-sizing: prevent text from wrapping awkwardly or overflowing
        const minW = Math.max(width, Math.min(320, Math.max(200, textLen * 7.5 + 40)));
        width = Math.round(minW);
        const usableWidth = width - 36;
        const charsPerLine = Math.max(12, Math.floor(usableWidth / 8));
        const estimatedLines = Math.max(1, Math.ceil(textLen / charsPerLine));
        const minH = Math.max(height, 50 + estimatedLines * 20);
        height = Math.round(minH);
      }
      editor.createShape({
        id: resolveNewId(idMap, input.id),
        type: "geo",
        x: input.position.x,
        y: input.position.y,
        props: {
          geo: toolName === "createRectangle" ? "rectangle" : "ellipse",
          w: width,
          h: height,
          ...(input.color && { color: input.color }),
          ...(input.fill && { fill: input.fill }),
          ...(input.label && { richText: richText(input.label) }),
        },
      });
      return ok();
    }

    case "createNote": {
      const input = defs.createNote.inputSchema.parse(rawInput);
      editor.createShape({
        id: resolveNewId(idMap, input.id),
        type: "note",
        x: input.position.x,
        y: input.position.y,
        props: {
          richText: richText(input.text),
          ...(input.color && { color: input.color }),
        },
      });
      return ok();
    }

    case "createHighlight": {
      const input = defs.createHighlight.inputSchema.parse(rawInput);
      const highlightId = resolveNewId(idMap, input.id);
      editor.createShape({
        id: highlightId,
        type: "geo",
        x: input.position.x,
        y: input.position.y,
        props: {
          geo: "rectangle",
          w: input.width,
          h: input.height,
          color: input.color ?? "yellow",
          fill: "semi",
          dash: "solid",
        },
      });
      editor.sendToBack([highlightId]);
      return ok();
    }

    case "createText": {
      const input = defs.createText.inputSchema.parse(rawInput);
      editor.createShape({
        id: resolveNewId(idMap, input.id),
        type: "text",
        x: input.position.x,
        y: input.position.y,
        props: {
          richText: richText(input.text),
          ...(input.color && { color: input.color }),
          ...(input.fontSize && { size: fontSizeToStyle(input.fontSize) }),
        },
      });
      return ok();
    }

    case "createArrow": {
      const input = defs.createArrow.inputSchema.parse(rawInput);
      const from = lookupShape(editor, idMap, input.fromShapeId);
      const to = lookupShape(editor, idMap, input.toShapeId);
      if (!from || !to) return fail("fromShapeId or toShapeId does not refer to a known shape");
      return createArrowBetween(editor, resolveNewId(idMap, input.id), { id: from.id }, { id: to.id }, input.label, input.color);
    }

    case "updateShape": {
      const input = defs.updateShape.inputSchema.parse(rawInput);
      const shape = lookupShape(editor, idMap, input.id);
      if (!shape) return fail("Unknown shape id");
      let width = input.width;
      let height = input.height;
      if (input.label) {
        const textLen = input.label.length;
        const baseW = width ?? ("props" in shape && "w" in shape.props ? (shape.props.w as number) : 200);
        const baseH = height ?? ("props" in shape && "h" in shape.props ? (shape.props.h as number) : 75);
        const minW = Math.max(baseW, Math.min(320, Math.max(200, textLen * 7.5 + 40)));
        width = Math.round(minW);
        const usableWidth = width - 36;
        const charsPerLine = Math.max(12, Math.floor(usableWidth / 8));
        const estimatedLines = Math.max(1, Math.ceil(textLen / charsPerLine));
        const minH = Math.max(baseH, 50 + estimatedLines * 20);
        height = Math.round(minH);
      }
      // Shape type is only known at runtime, so the patch uses tldraw's loose partial type.
      editor.updateShape({
        id: shape.id,
        type: shape.type,
        ...(input.position && { x: input.position.x, y: input.position.y }),
        props: {
          ...(width !== undefined && { w: width }),
          ...(height !== undefined && { h: height }),
          ...(input.color && { color: input.color }),
          ...(input.fill && { fill: input.fill }),
          ...(input.label && "richText" in shape.props && { richText: richText(input.label) }),
        },
      } as TLShapePartial<TLShape>);
      return ok();
    }

    case "deleteShape": {
      const input = defs.deleteShape.inputSchema.parse(rawInput);
      const shape = lookupShape(editor, idMap, input.id);
      if (!shape) return fail("Unknown shape id");
      editor.deleteShape(shape.id);
      return ok();
    }

    case "clearCanvas": {
      const shapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (shapeIds.length > 0) {
        editor.deleteShapes(shapeIds);
      }
      idMap.clear();
      return ok();
    }

    case "createEntityTable": {
      const input = defs.createEntityTable.inputSchema.parse(rawInput);
      const rows = input.columns.map(newRow);
      editor.createShape<EntityTableShape>({
        id: resolveNewId(idMap, input.id),
        type: "entity-table",
        x: input.position.x,
        y: input.position.y,
        props: { w: TABLE_WIDTH, h: getTableHeight(rows.length), tableName: input.tableName, rows },
      });
      return ok();
    }

    case "addColumn":
    case "updateColumn":
    case "removeColumn": {
      const { tableId, ...column } = defs[toolName].inputSchema.parse(rawInput);
      const table = lookupTable(editor, idMap, tableId);
      if (!table) return fail("Unknown table id");
      const rows = columnRows(table.props.rows, toolName, column);
      if (!rows) return fail(`No column named "${"columnName" in column ? column.columnName : ""}"`);
      editor.updateShape<EntityTableShape>({
        id: table.id,
        type: "entity-table",
        props: { rows, h: getTableHeight(rows.length) },
      });
      return ok();
    }

    case "connectRelationship": {
      const input = defs.connectRelationship.inputSchema.parse(rawInput);
      const fromTable = lookupTable(editor, idMap, input.fromTableId);
      const toTable = lookupTable(editor, idMap, input.toTableId);
      if (!fromTable || !toTable) return fail("Unknown table id");
      const fromBounds = editor.getShapePageBounds(fromTable.id);
      const toBounds = editor.getShapePageBounds(toTable.id);
      const isFromLeft = fromBounds && toBounds ? fromBounds.center.x <= toBounds.center.x : true;
      return createArrowBetween(
        editor,
        resolveNewId(idMap, input.id),
        { id: fromTable.id, anchor: rowAnchor(fromTable, input.fromColumnName, isFromLeft) },
        { id: toTable.id, anchor: rowAnchor(toTable, input.toColumnName, !isFromLeft) }
      );
    }

    default:
      return fail(`Unknown canvas tool: ${toolName}`);
  }
}

type ColumnInput =
  | { name: string; dataType: string; isPK: boolean; isFK: boolean }
  | { columnName: string; name?: string; dataType?: string; isPK?: boolean; isFK?: boolean };

// Returns the table's new rows, or null when the named column doesn't exist.
function columnRows(rows: EntityRow[], toolName: string, input: ColumnInput): EntityRow[] | null {
  if (!("columnName" in input)) return [...rows, newRow(input)];
  if (!rows.some((r) => r.name === input.columnName)) return null;
  if (toolName === "removeColumn") return rows.filter((r) => r.name !== input.columnName);

  const { columnName, ...changes } = input;
  const defined = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
  return rows.map((r) => (r.name === columnName ? { ...r, ...defined } : r));
}
