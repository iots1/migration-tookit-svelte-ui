import type { FlowDefinition } from '$core/types/common';

export interface MigrationMapping {
  sourceTable: string;
  sourceColumns: string[];
  targetTable: string;
  targetColumns: string[];
  transformations?: Transformation[];
}

export interface Transformation {
  type: 'rename' | 'cast' | 'default' | 'expression';
  column: string;
  value?: string;
  expression?: string;
}

export function flowToMigrationJson(flow: FlowDefinition): MigrationMapping[] {
  return flow.edges.map((edge) => {
    const sourceNode = flow.nodes.find((n) => n.id === edge.source);
    const targetNode = flow.nodes.find((n) => n.id === edge.target);

    return {
      sourceTable: (sourceNode?.data?.table as string) || '',
      sourceColumns: (sourceNode?.data?.columns as string[]) || [],
      targetTable: (targetNode?.data?.table as string) || '',
      targetColumns: (targetNode?.data?.columns as string[]) || [],
      transformations:
        (sourceNode?.data?.transformations as Transformation[]) || [],
    };
  });
}
