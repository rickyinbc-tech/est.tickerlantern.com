// Versioned snapshots are monotonic; an equal version cannot change identity.
// Legacy feeds can be consumed during a coordinated additive migration only.
export function assertSnapshotAdvance(current, candidate) {
  if (!current) return candidate;
  const oldVersion = current.snapshotVersion, nextVersion = candidate.snapshotVersion;
  if (Number.isInteger(oldVersion)) {
    if (!Number.isInteger(nextVersion) || nextVersion < oldVersion) throw new Error('Older or unversioned snapshot rejected.');
    if (nextVersion === oldVersion && current.snapshotId !== candidate.snapshotId) throw new Error('Conflicting snapshot identity.');
  } else if (Date.parse(candidate.publishedAt) < Date.parse(current.publishedAt)) {
    throw new Error('Older snapshot rejected.');
  }
  if (Date.parse(candidate.publishedAt) < Date.parse(current.publishedAt)) throw new Error('Publication date regressed.');
  return candidate;
}
