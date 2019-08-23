import mitt from './mitt';
import {
  IProvenanceSlidedeck,
  IProvenanceGraphTraverser,
  IProvenanceGraph,
  Application,
  Handler,
  IProvenanceSlide,
  IScreenShotProvider
} from './api';
import { ProvenanceSlide } from './ProvenanceSlide';

export class ProvenanceSlidedeck implements IProvenanceSlidedeck {
  private _application: Application;
  private _graph: IProvenanceGraph;
  private _mitt: any;
  private _slides: IProvenanceSlide[] = [];
  private _traverser: IProvenanceGraphTraverser;
  private _selectedSlide: IProvenanceSlide | null;

  private _screenShotProvider: IScreenShotProvider | null = null;
  private _autoScreenShot = false;

  constructor(application: Application, traverser: IProvenanceGraphTraverser) {
    this._mitt = mitt();
    this._application = application;
    this._graph = traverser.graph;
    this._traverser = traverser;

    this._selectedSlide = null;
  }

  public get application() {
    return this._application;
  }

  public addSlide(slide?: IProvenanceSlide, index?: number): IProvenanceSlide {
    if (
      !index ||
      isNaN(index) ||
      !Number.isInteger(index) ||
      index > this._slides.length ||
      index < 0
    ) {
      index = this._slides.length;
    }
    if (slide && this._slides.indexOf(slide) >= 0) {
      throw new Error('Cannot add a slide that is already in the deck');
    }
    if (!slide) {
      const node = this._graph.current;
      slide = new ProvenanceSlide(node.label, 1, 0, [], node);
    }
    if (this.autoScreenShot && this.screenShotProvider) {
      try {
        slide.metadata.screenShot = this.screenShotProvider();
      } catch (e) {
        console.warn('Error while getting screenshot', e);
      }
    }
    if (this._slides.length === 0) {
      this._selectedSlide = slide;
    }
    this._slides.splice(index, 0, slide);
    this._mitt.emit('slideAdded', slide);

    return slide;
  }

  public removeSlideAtIndex(index: number) {
    const deletedSlides = this._slides.splice(index, 1);

    // This can only be 1 slide now, therefore this is ok.
    if (this._selectedSlide === deletedSlides[0]) {
      this.selectedSlide = null;
    }
    this._mitt.emit('slideRemoved', deletedSlides[0]);
  }

  public removeSlide(slide: IProvenanceSlide) {
    this.removeSlideAtIndex(this._slides.indexOf(slide));
  }

  public get selectedSlide(): IProvenanceSlide | null {
    return this._selectedSlide;
  }

  public moveSlide(indexFrom: number, indexTo: number) {
    if (indexTo < 0 || indexTo > this.slides.length - 1) {
      throw new Error('target index out of bounds');
    }

    this._slides.splice(indexTo, 0, this._slides.splice(indexFrom, 1)[0]);

    this._mitt.emit('slidesMoved', this._slides);
  }

  public startTime(slide: IProvenanceSlide) {
    const index = this._slides.indexOf(slide);
    let previousTime = 0;
    for (let i = 0; i < index; i++) {
      previousTime += this._slides[i].transitionTime;
      previousTime += this._slides[i].duration;
    }
    return previousTime;
  }

  public slideAtTime(time: number) {
    let index = 0;
    let currentSlide = null;

    while (time >= 0 && index < this.slides.length) {
      currentSlide = this.slides[index];
      const nextSlideOffset = currentSlide.transitionTime + currentSlide.duration;

      if (time - nextSlideOffset < 0) {
        break;
      }

      time -= nextSlideOffset;
      index++;
    }

    return currentSlide;
  }

  public set selectedSlide(slide: IProvenanceSlide | null) {
    if (slide && slide.node) {
      this._traverser.toStateNode(slide.node.id, slide.transitionTime);
    }
    this._selectedSlide = slide;
    this._mitt.emit('slideSelected', slide);
  }

  public get slides() {
    return this._slides;
  }

  next() {
    if (this._selectedSlide !== null) {
      let currentIndex = this._slides.indexOf(this._selectedSlide);
      if (currentIndex < this._slides.length - 1) {
        currentIndex += 1;
        this.selectedSlide = this._slides[currentIndex];
      } else {
        this.selectedSlide = this._slides[0];
      }
    }
  }
  previous() {
    if (this._selectedSlide !== null) {
      let currentIndex = this._slides.indexOf(this._selectedSlide);
      if (currentIndex > 0) {
        currentIndex -= 1;
        this.selectedSlide = this._slides[currentIndex];
      } else {
        this.selectedSlide = this._slides[this._slides.length - 1];
      }
    }
  }

  public get graph() {
    return this._graph;
  }

  get screenShotProvider() {
    return this._screenShotProvider;
  }

  set screenShotProvider(provider: IScreenShotProvider | null) {
    this._screenShotProvider = provider;
  }

  get autoScreenShot(): boolean {
    return this._autoScreenShot;
  }

  set autoScreenShot(value: boolean) {
    this._autoScreenShot = value;
    if (value && !this._screenShotProvider) {
      console.warn('Setting autoScreenShot to true, but no screenShotProvider is set');
    }
  }

  on(type: string, handler: Handler) {
    this._mitt.on(type, handler);
  }

  off(type: string, handler: Handler) {
    this._mitt.off(type, handler);
  }
}
