export interface ISlide {
  duration: number;
}

export enum STATUS {
  IDLE,
  PLAYING
}

const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

export class ProvenanceSlidedeckPlayer<T extends ISlide> {
  private readonly _selectCallback: (slide: T) => any;
  private readonly _slides: T[];
  private _currentSlideIndex: number;
  private _status: STATUS;

  constructor(slides: T[], selectCallback: (slide: T) => any) {
    this._selectCallback = selectCallback;
    this._slides = slides;
    this._currentSlideIndex = 0;
    this._status = STATUS.IDLE;
  }

  public setSlideIndex(slideIndex: number) {
    this._currentSlideIndex = slideIndex;
  }

  public get slides() {
    return this._slides;
  }

  public get currentSlideIndex() {
    return this._currentSlideIndex;
  }
  public set currentSlideIndex(index: number) {
    this._currentSlideIndex = index;
  }
  public async play() {
    const shouldPlayNext = () =>
      this._status === STATUS.PLAYING && this._currentSlideIndex < this._slides.length - 1;

    if (this._status === STATUS.IDLE) {
      this._status = STATUS.PLAYING;
      this._selectCallback(this._slides[this._currentSlideIndex]);
      do {
        const slide = this._slides[this._currentSlideIndex];
        await wait(slide.duration);
        if (shouldPlayNext()) {
          this._currentSlideIndex += 1;
          this._selectCallback(this._slides[this._currentSlideIndex]);
        }
      } while (shouldPlayNext());
    }
    this._status = STATUS.IDLE;
  }
  public next() {
    this._currentSlideIndex += 1;
    this._selectCallback(this._slides[this._currentSlideIndex]);
  }
  public get status() {
    return this._status;
  }

  public stop() {
    this._status = STATUS.IDLE;
  }
}
