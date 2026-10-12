import { DEMO_USER, FAKE_SMS_CODE, FakeAuthService } from '../../auth/FakeAuthService';
import { FakeSavedSearchRepository } from '../FakeSavedSearchRepository';
import { findSavedSearch } from '../SavedSearchRepository';

describe('FakeSavedSearchRepository', () => {
  it('saves a trimmed query for the signed-in user', async () => {
    const repo = new FakeSavedSearchRepository(new FakeAuthService());

    const saved = await repo.saveSearch('  bike  ');

    expect(saved).toMatchObject({ query: 'bike', userId: DEMO_USER.id });
    expect(await repo.listSavedSearches()).toEqual([saved]);
  });

  it('lists newest first', async () => {
    const repo = new FakeSavedSearchRepository(new FakeAuthService());
    await repo.saveSearch('bike');
    await repo.saveSearch('sofa');

    expect((await repo.listSavedSearches()).map((s) => s.query)).toEqual(['sofa', 'bike']);
  });

  it('does not duplicate the same query, ignoring case', async () => {
    const repo = new FakeSavedSearchRepository(new FakeAuthService());
    const first = await repo.saveSearch('Bike');

    const again = await repo.saveSearch(' bIKE ');

    expect(again.id).toBe(first.id);
    expect(await repo.listSavedSearches()).toHaveLength(1);
  });

  it('rejects an empty query', async () => {
    const repo = new FakeSavedSearchRepository(new FakeAuthService());
    await expect(repo.saveSearch('   ')).rejects.toThrow();
  });

  it('deletes by id', async () => {
    const repo = new FakeSavedSearchRepository(new FakeAuthService());
    const bike = await repo.saveSearch('bike');
    await repo.saveSearch('sofa');

    await repo.deleteSavedSearch(bike.id);
    await repo.deleteSavedSearch('unknown');

    expect((await repo.listSavedSearches()).map((s) => s.query)).toEqual(['sofa']);
  });

  it("keeps each user's searches separate", async () => {
    const auth = new FakeAuthService();
    const repo = new FakeSavedSearchRepository(auth);
    const mine = await repo.saveSearch('bike');

    await auth.signOut();
    await expect(repo.listSavedSearches()).rejects.toThrow(/Sign in/);

    await (await auth.startPhoneSignIn('+972501234567')).confirm(FAKE_SMS_CODE);
    expect(await repo.listSavedSearches()).toEqual([]);
    await repo.deleteSavedSearch(mine.id); // not theirs: ignored
    const theirs = await repo.saveSearch('BIKE'); // same text, different user: a new search
    expect(theirs.id).not.toBe(mine.id);
  });

  it('findSavedSearch matches ignoring case and spaces', () => {
    const search = { id: 's1', userId: 'u1', query: 'Bike', createdAt: '2026-10-12T00:00:00Z' };
    expect(findSavedSearch([search], ' bIKE ')).toBe(search);
    expect(findSavedSearch([search], 'bikes')).toBeUndefined();
  });
});
