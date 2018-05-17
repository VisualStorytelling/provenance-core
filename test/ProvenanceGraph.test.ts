import { IProvenanceGraph, RootNode, Application } from '../src/api';
import { ProvenanceGraph } from '../src/ProvenanceGraph';

const unknownUsername: string = 'Unknown';
const expectedRootNode: RootNode = {
  id: expect.any(String),
  label: 'Root',
  metadata: {
    createdBy: unknownUsername,
    createdOn: expect.any(Number)
  },
  children: [],
  artifacts: {}
};

describe('ProvenanceGraph', () => {
  let graph: IProvenanceGraph;
  const application: Application = {
    name: 'testapp',
    version: '1.2.3'
  };

  beforeEach(() => {
    graph = new ProvenanceGraph(application); // without username
  });

  test('should have application', () => {
    expect(graph.application).toBe(application);
  });

  test('should have root as current node', () => {
    const result = graph.current;
    expect(result).toEqual(expectedRootNode);
  });

  test('should have unknown username', () => {
    expect(graph.current.metadata.createdBy).toBe(unknownUsername);
  });

  test('should have username', () => {
    const graphWithUsername = new ProvenanceGraph(application, 'me');
    expect(graphWithUsername.current.metadata.createdBy).toBe('me');
  });

  describe('get root node', () => {
    it('should return root node', () => {
      const nodeId = graph.current.id;
      const result = graph.getNode(nodeId);
      expect(result).toEqual(expectedRootNode);
    });
  });

  describe('get non existing node', () => {
    it('should throw error', () => {
      expect(() => graph.getNode('non-existing-node')).toThrow('Node id not found');
    });
  });

  describe('add node', () => {
    describe('node with existing id', () => {
      it('should throw error', () => {
        const id = graph.current.id;
        const node = {
          id,
          label: 'Some node',
          metadata: {
            createdBy: 'me',
            createdOn: 123456
          },
          parent: null,
          children: [],
          artifacts: {}
        };
        expect(() => graph.addNode(node)).toThrow('Node already added');
      });
    });
  });
});
