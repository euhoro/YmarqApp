import { FakeProfileRepository } from './FakeProfileRepository';
import type { ProfileRepository } from './ProfileRepository';

export type { ProfileRepository } from './ProfileRepository';

/** The API implementation (#48) replaces the fake here. */
export function createProfileRepository(): ProfileRepository {
  return new FakeProfileRepository();
}
