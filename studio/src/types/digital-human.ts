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

/**
 * Request payload used to create a digital human.
 */
export interface CreateDigitalHumanRequest {
  /**
   * Optional explicit digital human identifier.
   */
  id?: string;

  /**
   * Human-readable digital human name.
   */
  name: string;

  /**
   * Optional avatar URL or path returned by the public API.
   */
  avatar?: string;

  /**
   * Optional contents to persist to `IDENTITY.md`.
   */
  identity?: string;

  /**
   * Optional contents to persist to `SOUL.md`.
   */
  soul?: string;

  /**
   * Full skill list that should exist in the workspace.
   */
  skills?: string[];
}

/**
 * Public result returned after creating a digital human.
 */
export interface CreateDigitalHumanResult extends DigitalHuman {
  /**
   * Full skill list synchronized into the workspace.
   */
  skills: string[];

  /**
   * Relative workspace path created for the digital human.
   */
  workspace: string;
}
