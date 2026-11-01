import type { CampusScene } from '../../src/scene/CampusScene';

declare global {
  interface Window { __ccc?: CampusScene }
}
