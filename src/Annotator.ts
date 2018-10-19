export const registry: Annotator<any>[] = [];

export interface ScreenCoordinates {
  x: number;
  y: number;
}

/**
 * Check if screen coordinates are accepted.
 *
 * @param coords  the screenCoordinates to check
 * @returns       false if coords are not accepted, otherwise false
 */
export type IacceptsScreenCoordinates = (coords: ScreenCoordinates) => boolean;


/**
 * Transform coordinates from screen coordinates to coordinates of type T
 *
 * @typeparam T   Transformed coordinates type.
 * @param coords  the screenCoordinates to convert
 * @returns       Internal representation of coordinates
 */
export type IfromScreenCoordinates<T> = (coords: ScreenCoordinates) => T | false;

/**
 * Transform internal representation type T of coordinates back to screen coordinates
 *
 * @typeparam T  Transformed coordinates type.
 * @returns      screen coordinates
 */
export type ItoScreenCoordinates<T> = (t: T) => ScreenCoordinates;

/** Annotator is an object that accepts or rejects annotation at certain screen coordinates.
 */
export class Annotator<T> {
  /**
   * @param name                      Name to identify this annotator by.
   * @param acceptsScreenCoordinates  function that accepts/rejects annotation at coordinates.
   *                                  Should return true/false.
   * @param fromScreenCoordinates     Transforms screen coordinates to coordinates of type T.
   * @param toScreenCoordinates       Transforms internal coordinates of type T back to screen coordinates.
   */
  public constructor(
    public name: string,
    public acceptsScreenCoordinates: IacceptsScreenCoordinates,
    public fromScreenCoordinates: IfromScreenCoordinates<T>,
    public toScreenCoordinates: ItoScreenCoordinates<T>
  ) {
  }
}

/**
 * Registers an annotator
 *
 * @param annotator  Annotator to register
 */
export const registerAnnotator = (annotator: Annotator<any>) => {
  registry.push(annotator);
};

/**
 * Try each annotator in the registry if it accepts coordinates at `coords`.
 * If one does, return the annotator, otherwise `undefined`.
 *
 * @param coords  Coordinates to find `Annotator for`.
 * @returns       Matching `Annotator` for `coords` or `undefined`.
 */
export const getAnnotator = (coords: ScreenCoordinates): Annotator<any> | undefined => {
  for (const annotator of registry) {
    if (annotator.acceptsScreenCoordinates(coords)) {
      return annotator;
    }
  }
};

/** identityAnnotator maps ScreenCoordinates to ScreenCoordinates, accepts all */
const identityAnnotator = new Annotator<ScreenCoordinates>(
  'identityAnnotator',
  (coords) => true,
  (coords) => coords,
  (coords) => coords,
);

registerAnnotator(identityAnnotator);
