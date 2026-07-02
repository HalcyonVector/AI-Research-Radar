export interface GraphNode {
  id: string;
  type: string;
  label: string;
  score?: number;
  category?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  center_id: string;
  node_count: number;
  edge_count: number;
}
