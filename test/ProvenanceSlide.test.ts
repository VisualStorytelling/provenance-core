import { ProvenanceSlide } from '../src/ProvenanceSlide';

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

const testNode2 = {
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

describe('single slide', () => {
  it('should make a slide', () => {
    const slide = new ProvenanceSlide('test1', 1, 0);
    expect(slide).toBeInstanceOf(ProvenanceSlide);

    expect(slide.name).toBe('test1');
    expect(slide.duration).toBe(1);
    expect(slide.delay).toBe(0);
    expect(slide.annotations).toEqual([]);
    expect(slide.node).toEqual(null);
  });

  it('should make a slide with annotations and node set', () => {
    const slide = new ProvenanceSlide('test2', 1, 0, ['haha'], testNode1);
    expect(slide).toBeInstanceOf(ProvenanceSlide);

    expect(slide.name).toBe('test2');
    expect(slide.duration).toBe(1);
    expect(slide.delay).toBe(0);
    expect(slide.annotations).toEqual(['haha']);
    expect(slide.node).toEqual(testNode1);
  });

  describe('setters for private fields', () => {
    let slide: ProvenanceSlide;
    beforeEach(() => {
      slide = new ProvenanceSlide('test1', 1, 0, ['haha'], testNode1);
    });

    it('has a name setter', () => {
      expect(slide.name).toBe('test1');
      slide.name = 'newName9000';
      expect(slide.name).toBe('newName9000');
    });

    it('has a duration setter', () => {
      expect(slide.duration).toBe(1);
      slide.duration = 54;
      expect(slide.duration).toBe(54);
    });

    it('has a delay setter', () => {
      expect(slide.delay).toBe(0);
      slide.delay = 12;
      expect(slide.delay).toBe(12);
    });

    it('has a node setter', () => {
      expect(slide.node).toBe(testNode1);
      slide.node = testNode2;
      expect(slide.node).toBe(testNode2);
    });
  });

  describe('adding and removing annotations', () => {
    let slide: ProvenanceSlide;
    beforeEach(() => {
      slide = new ProvenanceSlide('test1', 1, 0, ['haha'], testNode1);
    });

    describe('add annotations', () => {
      it('can add an annotation', () => {
        expect(slide.annotations[0]).toEqual('haha');
        slide.addAnnotation('shiny!');
        expect(slide.annotations[0]).toEqual('haha');
        expect(slide.annotations[1]).toEqual('shiny!');
      });
    });

    describe('can remove an annotation', () => {
      beforeEach(() => {
        slide.addAnnotation('shiny!');
        slide.addAnnotation('awesome!');
        slide.addAnnotation('insight!');
      });

      it('should remove the slide', () => {
        expect(slide.annotations).toEqual(['haha', 'shiny!', 'awesome!', 'insight!']);
        slide.removeAnnotation('awesome!');
        expect(slide.annotations).toEqual(['haha', 'shiny!', 'insight!']);
      });
    });
  });
});
