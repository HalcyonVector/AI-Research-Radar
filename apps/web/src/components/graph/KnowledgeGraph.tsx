"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "@/lib/utils";
import { truncate } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import type { GraphData, GraphNode } from "@/types/graph";
import { GraphControls } from "./GraphControls";
import { NodeTooltip } from "./NodeTooltip";
import { nodeColor, nodeRadius } from "./graphColors";

interface KnowledgeGraphProps {
  data: GraphData | undefined;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string | null;
  depth?: number;
  onDepthChange?: (n: number) => void;
}

interface PhysicsNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
}

const TARGET_LINK_LENGTH = 90;
const MAX_TICKS = 420;
const ENERGY_THRESHOLD = 0.05;
const DAMPING = 0.85;
const REPULSION = 2600;
const SPRING = 0.02;
const CENTER_PULL = 0.012;

export function KnowledgeGraph({
  data,
  loading,
  error,
  onRetry,
  height = 560,
  onNodeClick,
  selectedNodeId,
  depth,
  onDepthChange,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const posRef = useRef<Record<string, PhysicsNode>>({});
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef(0);

  const [width, setWidth] = useState(800);
  const [, forceRender] = useState(0);

  // view transform
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // interaction
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const dragState = useRef<
    | { kind: "canvas"; startX: number; startY: number; panX: number; panY: number }
    | { kind: "node"; id: string }
    | null
  >(null);

  // edge type filtering (internal)
  const allEdgeTypes = useMemo(() => {
    if (!data?.edges) return [] as string[];
    const set = new Set<string>();
    data.edges.forEach((e) => e.relation && set.add(e.relation));
    return Array.from(set).sort();
  }, [data]);

  const [activeEdgeTypes, setActiveEdgeTypes] = useState<string[]>([]);
  useEffect(() => {
    setActiveEdgeTypes(allEdgeTypes);
  }, [allEdgeTypes]);

  // ---- ResizeObserver for width ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(320, el.clientWidth));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];
  const centerId = data?.center_id;

  // stable signature of node ids to reseed on data change
  const nodeSignature = useMemo(() => nodes.map((n) => n.id).join("|"), [nodes]);

  // adjacency (for highlighting neighbors)
  const adjacency = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    edges.forEach((e) => {
      if (!map[e.source]) map[e.source] = new Set();
      if (!map[e.target]) map[e.target] = new Set();
      map[e.source].add(e.target);
      map[e.target].add(e.source);
    });
    return map;
  }, [edges]);

  const visibleEdges = useMemo(
    () => edges.filter((e) => !e.relation || activeEdgeTypes.includes(e.relation)),
    [edges, activeEdgeTypes]
  );

  // ---- seed positions when data changes ----
  useEffect(() => {
    if (!nodes.length) {
      posRef.current = {};
      return;
    }
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 3;
    const next: Record<string, PhysicsNode> = {};
    nodes.forEach((n, i) => {
      if (n.id === centerId) {
        next[n.id] = { x: cx, y: cy, vx: 0, vy: 0 };
        return;
      }
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
      next[n.id] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    posRef.current = next;
    tickRef.current = 0;
    startSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeSignature, width, height]);

  // ---- force simulation ----
  const stopSimulation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startSimulation = useCallback(() => {
    stopSimulation();

    const step = () => {
      const pos = posRef.current;
      const ns = nodes;
      if (!ns.length) {
        rafRef.current = null;
        return;
      }
      const cx = width / 2;
      const cy = height / 2;
      let energy = 0;

      // repulsion (O(n^2) but graphs here are small)
      for (let i = 0; i < ns.length; i++) {
        const a = pos[ns[i].id];
        if (!a) continue;
        for (let j = i + 1; j < ns.length; j++) {
          const b = pos[ns[j].id];
          if (!b) continue;
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let distSq = dx * dx + dy * dy;
          if (distSq < 0.01) {
            dx = (Math.random() - 0.5) * 0.5;
            dy = (Math.random() - 0.5) * 0.5;
            distSq = dx * dx + dy * dy + 0.01;
          }
          const dist = Math.sqrt(distSq);
          // inverse-square, capped
          const force = Math.min(REPULSION / distSq, 40);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!a.fixed) {
            a.vx += fx;
            a.vy += fy;
          }
          if (!b.fixed) {
            b.vx -= fx;
            b.vy -= fy;
          }
        }
      }

      // spring attraction along edges
      for (const e of edges) {
        const a = pos[e.source];
        const b = pos[e.target];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const displacement = dist - TARGET_LINK_LENGTH;
        const w = e.weight ? clamp(e.weight, 0.2, 2) : 1;
        const force = displacement * SPRING * w;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!a.fixed) {
          a.vx += fx;
          a.vy += fy;
        }
        if (!b.fixed) {
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // centering + integrate
      for (const n of ns) {
        const p = pos[n.id];
        if (!p) continue;
        if (!p.fixed) {
          p.vx += (cx - p.x) * CENTER_PULL;
          p.vy += (cy - p.y) * CENTER_PULL;
          p.vx *= DAMPING;
          p.vy *= DAMPING;
          p.x += p.vx;
          p.y += p.vy;
          energy += p.vx * p.vx + p.vy * p.vy;
        }
      }

      tickRef.current += 1;
      forceRender((v) => v + 1);

      const settled = energy / Math.max(1, ns.length) < ENERGY_THRESHOLD;
      if (tickRef.current < MAX_TICKS && !settled) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, width, height, stopSimulation]);

  useEffect(() => () => stopSimulation(), [stopSimulation]);

  // ---- view controls ----
  const zoomIn = useCallback(() => setScale((s) => clamp(s * 1.25, 0.3, 4)), []);
  const zoomOut = useCallback(() => setScale((s) => clamp(s / 1.25, 0.3, 4)), []);
  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    tickRef.current = 0;
    startSimulation();
  }, [startSimulation]);

  const toggleEdgeType = useCallback((t: string) => {
    setActiveEdgeTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  // ---- coordinate helpers ----
  const svgPointFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      // account for scaling of viewBox to rendered size
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const localX = (clientX - rect.left) * scaleX;
      const localY = (clientY - rect.top) * scaleY;
      // undo pan/zoom to get graph coordinates
      const gx = (localX - pan.x) / scale;
      const gy = (localY - pan.y) / scale;
      return { x: gx, y: gy };
    },
    [width, height, pan, scale]
  );

  // ---- pointer handlers ----
  const onNodePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragState.current = { kind: "node", id };
      const p = posRef.current[id];
      if (p) p.fixed = true;
      stopSimulation();
    },
    [stopSimulation]
  );

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragState.current = {
        kind: "canvas",
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      if (ds.kind === "canvas") {
        setPan({
          x: ds.panX + (e.clientX - ds.startX),
          y: ds.panY + (e.clientY - ds.startY),
        });
      } else if (ds.kind === "node") {
        const pt = svgPointFromEvent(e.clientX, e.clientY);
        const p = posRef.current[ds.id];
        if (p) {
          p.x = pt.x;
          p.y = pt.y;
          p.vx = 0;
          p.vy = 0;
          forceRender((v) => v + 1);
        }
      }
    },
    [svgPointFromEvent]
  );

  const onPointerUp = useCallback(() => {
    const ds = dragState.current;
    if (ds?.kind === "node") {
      const p = posRef.current[ds.id];
      if (p) p.fixed = false;
      tickRef.current = Math.min(tickRef.current, MAX_TICKS - 120);
      startSimulation();
    }
    dragState.current = null;
  }, [startSimulation]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Use non-passive intent via preventing default only when possible
    const delta = -e.deltaY;
    setScale((s) => clamp(s * (delta > 0 ? 1.08 : 0.92), 0.3, 4));
  }, []);

  const handleNodeEnter = useCallback((node: GraphNode, clientX: number, clientY: number) => {
    setHovered(node);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
  }, []);

  const handleNodeMoveHover = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setTooltipPos({ x: clientX - rect.left, y: clientY - rect.top });
    },
    []
  );

  // ---- highlight logic ----
  const activeId = selectedNodeId ?? null;
  const neighborSet = useMemo(() => {
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    adjacency[activeId]?.forEach((n) => set.add(n));
    return set;
  }, [activeId, adjacency]);

  const isNodeDimmed = (id: string) => !!neighborSet && !neighborSet.has(id);
  const isEdgeActive = (s: string, t: string) =>
    !!neighborSet && (s === activeId || t === activeId);

  // ---- render states ----
  if (loading) {
    return (
      <div className="w-full" style={{ height }}>
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex w-full items-center justify-center" style={{ height }}>
        <ErrorState onRetry={onRetry} />
      </div>
    );
  }
  if (!data || nodes.length === 0) {
    return (
      <div className="flex w-full items-center justify-center" style={{ height }}>
        <EmptyState title="No graph data" description="There are no connections to display for this selection." />
      </div>
    );
  }

  const pos = posRef.current;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-[var(--border-base)] bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.08),transparent_60%)]"
      style={{ height }}
    >
      <GraphControls
        depth={depth ?? 2}
        onDepthChange={(n) => onDepthChange?.(n)}
        edgeTypes={allEdgeTypes}
        activeEdgeTypes={activeEdgeTypes}
        onToggleEdgeType={toggleEdgeType}
        onReset={resetView}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        nodeCount={data.node_count ?? nodes.length}
        edgeCount={data.edge_count ?? edges.length}
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        className="block touch-none"
        style={{ cursor: dragState.current?.kind === "canvas" ? "grabbing" : "grab" }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setHovered(null);
        }}
        onWheel={onWheel}
      >
        <defs>
          <filter id="kg-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
          {/* edges */}
          <g>
            {visibleEdges.map((e, i) => {
              const a = pos[e.source];
              const b = pos[e.target];
              if (!a || !b) return null;
              const active = isEdgeActive(e.source, e.target);
              const dimmed = neighborSet && !active;
              const w = e.weight ? clamp(e.weight, 0.2, 2) : 1;
              return (
                <line
                  key={`${e.source}-${e.target}-${e.relation}-${i}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active ? "var(--accent-primary)" : "var(--border-strong)"}
                  strokeWidth={active ? 1.6 : 1}
                  strokeOpacity={dimmed ? 0.06 : clamp(0.18 + w * 0.22, 0.15, 0.7)}
                />
              );
            })}
          </g>

          {/* nodes */}
          <g>
            {nodes.map((n) => {
              const p = pos[n.id];
              if (!p) return null;
              const r = nodeRadius(n);
              const color = nodeColor(n);
              const isCenter = n.id === centerId;
              const isSelected = n.id === activeId;
              const dimmed = isNodeDimmed(n.id);
              const showLabel = r >= 10 || isCenter || isSelected || hovered?.id === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x} ${p.y})`}
                  style={{ cursor: "pointer", opacity: dimmed ? 0.22 : 1 }}
                  onPointerDown={(ev) => onNodePointerDown(ev, n.id)}
                  onPointerEnter={(ev) => handleNodeEnter(n, ev.clientX, ev.clientY)}
                  onPointerMove={(ev) => {
                    if (hovered?.id === n.id) handleNodeMoveHover(ev.clientX, ev.clientY);
                  }}
                  onPointerLeave={() => setHovered((h) => (h?.id === n.id ? null : h))}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onNodeClick?.(n);
                  }}
                >
                  {(isCenter || isSelected) && (
                    <circle
                      r={r + 5}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeOpacity={0.5}
                    />
                  )}
                  <circle
                    r={r}
                    fill={color}
                    stroke="var(--bg-surface)"
                    strokeWidth={1.5}
                    filter={isCenter || isSelected || hovered?.id === n.id ? "url(#kg-glow)" : undefined}
                  />
                  {showLabel && (
                    <text
                      x={r + 4}
                      y={3}
                      fontSize={11}
                      className="pointer-events-none select-none"
                      fill="var(--text-secondary)"
                      style={{ paintOrder: "stroke", stroke: "var(--bg-base)", strokeWidth: 3 } as React.CSSProperties}
                    >
                      {truncate(n.label, 24)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <NodeTooltip node={hovered} x={tooltipPos.x} y={tooltipPos.y} visible={!!hovered} />
    </div>
  );
}
