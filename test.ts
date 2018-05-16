
describe('ProvenanceGraphTracker', () => {
    it('add some', () => {
        const tracker = new ProvenanceGraphTracker();

        const state = {
            offset: 42
        };

        function add(y) {
            state.offset = state.offset + y;
            return Promise.resolve();
        }

        function substract(y) {
            state.offset = state.offset - y;
            return Promise.resolve();
        }

        tracker.registerFunction('add', add);
        tracker.registerFunction('substract', substract);

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
        };
        const prom1 = tracker.applyAction(state, action1);
        prom1.then((newState) => {
            expect(newState).toEqual({ offset: 55 });
        });

        const action2 = {
            redo: 'substract',
            redoArguments: 5,
            undo: 'add',
            undoArguments: 5,
            metadata: {
                createdBy: 'me',
                createdOn: 'later',
                tags: [],
                userIntent: 'Because I want to'
            }
        };
        tracker.applyAction(state, action2);

    });
});