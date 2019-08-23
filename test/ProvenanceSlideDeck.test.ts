import { Handler } from '../src/api';

import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ProvenanceGraphTraverser } from '../src/ProvenanceGraphTraverser';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';

import { ProvenanceSlidedeck } from '../src/ProvenanceSlidedeck';
import { ProvenanceSlide } from '../src/ProvenanceSlide';
import Mock = jest.Mock;
import { dataURLSample } from './helpers';

let graph: ProvenanceGraph;
let tracker: ProvenanceTracker;
let registry: ActionFunctionRegistry;
let slideDeck: ProvenanceSlidedeck;
let traverser: ProvenanceGraphTraverser;

const username = 'me';

class Calculator {
  offset = 42;

  add(y: number): Promise<void> {
    this.offset = this.offset + y;
    return Promise.resolve();
  }

  subtract(y: number): Promise<void> {
    this.offset = this.offset - y;
    return Promise.resolve();
  }
}

let calculator: Calculator;

const testNode1 = {
  id: 'sdkljbgfoasdbfdsbvckjurebvlauwyb',
  label: 'Some node',
  metadata: {
    createdBy: 'me',
    createdOn: 123456
  },
  parent: null,
  children: [],
  artifacts: {}
};

const slide1 = new ProvenanceSlide('slide1', 10, 10);
const slide2 = new ProvenanceSlide('slide2', 10, 10);
const slide3 = new ProvenanceSlide('slide3', 10, 10);
const slideWithNode: ProvenanceSlide = new ProvenanceSlide('slideWithNode', 1, 0, [], testNode1);

describe('ProvenanceTreeSlidedeck', () => {
  beforeEach(() => {
    calculator = new Calculator();
    graph = new ProvenanceGraph({ name: 'calculator', version: '1.0.0' }, username);
    registry = new ActionFunctionRegistry();
    registry.register('add', calculator.add, calculator);
    registry.register('subtract', calculator.subtract, calculator);
    tracker = new ProvenanceTracker(registry, graph, username);
    traverser = new ProvenanceGraphTraverser(registry, graph);
    slideDeck = new ProvenanceSlidedeck({ name: 'calculator', version: '1.0.0' }, traverser);
    graph.addNode(testNode1);
  });

  it('should have a graph', () => {
    expect(slideDeck.graph).toBe(graph);
  });

  it('makes a Slidedeck', () => {
    expect(slideDeck).toBeInstanceOf(ProvenanceSlidedeck);
    expect(slideDeck.slides).toHaveLength(0);
    expect(slideDeck.application).toBeDefined();
  });

  describe('add slides', () => {
    describe('add slides', () => {
      it('should add a slide to an empty deck', () => {
        slideDeck.addSlide(slide1);
        expect(slideDeck.slides).toEqual([slide1]);
      });
      it('should add a slide with the current node if no slide is given', () => {
        const slideCreated = slideDeck.addSlide();
        expect(slideDeck.slides).toEqual([slideCreated]);
        expect(slideCreated.node).toEqual(graph.current);
      });
      it('will dispatch on slide addition', () => {
        const listener = jest.fn();
        slideDeck.on('slideAdded', listener);
        slideDeck.addSlide(slide1);
        expect(listener).toHaveBeenCalled();
      });
    });

    describe('add slides to decks with slides', () => {
      beforeEach(() => {
        slideDeck.addSlide(slide1);
        slideDeck.addSlide(slide3);
      });

      it('should add a slide at the end by default', () => {
        slideDeck.addSlide(slide2);
        expect(slideDeck.slides).toEqual([slide1, slide3, slide2]);
      });

      it('should add a slide at index', () => {
        slideDeck.addSlide(slide2, 1);
        expect(slideDeck.slides).toEqual([slide1, slide2, slide3]);
      });

      it('should add a slide at the end if the index is nonsense', () => {
        slideDeck.addSlide(slide2, NaN);
        expect(slideDeck.slides).toEqual([slide1, slide3, slide2]);
      });

      it('cannot add an identical slide', () => {
        expect(() => {
          slideDeck.addSlide(slide1);
        }).toThrow('Cannot add a slide that is already in the deck');
      });

      describe('goto next slide', () => {
        beforeEach(() => {
          slideDeck.next();
        });

        it('should be on slide 3', () => {
          expect(slideDeck.selectedSlide).toBe(slide3);
        });

        describe('goto next slide', () => {
          beforeEach(() => {
            slideDeck.next();
          });

          it('should be on slide 1', () => {
            expect(slideDeck.selectedSlide).toBe(slide1);
          });
        });

        describe('goto prev slide', () => {
          beforeEach(() => {
            slideDeck.previous();
          });

          it('should be back on slide 1', () => {
            expect(slideDeck.selectedSlide).toBe(slide1);
          });
        });
      });

      describe('goto prev slide', () => {
        beforeEach(() => {
          slideDeck.previous();
        });

        it('should be on slide 3', () => {
          expect(slideDeck.selectedSlide).toBe(slide3);
        });
      });
    });
  });

  describe('remove slides', () => {
    beforeEach(() => {
      slideDeck.addSlide(slide1);
      slideDeck.addSlide(slide2);
      slideDeck.addSlide(slide3);
    });

    it('should remove at index', () => {
      slideDeck.removeSlideAtIndex(1);
      expect(slideDeck.slides).toEqual([slide1, slide3]);
    });

    it('should remove at slide from argument', () => {
      slideDeck.removeSlide(slide2);
      expect(slideDeck.slides).toEqual([slide1, slide3]);
    });

    it('resets the selection to null if a selected slide is deleted', () => {
      slideDeck.selectedSlide = slide3;
      slideDeck.removeSlide(slide3);
      expect(slideDeck.selectedSlide).toBe(null);
    });

    it('will dispatch on slide removal', () => {
      const listener = jest.fn();
      slideDeck.on('slideRemoved', listener);
      slideDeck.removeSlide(slide1);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('selected slide', () => {
    it('initially has a null selection', () => {
      expect(slideDeck.selectedSlide).toEqual(null);
    });

    it('has a selected slide when a slide is added', () => {
      slideDeck.addSlide(slide1);
      expect(slideDeck.selectedSlide).toBeInstanceOf(ProvenanceSlide);
    });

    describe('selecting slides', () => {
      beforeEach(() => {
        slideDeck.addSlide(slide1);
        slideDeck.addSlide(slideWithNode);
        slideDeck.addSlide(slide3);
      });

      it('can select another slide', () => {
        slideDeck.selectedSlide = slide3;
        expect(slideDeck.selectedSlide).toBe(slide3);
      });

      it('has signaled the traverser to change the slide when another is selected', () => {
        slideDeck.selectedSlide = slide1;
        const spiedfunc = jest.spyOn(traverser, 'toStateNode');
        slideDeck.selectedSlide = slideWithNode;
        expect(slideWithNode.node).toBeDefined();
        if (slideWithNode.node) {
          expect(spiedfunc).toHaveBeenCalledWith(slideWithNode.node.id, 0);
        }
      });

      it('will dispatch on slide selection', () => {
        const listener = jest.fn();
        slideDeck.on('slideSelected', listener);
        slideDeck.selectedSlide = slide1;
        expect(listener).toHaveBeenCalled();
      });
    });
  });

  describe('change order of slides', () => {
    beforeEach(() => {
      slideDeck.addSlide(slide1);
      slideDeck.addSlide(slide2);
      slideDeck.addSlide(slide3);
    });
    it('does nothing when moving to same position', () => {
      slideDeck.moveSlide(0, 0);
      expect(slideDeck.slides).toHaveLength(3);
      expect(slideDeck.slides[0]).toBe(slide1);
    });
    it('can move 1 slide to end', () => {
      slideDeck.moveSlide(0, 2);
      expect(slideDeck.slides).toHaveLength(3);
      expect(slideDeck.slides[0]).toBe(slide2);
      expect(slideDeck.slides[1]).toBe(slide3);
      expect(slideDeck.slides[2]).toBe(slide1);
    });
    it('can move 1 slide to start', () => {
      slideDeck.moveSlide(2, 0);
      expect(slideDeck.slides).toHaveLength(3);
      expect(slideDeck.slides[0]).toBe(slide3);
      expect(slideDeck.slides[1]).toBe(slide1);
      expect(slideDeck.slides[2]).toBe(slide2);
    });
    it('can move 1 slide up', () => {
      slideDeck.moveSlide(2, 1);
      expect(slideDeck.slides).toHaveLength(3);
      expect(slideDeck.slides[0]).toBe(slide1);
      expect(slideDeck.slides[1]).toBe(slide3);
      expect(slideDeck.slides[2]).toBe(slide2);
    });
    it('can move 1 slide down', () => {
      slideDeck.moveSlide(1, 2);
      expect(slideDeck.slides).toHaveLength(3);
      expect(slideDeck.slides[0]).toBe(slide1);
      expect(slideDeck.slides[1]).toBe(slide3);
      expect(slideDeck.slides[2]).toBe(slide2);
    });

    it('cannot move slides with a faulty to-index', () => {
      expect(() => {
        slideDeck.moveSlide(0, 3);
      }).toThrow('target index out of bounds');
      expect(() => {
        slideDeck.moveSlide(0, -1);
      }).toThrow('target index out of bounds');
      expect(slideDeck.slides).toHaveLength(3);
    });
  });

  describe('Event listener', () => {
    const listener: Mock<Handler> = jest.fn();

    it('can remove listener', () => {
      slideDeck.off('slideAdded', listener);
      slideDeck.addSlide(slide1);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Time based indexing', () => {
    beforeEach(() => {
      slide1.transitionTime = 0;
      slide1.duration = 2;
      slide2.transitionTime = 10;
      slide2.duration = 4;
      slide3.transitionTime = 20;
      slide3.duration = 6;

      slideDeck.addSlide(slide1);
      slideDeck.addSlide(slide2);
      slideDeck.addSlide(slide3);

      /* Time indexes should now look like:
             * 0: start slide1
             * 2: start slide2
             * 16: start slide3
             * 42:
            */
    });

    it('matches initial expectations', () => {
      expect(slideDeck.startTime(slide1)).toBe(0);
      expect(slideDeck.startTime(slide2)).toBe(2);
      expect(slideDeck.startTime(slide3)).toBe(16);
    });

    it('can get the right slide based on time', () => {
      expect(slideDeck.slideAtTime(-1)).toBe(null);
      expect(slideDeck.slideAtTime(0)).toBe(slide1);
      expect(slideDeck.slideAtTime(1)).toBe(slide1);
      expect(slideDeck.slideAtTime(2)).toBe(slide2);
      expect(slideDeck.slideAtTime(15)).toBe(slide2);
      expect(slideDeck.slideAtTime(17)).toBe(slide3);
      expect(slideDeck.slideAtTime(41)).toBe(slide3);
      expect(slideDeck.slideAtTime(42)).toBe(slide3);
      expect(slideDeck.slideAtTime(43)).toBe(slide3);
    });

    // it('can add a slide properly based on startTime', () => {
    //     const testSlide = new ProvenanceSlide('testSlide', 10, 10);
    //     slideDeck.addSlideAtTime(testSlide, 0);
    //     expect(slideDeck.startTime(slide1)).toBe(0);
    //     expect(slideDeck.startTime(slide2)).toBe(2);
    //     expect(slideDeck.startTime(testSlide)).toBe(2);
    //     expect(slideDeck.startTime(slide3)).toBe(16);
    // });
  });
  describe('screenshots', () => {
    const originalWarn = console.warn;
    let slide: ProvenanceSlide;
    beforeEach(() => {
      console.warn = jest.fn();
      slide = new ProvenanceSlide('slide1', 10, 10);
    });
    afterEach(() => {
      console.warn = originalWarn;
    });
    test('auto screenshot works', async () => {
      slideDeck.screenShotProvider = () => dataURLSample;
      slideDeck.autoScreenShot = true;
      slideDeck.addSlide(slide);
      expect(slide.metadata.screenShot).toBe(dataURLSample);
    });
    test('auto screenshot false gives undefined screenshot', async () => {
      tracker.screenShotProvider = () => dataURLSample;
      tracker.autoScreenShot = false;
      slideDeck.addSlide(slide);
      expect(slide.metadata.screenShot).toBeUndefined();
    });
    test('auto screenshot without provider warns', async () => {
      slideDeck.autoScreenShot = true;
      expect(console.warn).toHaveBeenCalled();
      slideDeck.addSlide(slide);
      expect(slide.metadata.screenShot).toBeUndefined();
    });
    test('broken screenShotProvider warns', async () => {
      slideDeck.screenShotProvider = () => {
        throw new Error('some error');
      };
      slideDeck.autoScreenShot = true;
      slideDeck.addSlide(slide);
      expect(slide.metadata.screenShot).toBeUndefined();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
