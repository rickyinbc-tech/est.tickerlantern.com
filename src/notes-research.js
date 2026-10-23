// The study keeps its reviewed snapshot while sharing the apex domain.
export function isNotesResearchPath(path) {
  return /^\/(?:notes(?:\/.*)?|indices(?:\/.*)?|gics\/?|probabilities\/?|scenarios\/?|methodology\/?|sources\/?|downloads(?:\/.*)?|notes-app\/.*|api\/notes\/health)$/.test(path);
}

export async function handleNotesResearch(request, env) {
  if (!env.NOTES_RESEARCH) return new Response('Research is temporarily unavailable.', {status:503});
  const url = new URL(request.url);
  if (url.pathname === '/api/notes/health') {
    url.pathname = '/api/health';
    request = new Request(url, request);
  }
  return env.NOTES_RESEARCH.fetch(request);
}
