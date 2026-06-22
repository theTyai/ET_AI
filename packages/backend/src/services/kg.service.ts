import { getNeo4jSession } from '../config/neo4j';
import { GraphNode, GraphEdge, GraphSubgraph } from '@ikip/shared';

// Helper to format Neo4j integer / properties
const formatNode = (neoNode: any): GraphNode => {
  return {
    id: neoNode.identity.toString(),
    label: neoNode.properties.tag || neoNode.properties.title || neoNode.properties.name || neoNode.properties.id || neoNode.labels[0] || neoNode.identity.toString(),
    properties: Object.keys(neoNode.properties).reduce((acc, key) => {
      const val = neoNode.properties[key];
      acc[key] = typeof val === 'object' && val.low !== undefined ? val.low : val;
      return acc;
    }, { _identity: neoNode.identity.toString(), _label: neoNode.labels[0] } as Record<string, any>),
  };
};

const formatEdge = (neoRel: any): GraphEdge => {
  return {
    id: neoRel.identity.toString(),
    source: neoRel.start.toString(),
    target: neoRel.end.toString(),
    type: neoRel.type,
    properties: Object.keys(neoRel.properties).reduce((acc, key) => {
      const val = neoRel.properties[key];
      acc[key] = typeof val === 'object' && val.low !== undefined ? val.low : val;
      return acc;
    }, {} as Record<string, any>),
  };
};

// ─── Mock Data Fallbacks ────────────────────────────────────────────────────────

const getMockSubgraph = (tagOrId: string): GraphSubgraph => {
  const cleanTag = (tagOrId || 'P-101').toUpperCase();
  return {
    nodes: [
      {
        id: 'node-eq-1',
        label: cleanTag,
        properties: {
          _identity: 'node-eq-1',
          _label: 'Equipment',
          tag: cleanTag,
          name: cleanTag === 'P-101' ? 'Centrifugal Water Pump' : 'Industrial Asset ' + cleanTag,
          status: 'Active',
          location: 'Refinery Unit-3',
          criticality: 'High',
          manufacturer: 'Flowserve Corp',
          model: 'HPX-200'
        }
      },
      {
        id: 'node-doc-1',
        label: 'SOP-MAINT-007.pdf',
        properties: {
          _identity: 'node-doc-1',
          _label: 'Document',
          id: 'doc-007',
          title: 'SOP-MAINT-007.pdf',
          docType: 'SOP',
          status: 'Ingested',
          author: 'Safety Board'
        }
      },
      {
        id: 'node-wo-1',
        label: 'WO-2024-0342',
        properties: {
          _identity: 'node-wo-1',
          _label: 'WorkOrder',
          id: 'wo-342',
          woNumber: 'WO-2024-0342',
          title: 'Lubrication Failure & Bearing Replace',
          status: 'Completed',
          priority: 'Medium'
        }
      },
      {
        id: 'node-clause-1',
        label: 'OISD-118 §4.1',
        properties: {
          _identity: 'node-clause-1',
          _label: 'Clause',
          id: 'clause-oisd-118-4-1',
          code: 'OISD-118 §4.1',
          title: 'Layout Safety & Equipment Spacing',
          severity: 'Critical'
        }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-wo-1',
        target: 'node-eq-1',
        type: 'APPLIED_TO',
        properties: { date: '2024-05-12' }
      },
      {
        id: 'edge-2',
        source: 'node-doc-1',
        target: 'node-eq-1',
        type: 'GOVERNS',
        properties: { complianceStatus: 'Compliant' }
      },
      {
        id: 'edge-3',
        source: 'node-clause-1',
        target: 'node-doc-1',
        type: 'REFERENCES',
        properties: {}
      }
    ]
  };
};

const getMockCypherResults = (cypher: string): any[] => {
  const query = cypher.toLowerCase();
  
  if (query.includes('equipment') && query.includes('document')) {
    return [
      {
        e: { identity: 1, labels: ['Equipment'], properties: { tag: 'P-101', name: 'Centrifugal Pump', status: 'Operational', unit: 'Unit-3' } },
        r: { identity: 10, start: 1, end: 3, type: 'HAS_DOCUMENT', properties: {} },
        d: { identity: 3, labels: ['Document'], properties: { title: 'Pump Startup SOP', docType: 'SOP', revision: 'R4' } }
      },
      {
        e: { identity: 2, labels: ['Equipment'], properties: { tag: 'P-102', name: 'Backup Pump', status: 'Standby', unit: 'Unit-3' } },
        r: { identity: 11, start: 2, end: 3, type: 'HAS_DOCUMENT', properties: {} },
        d: { identity: 3, labels: ['Document'], properties: { title: 'Pump Startup SOP', docType: 'SOP', revision: 'R4' } }
      }
    ];
  }

  if (query.includes('instrument') || query.includes('connected_to')) {
    return [
      {
        e: { identity: 1, labels: ['Equipment'], properties: { tag: 'P-101', name: 'Centrifugal Pump', status: 'Operational', unit: 'Unit-3' } },
        r: { identity: 12, start: 1, end: 7, type: 'CONNECTED_TO', properties: {} },
        i: { identity: 7, labels: ['Instrument'], properties: { tag: 'FT-101', name: 'Flow Transmitter', type: 'Flow' } }
      }
    ];
  }

  if (query.includes('gap') || query.includes('violates')) {
    return [
      {
        g: { identity: 9, labels: ['Gap'], properties: { id: 'GAP-001', gapDescription: 'Missing safety isolation barrier', severity: 'Critical' } },
        r: { identity: 13, start: 9, end: 4, type: 'VIOLATES', properties: {} },
        c: { identity: 4, labels: ['Regulation'], properties: { code: 'PESO R.7', name: 'PESO Explosion Barriers', authority: 'PESO' } }
      }
    ];
  }

  if (query.includes('incident') || query.includes('occurred_on')) {
    return [
      {
        i: { identity: 5, labels: ['Incident'], properties: { id: 'INC-2023-089', title: 'Pump Cavitation & Seal Rupture', severity: 'High' } },
        r: { identity: 14, start: 5, end: 1, type: 'OCCURRED_ON', properties: {} },
        e: { identity: 1, labels: ['Equipment'], properties: { tag: 'P-101', name: 'Centrifugal Pump', status: 'Operational' } }
      }
    ];
  }

  if (query.includes('workorder') || query.includes('assigned_to')) {
    return [
      {
        w: { identity: 6, labels: ['WorkOrder'], properties: { id: 'WO-24-00512', woNumber: 'WO-2024-0342', title: 'Lubrication Seal Replacement', status: 'Completed', type: 'Corrective' } },
        r: { identity: 15, start: 6, end: 1, type: 'ASSIGNED_TO', properties: {} },
        e: { identity: 1, labels: ['Equipment'], properties: { tag: 'P-101', name: 'Centrifugal Pump', status: 'Operational' } }
      }
    ];
  }

  // Generic fallback
  return [
    {
      n: { identity: 1, labels: ['Equipment'], properties: { tag: 'P-101', name: 'Centrifugal Pump', status: 'Operational', unit: 'Unit-3' } }
    }
  ];
};

// ─── Graph Functions with Graceful Connection Fallbacks ──────────────────────────

export const getKGNodeAndNeighbors = async (nodeId: string, depth = 1): Promise<GraphSubgraph> => {
  let session;
  try {
    session = getNeo4jSession();
    const nodesMap = new Map<string, GraphNode>();
    const edgesList: GraphEdge[] = [];

    const query = `
      MATCH (n) WHERE n.id = $nodeId OR n.tag = $nodeId
      MATCH path = (n)-[r*1..${depth}]-(m)
      RETURN nodes(path) AS nodes, relationships(path) AS rels
      LIMIT 100
    `;

    const result = await session.run(query, { nodeId });

    for (const record of result.records) {
      const nodes = record.get('nodes');
      const rels = record.get('rels');

      for (const node of nodes) {
        const formatted = formatNode(node);
        nodesMap.set(node.identity.toString(), formatted);
      }

      for (const rel of rels) {
        edgesList.push(formatEdge(rel));
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesList,
    };
  } catch (error: any) {
    console.warn(`⚠️ Neo4j getKGNodeAndNeighbors failed (${error.message}). Falling back to mock data.`);
    return getMockSubgraph(nodeId);
  } finally {
    if (session) await session.close();
  }
};

export const getEquipmentSubgraph = async (tag: string): Promise<GraphSubgraph> => {
  let session;
  try {
    session = getNeo4jSession();
    const nodesMap = new Map<string, GraphNode>();
    const edgesList: GraphEdge[] = [];

    const query = `
      MATCH (e:Equipment {tag: $tag})
      MATCH path = (e)-[r]-(m)
      RETURN nodes(path) AS nodes, relationships(path) AS rels
      LIMIT 50
    `;

    const result = await session.run(query, { tag });

    for (const record of result.records) {
      const nodes = record.get('nodes');
      const rels = record.get('rels');

      for (const node of nodes) {
        const formatted = formatNode(node);
        nodesMap.set(node.identity.toString(), formatted);
      }

      for (const rel of rels) {
        edgesList.push(formatEdge(rel));
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesList,
    };
  } catch (error: any) {
    console.warn(`⚠️ Neo4j getEquipmentSubgraph failed (${error.message}). Falling back to mock data.`);
    return getMockSubgraph(tag);
  } finally {
    if (session) await session.close();
  }
};

export const runCypherQuery = async (cypher: string, params = {}): Promise<any[]> => {
  // Validate safety
  const isWrite = /create|delete|set|remove|merge|drop/i.test(cypher);
  if (isWrite) {
    throw new Error('Write operations are forbidden through this query API');
  }

  let session;
  try {
    session = getNeo4jSession();
    const result = await session.run(cypher, params);
    return result.records.map((record) => record.toObject());
  } catch (error: any) {
    console.warn(`⚠️ Neo4j runCypherQuery failed (${error.message}). Falling back to mock data.`);
    return getMockCypherResults(cypher);
  } finally {
    if (session) await session.close();
  }
};

export const getShortestPath = async (fromId: string, toId: string): Promise<GraphSubgraph> => {
  let session;
  try {
    session = getNeo4jSession();
    const nodesMap = new Map<string, GraphNode>();
    const edgesList: GraphEdge[] = [];

    const query = `
      MATCH (start {id: $fromId}), (end {id: $toId})
      MATCH path = shortestPath((start)-[*..10]-(end))
      RETURN nodes(path) AS nodes, relationships(path) AS rels
    `;

    const result = await session.run(query, { fromId, toId });

    if (result.records.length > 0) {
      const record = result.records[0];
      const nodes = record.get('nodes');
      const rels = record.get('rels');

      for (const node of nodes) {
        const formatted = formatNode(node);
        nodesMap.set(node.identity.toString(), formatted);
      }

      for (const rel of rels) {
        edgesList.push(formatEdge(rel));
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesList,
    };
  } catch (error: any) {
    console.warn(`⚠️ Neo4j getShortestPath failed (${error.message}). Falling back to mock data.`);
    return getMockSubgraph(fromId);
  } finally {
    if (session) await session.close();
  }
};
