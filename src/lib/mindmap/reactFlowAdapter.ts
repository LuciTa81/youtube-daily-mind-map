import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { MindMapNode } from "@/types/mindmap";

export type MindMapReactFlowNodeData = {
  mindMapNode: MindMapNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isCollapsed: boolean;
  isDimmed?: boolean;
  onToggleBranch?: (nodeId: string) => void;
  onToggleCollapsedGroup?: (nodeId: string) => void;
} & Record<string, unknown>;

export type MindMapFlowNode = Node<MindMapReactFlowNodeData, "mindMap">;

function getNodeSize(node: MindMapNode): { width: number; height: number } {
  if (node.type === "root") {
    return { width: 280, height: 118 };
  }

  if (node.type === "category") {
    const countScale = Math.min(48, Math.max(0, (node.count ?? 0) * 2));
    return { width: 230 + countScale, height: 112 + Math.min(28, countScale / 2) };
  }

  if (node.type === "time-block" || node.type === "channel") {
    return { width: 236, height: 104 };
  }

  if (node.type === "video") {
    return { width: 260, height: 88 };
  }

  if (node.type === "collapsed-group") {
    return { width: 170, height: 60 };
  }

  return { width: 210, height: 86 };
}

export function convertMindMapToReactFlow(root: MindMapNode): {
  nodes: MindMapFlowNode[];
  edges: Edge[];
} {
  const nodes: MindMapFlowNode[] = [];
  const edges: Edge[] = [];

  function visit(node: MindMapNode, parentId?: string) {
    const size = getNodeSize(node);
    nodes.push({
      id: node.id,
      type: "mindMap",
      position: { x: 0, y: 0 },
      data: {
        mindMapNode: node,
        isSelected: Boolean(node.meta?.isSelected),
        isHighlighted: Boolean(node.meta?.isHighlighted),
        isCollapsed: node.type === "collapsed-group" || Boolean(node.meta?.isBranchCollapsed),
        isDimmed: Boolean(node.meta?.isDimmed)
      },
      style: {
        width: size.width,
        minHeight: size.height
      }
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#94a3b8",
          width: 16,
          height: 16
        },
        style: {
          stroke: "#94a3b8",
          strokeWidth: 1.6
        }
      });
    }

    for (const child of node.children ?? []) {
      visit(child, node.id);
    }
  }

  visit(root);

  return { nodes, edges };
}
