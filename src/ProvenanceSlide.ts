import { IProvenanceSlide, ProvenanceNode, Handler } from './api';
import { generateUUID } from './utils';
import { SlideAnnotation } from './SlideAnnotation';
import mitt from './mitt';

export class ProvenanceSlide implements IProvenanceSlide {
  private _id: string;
  private _node: ProvenanceNode | null;
  private _name: string;
  private _duration: number;
  private _delay: number;
  private _annotations: SlideAnnotation<any>[];
  private _mitt: any;

  constructor(
    name: string,
    duration: number,
    delay: number,
    annotations: SlideAnnotation<any>[] = [],
    node: ProvenanceNode | null = null
  ) {
    this._id = generateUUID();
    this._name = name;
    this._duration = duration;
    this._delay = delay;
    this._annotations = annotations;
    this._node = node;
    this._mitt = mitt();
  }

  public get id(): string {
    return this._id;
  }

  public get node(): ProvenanceNode | null {
    return this._node;
  }

  public set node(value: ProvenanceNode | null) {
    this._node = value;
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
  }

  public get duration(): number {
    return this._duration;
  }

  public set duration(value: number) {
    this._duration = value;
  }

  public get delay(): number {
    return this._delay;
  }

  public set delay(value: number) {
    this._delay = value;
  }

  public addAnnotation(annotation: SlideAnnotation<any>) {
    this._annotations.push(annotation);
    this._mitt.emit('addAnnotation', annotation);
  }

  public removeAnnotation(annotation: SlideAnnotation<any>) {
    const index = this._annotations.indexOf(annotation);
    this._annotations.splice(index, 1);
    this._mitt.emit('removeAnnotation', annotation);
  }

  public get annotations() {
    return this._annotations;
  }

  public on(type: string, handler: Handler) {
    this._mitt.on(type, handler);
  }

  public off(type: string, handler: Handler) {
    this._mitt.off(type, handler);
  }
}
