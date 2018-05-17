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
    version: '2.2.3'
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

    describe('node with non-existing id', () => {
      const someNodeId = '11111111-1111-4111-1111-111111111111';
      let someNode;

      beforeEach(() => {
        someNode = {
          id: someNodeId,
          label: 'Some node',
          parent: graph.current,
          children: [],
          artifacts: {}
        };
        graph.addNode(someNode);
      });

      it('should be gettable', () => {
        expect(graph.getNode(someNodeId)).toEqual(someNode);
      });

      describe('make node current', () => {
        beforeEach(() => {
          graph.current = someNode;
        });

        it('should have someNode as current', () => {
          expect(graph.current).toEqual(someNode);
        });
      });
    });
  });

  describe('Make non-existing node current', () => {
    it('should throw error', () => {
      const otherNodeId = '21111111-1111-4111-1111-111111111111';
      const otherNode = {
        id: otherNodeId,
        label: 'Some node',
        parent: graph.current,
        children: [],
        artifacts: {}
      };
      expect(() => {
        graph.current = otherNode;
      }).toThrow('Node id not found');
    });
  });
});
