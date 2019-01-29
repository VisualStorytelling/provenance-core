import { IProvenanceGraph, RootNode, Application, StateNode, Handler } from '../src/api';
import { ProvenanceGraph } from '../src/ProvenanceGraph';
import Mock = jest.Mock;

const unknownUsername = 'Unknown';
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
const application: Application = {
  name: 'testapp',
  version: '2.2.3'
};

describe('ProvenanceGraph', () => {
  let graph: IProvenanceGraph;

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
      let someNode: StateNode;

      beforeEach(() => {
        someNode = {
          id: someNodeId,
          label: 'Some node',
          parent: graph.current,
          children: [],
          artifacts: {},
          action: {
            do: 'doFunction',
            doArguments: []
          },
          actionResult: {},
          metadata: {
            createdBy: '',
            createdOn: 1
          }
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
        metadata: {
          createdBy: unknownUsername,
          createdOn: expect.any(Number)
        },
        parent: graph.current,
        children: [],
        artifacts: {}
      };
      expect(() => {
        graph.current = otherNode;
      }).toThrow('Node id not found');
    });
  });

  describe('Event listener', () => {
    let listener: Mock<Handler>;
    let node: RootNode;
    beforeEach(() => {
      listener = jest.fn();
      node = {
        id: '123',
        label: 'Some node',
        metadata: {
          createdBy: 'me',
          createdOn: 123456
        },
        children: [],
        artifacts: {}
      };
      graph.on('nodeAdded', listener);
    });

    it('should dispatch add node event', () => {
      graph.addNode(node);
      expect(listener).toHaveBeenCalled();
    });
    it('can remove listener', () => {
      graph.off('nodeAdded', listener);
      graph.addNode(node);
      expect(listener).not.toHaveBeenCalled();
    });
    it('can dispatch on node change', () => {
      const changeListener = jest.fn();
      graph.on('nodeChanged', changeListener);
      graph.emitNodeChangedEvent(graph.root);
      expect(changeListener).toHaveBeenCalled();
    });
  });
});

test('ProvenanceGraph with root node', () => {
  const root = {
    id: 'some id',
    label: 'Root',
    metadata: {
      createdBy: 'me',
      createdOn: 1548764758653
    },
    children: [],
    artifacts: {}
  };
  const graph = new ProvenanceGraph(application, 'me', root);
  expect(graph.root).toBe(root);
  expect(graph.current).toBe(root);
});
