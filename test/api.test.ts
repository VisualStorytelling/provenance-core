import {
  IProvenanceGraphTracker,
  StateNode,
  IProvenanceGraph
} from '../src/api'
import { ProvenanceGraphTracker, ProvenanceGraph } from '../src/provenanceGraph'

describe('ProvenanceGraphTracker', () => {
  let graph: IProvenanceGraph
  let tracker: IProvenanceGraphTracker
  const state = {
    offset: 0
  }

  function add(y: number) {
    state.offset = state.offset + y
    return Promise.resolve()
  }

  function substract(y: number) {
    state.offset = state.offset - y
    return Promise.resolve()
  }

  beforeEach(() => {
    state.offset = 42
    graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' })
    tracker = new ProvenanceGraphTracker(graph)
    tracker.registerFunction('add', add)
    tracker.registerFunction('substract', substract)
  })

  describe('add 13', () => {
    let prom1: Promise<StateNode>

    beforeEach(() => {
      const action1 = {
        do: 'add',
        doArguments: [13],
        undo: 'substract',
        undoArguments: [13],
        metadata: {
          createdBy: 'me',
          createdOn: 'now',
          tags: [],
          userIntent: 'Because I want to'
        }
      }
      prom1 = tracker.applyActionToCurrentStateNode(action1)
      return prom1
    })

    test('should have offset equal to 55', () => {
      prom1.then(() => {
        expect(state).toEqual({ offset: 55 })
      })
    })

    describe('Substract 5', () => {
      let prom2: Promise<StateNode>
      beforeEach(() => {
        const action2 = {
          do: 'substract',
          doArguments: [5],
          undo: 'add',
          undoArguments: [5],
          metadata: {
            createdBy: 'me',
            createdOn: 'later',
            tags: [],
            userIntent: 'Because I want to'
          }
        }
        prom2 = tracker.applyActionToCurrentStateNode(action2)
        return prom2
      })

      test('should have offset equal to 50', () => {
        prom1.then(() => {
          expect(state).toEqual({ offset: 50 })
        })
      })
    })
  })

  describe('traverse to non existing node', () => {
    test('should reject promise with not found', () => {
      const dummyNodeId = '11111111-1111-4111-1111-111111111111'
      const result = tracker.traverseToStateNode(dummyNodeId)
      return expect(result).rejects.toEqual({
        error: 'Node not found'
      })
    })
  })

  describe('traverse to current', () => {
    test('should return current', () => {
      // TODO implement
      expect(1).toEqual(2)
    })
  })
})
