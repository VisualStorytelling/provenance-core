import { SlideAnnotation } from '../src/SlideAnnotation';

describe('SlideAnnotation', () => {
  beforeEach(() => {});

  it('can be created', () => {
    const data = { some: 'data' };
    const annotation = new SlideAnnotation(data);
    expect(annotation.data).toEqual(data);
    expect(annotation.id).toHaveLength(36); // serialized UUID4
  });

  it('can be listened for data change', () => {
    const data = { some: 'data' };
    const annotation = new SlideAnnotation(data);

    const cb = jest.fn();
    annotation.on('change', cb);

    const newData = { someNew: 'data' };
    annotation.data = newData;
    expect(cb).toHaveBeenCalledWith(newData);
  });

  it('listener can be removed', () => {
    const data = { some: 'data' };
    const annotation = new SlideAnnotation(data);
    const cb = jest.fn();
    annotation.on('change', cb);
    annotation.off('change', cb);
    annotation.data = { someNew: 'data' };
    expect(cb).not.toHaveBeenCalled();
  });
});
