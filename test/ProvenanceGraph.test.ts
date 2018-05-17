import { IProvenanceGraph } from '../src/api';
import { ProvenanceGraph } from '../src/ProvenanceGraph';

const expectedRootNode = {
  id: expect.any(String),
  label: 'Root',
  parent: null,
  children: [],
  artifacts: {}
};

describe('ProvenanceGraph', () => {
  let graph: IProvenanceGraph;
  const application = {
    name: 'testapp',
    version: '1.2.3'
  };

  beforeEach(() => {
    graph = new ProvenanceGraph(application);
  });

  test('should have application', () => {
    expect(graph.application).toBe(application);
  });

  test('should have root as current node', () => {
    const result = graph.current;
    expect(result).toEqual(expectedRootNode);
  });

  describe('get root node', () => {
    it('should return root node', () => {
      const nodeId = graph.current.id;
      const result = graph.getStateNode(nodeId);
      expect(result).toEqual(expectedRootNode);
    });
  });

  describe('get non existing node', () => {
    it('should throw error', () => {
      expect(() => graph.getStateNode('non-existing-node')).toThrow(
        'Node id not found'
      );
    });
  });

  describe('add node', () => {
    describe('node with existing id', () => {
      it('should throw error', () => {
        const id = graph.current.id;
        const node = {
          id,
          label: 'Some node',
          parent: null,
          children: [],
          artifacts: {}
        };
        expect(() => graph.addStateNode(node)).toThrow('Node already added');
      });
    });
  });
});
