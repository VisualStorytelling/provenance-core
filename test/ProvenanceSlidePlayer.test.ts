import { ProvenanceGraph } from '../src/ProvenanceGraph';
import { ProvenanceGraphTraverser } from '../src/ProvenanceGraphTraverser';
import { ProvenanceTracker } from '../src/ProvenanceTracker';
import { ActionFunctionRegistry } from '../src/ActionFunctionRegistry';

import { ProvenanceSlidedeck } from '../src/ProvenanceSlidedeck';
import { ProvenanceSlide } from '../src/ProvenanceSlide';
import { STATUS, ProvenanceSlidedeckPlayer } from '../src/ProvenanceSlidedeckPlayer';

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

const slide1 = new ProvenanceSlide('slide1', 1000, 0);
const slide2 = new ProvenanceSlide('slide2', 1000, 0);
const slide3 = new ProvenanceSlide('slide3', 1000, 0);

const slides = [slide1, slide2, slide3];

let player: ProvenanceSlidedeckPlayer<ProvenanceSlide>;

const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

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
    slideDeck.addSlide(slide1);
    slideDeck.addSlide(slide2);
    slideDeck.addSlide(slide3);
    player = new ProvenanceSlidedeckPlayer(slideDeck.slides as ProvenanceSlide[], slide => {
      slideDeck.selectedSlide = slide;
    });
  });

  it('can be created', () => {
    expect(player).toBeTruthy();
  });

  it('has slides', () => {
    expect(player.slides).toHaveLength(3);
  });

  it('can set active slide', () => {
    player.setSlideIndex(1);
    expect(player.slides[player.currentSlideIndex]).toBe(slide2);
  });

  it('can play', async () => {
    expect(player.status).toEqual(STATUS.IDLE);
    const play = player.play();
    expect(player.status).toEqual(STATUS.PLAYING);
    expect(player.currentSlideIndex).toEqual(0);
    await wait(slide1.duration);
    expect(player.currentSlideIndex).toEqual(1);
    await wait(slide2.duration);
    expect(player.currentSlideIndex).toEqual(2);
    await play;
    expect(player.status).toEqual(STATUS.IDLE);
  });

  it('can be stopped', async () => {
    player.play();
    expect(player.currentSlideIndex).toEqual(0);
    await wait(slide1.duration);
    expect(player.currentSlideIndex).toEqual(1);
    player.stop();
    expect(player.status).toEqual(STATUS.IDLE);
    await wait(slide2.duration);
    expect(player.currentSlideIndex).toEqual(1);
    await wait(slide3.duration);
    expect(player.currentSlideIndex).toEqual(1);
  });

  it('can set currentSlideIndex', () => {
    player.currentSlideIndex = 2;

    expect(player.currentSlideIndex).toEqual(2);
  });

  it('can go to next', () => {
    player.currentSlideIndex = 2;
    player.next();
    expect(player.currentSlideIndex).toEqual(3);
  });
});
