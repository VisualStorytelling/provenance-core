import { ProvenanceSlide } from '../src/ProvenanceSlide';
import { SlideAnnotation } from '../src/SlideAnnotation';

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
    expect(slide.id).toHaveLength(36); // serialized UUID4
    expect(slide).toBeInstanceOf(ProvenanceSlide);

    expect(slide.name).toBe('test1');
    expect(slide.duration).toBe(1);
    expect(slide.transitionTime).toBe(0);
    expect(slide.annotations).toEqual([]);
    expect(slide.node).toEqual(null);
  });

  it('should make a slide with annotations and node set', () => {
    const slide = new ProvenanceSlide('test2', 1, 0, [new SlideAnnotation('haha')], testNode1);
    expect(slide).toBeInstanceOf(ProvenanceSlide);

    expect(slide.name).toBe('test2');
    expect(slide.duration).toBe(1);
    expect(slide.transitionTime).toBe(0);
    expect(slide.annotations[0].data).toEqual('haha');
    expect(slide.node).toEqual(testNode1);
  });

  describe('setters for private fields', () => {
    let slide: ProvenanceSlide;
    beforeEach(() => {
      slide = new ProvenanceSlide('test1', 1, 0, [new SlideAnnotation('haha')], testNode1);
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
      expect(slide.transitionTime).toBe(0);
      slide.transitionTime = 12;
      expect(slide.transitionTime).toBe(12);
    });

    it('has a node setter', () => {
      expect(slide.node).toBe(testNode1);
      slide.node = testNode2;
      expect(slide.node).toBe(testNode2);
    });

    it('has a node setter', () => {
      expect(slide.node).toBe(testNode1);
      slide.node = testNode2;
      expect(slide.node).toBe(testNode2);
    });

    it('has x-position getter/setter', () => {
      expect(slide.xPosition).toBe(0);
      slide.xPosition = 3;
      expect(slide.xPosition).toBe(3);
    });
  });

  describe('adding and removing annotations', () => {
    let slide: ProvenanceSlide;
    beforeEach(() => {
      slide = new ProvenanceSlide('test1', 1, 0, [new SlideAnnotation('haha')], testNode1);
    });

    describe('add annotations', () => {
      it('can add an annotation', () => {
        expect(slide.annotations[0].data).toEqual('haha');
        slide.addAnnotation(new SlideAnnotation('shiny!'));
        expect(slide.annotations[0].data).toEqual('haha');
        expect(slide.annotations[1].data).toEqual('shiny!');
      });
    });

    describe('can remove an annotation', () => {
      beforeEach(() => {
        slide.addAnnotation(new SlideAnnotation('shiny!'));
        slide.addAnnotation(new SlideAnnotation('awesome!'));
        slide.addAnnotation(new SlideAnnotation('insight!'));
      });

      it('should remove the slide', () => {
        expect(slide.annotations[0].data).toEqual('haha');
        expect(slide.annotations[3].data).toEqual('insight!');
        slide.removeAnnotation(slide.annotations[1]);
        expect(slide.annotations[2].data).toEqual('insight!');
      });
    });

    it('can listen to add/remove annotation', () => {
      const addCB = jest.fn();
      const removeCB = jest.fn();
      const annotation = new SlideAnnotation('shiny!');

      slide.on('addAnnotation', addCB);
      slide.on('removeAnnotation', removeCB);
      slide.addAnnotation(annotation);
      expect(addCB).toHaveBeenCalledWith(annotation);
      slide.removeAnnotation(annotation);
      expect(removeCB).toHaveBeenCalledWith(annotation);
    });
    it('can have listeners removed', () => {
      const addCB = jest.fn();
      const removeCB = jest.fn();
      const annotation = new SlideAnnotation('shiny!');

      slide.on('addAnnotation', addCB);
      slide.off('addAnnotation', addCB);
      slide.on('removeAnnotation', removeCB);
      slide.off('removeAnnotation', removeCB);
      slide.addAnnotation(annotation);
      expect(addCB).not.toHaveBeenCalled();
      slide.removeAnnotation(annotation);
      expect(removeCB).not.toHaveBeenCalled();
    });
  });
});
