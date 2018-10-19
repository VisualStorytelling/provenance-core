import { generateUUID } from './utils';
import mitt from './mitt';
import { Handler, ISlideAnnotation } from './api';

export type AnnotationData = any;

export class SlideAnnotation implements ISlideAnnotation {
  // todo: interface
  private readonly _id: string;
  private _data: AnnotationData;
  private _mitt: any;

  constructor(data: any) {
    this._id = generateUUID();
    this._data = data;
    this._mitt = mitt();
  }

  public get id(): string {
    return this._id;
  }

  public set data(value: AnnotationData | null) {
    this._data = value;
    this._mitt.emit('change', value);
  }

  public get data(): AnnotationData {
    return this._data;
  }

  public on(type: string, handler: Handler) {
    this._mitt.on(type, handler);
  }

  public off(type: string, handler: Handler) {
    this._mitt.off(type, handler);
  }
}
