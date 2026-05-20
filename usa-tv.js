async function searchResults(query) {
  const q = query.toLowerCase().trim();
  let filtered;
  if (!q || q === "all") {
    filtered = CHANNELS;
  } else {
    filtered = CHANNELS.filter(ch =>
      ch.name.toLowerCase().includes(q) ||
      ch.genre.toLowerCase().includes(q)
    );
  }
  return filtered.map(ch => ({
    title: ch.name,
    image: ch.logo,
    href: ch.id,
  }));
}

async function extractDetails(href) {
  const ch = CHANNELS.find(c => c.id === href);
  if (!ch) return [];
  return [{
    title: ch.name,
    image: ch.poster || ch.logo,
    description: ch.genre + " • Live TV • USA",
    aliases: "Genre: " + ch.genre,
    href: href,
  }];
}

async function extractEpisodes(href) {
  const ch = CHANNELS.find(c => c.id === href);
  if (!ch) return [];
  return [{
    number: 1,
    title: "Watch Live",
    href: href,
  }];
}

async function extractStreamUrl(href) {
  const ch = CHANNELS.find(c => c.id === href);
  if (!ch || !ch.streams || ch.streams.length === 0) return null;

  const sorted = ch.streams.slice().sort(function(a, b) {
    const idxA = SOURCE_PRIORITY.indexOf(a.d);
    const idxB = SOURCE_PRIORITY.indexOf(b.d);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const streams = sorted.map(function(s) {
    return {
      url: s.url,
      quality: s.q + " [" + s.d + "]",
      subtitles: [],
      headers: {},
    };
  });

  return {
    streams: streams,
    subtitles: [],
  };
}
