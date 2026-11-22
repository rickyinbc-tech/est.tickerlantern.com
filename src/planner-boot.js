// Runs before first paint: lets the stylesheet show one conversation at a time.
// Without JavaScript every conversation stays visible on one long page.
document.documentElement.classList.add('pc-tabs');
