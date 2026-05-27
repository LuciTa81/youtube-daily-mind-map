"use client";

import { useEffect, useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler
} from "@xyflow/react";
import type { MindMapNode as MindMapNodeModel } from "@/types/mindmap";
import { layoutReactFlowNodes } from "@/lib/mindmap/layoutMindMap";
import {
  convertMindMapToReactFlow,
  type MindMapFlowNode
} from "@/lib/mindmap/reactFlowAdapter";
import { MindMapControls } from "./MindMapControls";
import { MindMapNode } from "./MindMapNode";

type MindMapCanvasProps = {
  root: MindMapNodeModel;
  selectedNodeId?: string;
  onNodeSelect: (node: MindMapNodeModel) => void;
  onToggleBranch: (nodeId: string) => void;
  onToggleCollapsedGroup: (nodeId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

const nodeTypes = {
  mindMap: MindMapNode
};

function AutoFit({ fitKey }: { fitKey: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 350 });
    });
  }, [fitKey, fitView]);

  return null;
}

function MindMapCanvasInner({
  root,
  selectedNodeId,
  onNodeSelect,
  onToggleBranch,
  onToggleCollapsedGroup,
  onExpandAll,
  onCollapseAll
}: MindMapCanvasProps) {
  const { nodes, edges } = useMemo(() => {
    const flow = convertMindMapToReactFlow(root);
    const laidOut = layoutReactFlowNodes(flow.nodes, flow.edges);
    const enhancedNodes: MindMapFlowNode[] = laidOut.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isSelected: node.id === selectedNodeId,
        onToggleBranch,
        onToggleCollapsedGroup
      }
    }));

    return { nodes: enhancedNodes, edges: laidOut.edges };
  }, [root, selectedNodeId, onToggleBranch, onToggleCollapsedGroup]);

  const handleNodeClick: NodeMouseHandler<MindMapFlowNode> = (_event, node) => {
    onNodeSelect(node.data.mindMapNode);
  };

  return (
    <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.15}
        maxZoom={1.7}
        nodesDraggable
        panOnDrag
        selectionOnDrag={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#cbd5e1" />
        <MiniMap
          pannable
          zoomable
          className="!hidden !rounded-lg !border !border-slate-200 !bg-white md:!block"
          nodeColor={(node) => {
            const data = node.data as MindMapFlowNode["data"];
            if (data.mindMapNode.type === "root") {
              return "#0f172a";
            }
            if (data.isHighlighted) {
              return "#facc15";
            }
            return "#94a3b8";
          }}
        />
        <MindMapControls
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          visibleNodeCount={nodes.length}
        />
        <AutoFit fitKey={`${root.id}:${nodes.length}`} />
      </ReactFlow>
    </div>
  );
}

export function MindMapCanvas(props: MindMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MindMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
