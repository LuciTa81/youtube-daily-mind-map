import dagre from "dagre";
import { Position, type Edge } from "@xyflow/react";
import type { MindMapFlowNode } from "./reactFlowAdapter";

function getNumericStyleValue(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

export function layoutReactFlowNodes(
  nodes: MindMapFlowNode[],
  edges: Edge[]
): { nodes: MindMapFlowNode[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    align: "UL",
    nodesep: 54,
    ranksep: 110,
    marginx: 40,
    marginy: 40
  });

  for (const node of nodes) {
    const width = getNumericStyleValue(node.style?.width, 220);
    const height = getNumericStyleValue(node.style?.minHeight, 90);
    graph.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return {
    nodes: nodes.map((node) => {
      const graphNode = graph.node(node.id);
      const width = getNumericStyleValue(node.style?.width, 220);
      const height = getNumericStyleValue(node.style?.minHeight, 90);

      return {
        ...node,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        position: {
          x: graphNode.x - width / 2,
          y: graphNode.y - height / 2
        }
      };
    }),
    edges
  };
}
