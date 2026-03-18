/**
 * Describes the public digital human payload exposed by DIP Studio.
 */
export interface DigitalHuman {
  /**
   * Stable digital human identifier.
   */
  id: string;

  /**
   * Human-readable digital human name.
   */
  name: string;

  /**
   * Optional avatar URL or path.
   */
  avatar?: string;
}

/**
 * Public digital human list response.
 */
export type DigitalHumanList = DigitalHuman[];
