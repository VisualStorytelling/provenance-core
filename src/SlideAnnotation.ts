import { generateUUID } from './utils';
import mitt from './mitt';
import { Handler, ISlideAnnotation } from './api';
import { getAnnotator, registry, ScreenCoordinates } from "./Annotator";

export type AnnotationData = any;

/**
 * SlideAnnotation are user created texts at specific coordinates
 * @typeparam T  Transformed coordinates type.
 */
export class SlideAnnotation<T> implements ISlideAnnotation<T> {
  private readonly _id: string;

  /** Any data ( text, font size etc) */
  private _data: AnnotationData;

  /** Event pub/sub */
  private _mitt: any;

  /** Internal representation of coordinates */
  private _coords: T;

  /** Reference to an Annotator that created this `Annotation` -
   *  so we know how to transform back to screenCoordinates)
   */
  private _annotatorName: string;
  public on: (type: string, handler: Handler) => any;
  public off: (type: string, handler: Handler) => any;

  constructor(data: any, coords: T, annotatorName: string) {
    this._id = generateUUID();
    this._data = data;
    this._coords = coords;
    this._annotatorName = annotatorName;
    this._mitt = mitt();
    this.on = this._mitt.on;
    this.off = this._mitt.off;
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

  public get annotatorName(): string {
    return this._annotatorName;
  }

  /**
   * Get internal coordinate representation
   * @returns {T} Internal coordinates
   */
  public get coords(): T {
    return this._coords;
  }

  /**
   * Try to move Annotation to new coordinates
   * @param {ScreenCoordinates} coords  Target screen coordinates
   * @returns {boolean} whether move was successful (accepted by Annotator)
   */
  public tryMove(coords: ScreenCoordinates) {
    const annotator = getAnnotator(coords);
    if (annotator) {
      this._coords = annotator.fromScreenCoordinates(coords);
      this._annotatorName = annotator.name;
      this._mitt.emit('move');
      return true;
    }
    return false;
  }

  /**
   * Get screen coordinates. Searches registry for `annotation.annotatorName` and transforms
   *
   * @returns  Screen coordinates for given `annotation`.
   * @throws   Will throw an error if no `Annotator` for `annotation.annotatorName` is found in the registry.
   */
  public get screenCoords(): ScreenCoordinates {
    for (const annotator of registry) {
      if (annotator.name === this.annotatorName) {
        return annotator.toScreenCoordinates(this.coords);
      }
    }
    throw new Error('No annotator found matching name: ' + this.annotatorName);
  }
}

