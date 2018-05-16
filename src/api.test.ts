import { ProvenanceGraphTracker } from './api'

describe('ProvenanceGraphTracker', () => {
  let tracker: ProvenanceGraphTracker
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
    tracker = new ProvenanceGraphTracker()
    tracker.registerFunction('add', add)
    tracker.registerFunction('substract', substract)
  })

  it('add some', () => {
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
    const prom1 = tracker.applyActionToCurrentStateNode(action1)
    prom1.then(() => {
      expect(state).toEqual({ offset: 55 })
    })

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
    tracker.applyActionToCurrentStateNode(action2)
  })
})
