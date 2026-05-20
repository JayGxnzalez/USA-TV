// USA TV Module for Sora/Shirox
// Sourced from the USA TV Stremio addon (baby-beamup.club)
// Sports, News, Entertainment, and more live US TV channels

const CATALOG_URL = "https://848b3516657c-usatv.baby-beamup.club/catalog/tv/all.json";
const LOGO_BASE = "https://848b3516657c-usatv.baby-beamup.club/public/logos/usa/";
const POSTER_BASE = "https://848b3516657c-usatv.baby-beamup.club/public/posters/usa/";

// Source priority order (best to worst quality/reliability)
// AX = a1xs.vip (private IPTV, HD)
// MJ = moveonjoy.com (private IPTV, HD)
// MJE = 23.237.104.106:8080 (private IPTV, HD)
// PLX = Plex (free, ad-supported)
// PTV = Pluto TV (free, ad-supported)
// TB = Tubi (free, ad-supported)
// XM = Xumo (free, ad-supported)
// LN = LocalNow (free, ad-supported)
// SMG = jmp2.uk redirects
// TP = tvpass.org (SD)
const SOURCE_PRIORITY = ["AX", "MJ", "MJE", "PLX", "PTV", "TB", "XM", "LN", "SMG", "ST", "STR", "CV", "TP"];

function getSourceLabel(url) {
  if (url.includes("a1xs.vip")) return "AX";
  if (url.includes("moveonjoy.com")) return "MJ";
  if (url.includes("23.237.104.106")) return "MJE";
  if (url.includes("epg.provider.plex.tv")) return "PLX";
  if (url.includes("pluto.tv")) return "PTV";
  if (url.includes("tubi.io")) return "TB";
  if (url.includes("cloudfront.net") || url.includes("xumo")) return "XM";
  if (url.includes("localnow") || url.includes("amdvids.com")) return "LN";
  if (url.includes("jmp2.uk")) return "SMG";
  if (url.includes("tvpass.org")) return "TP";
  if (url.includes("cvalley.net")) return "CV";
  if (url.includes("nexgen.bz")) return "STMR";
  return "ST";
}

async function fetchCatalog() {
  try {
    const resp = await fetchv2(CATALOG_URL, {}, "GET", null);
    const data = JSON.parse(resp);
    return data.metas || [];
  } catch (e) {
    return [];
  }
}

// searchResults: called when user searches or browses
// For live TV, we treat the genre filter as a "search" and channel name as query
async function searchResults(query) {
  const channels = await fetchCatalog();
  const q = query.toLowerCase().trim();

  let filtered;
  if (!q || q === "all") {
    filtered = channels;
  } else {
    filtered = channels.filter(ch =>
      ch.name.toLowerCase().includes(q) ||
      (ch.genre && ch.genre.toLowerCase().includes(q)) ||
      (ch.genres && ch.genres.some(g => g.toLowerCase().includes(q)))
    );
  }

  return filtered.map(ch => ({
    title: ch.name,
    image: ch.logo || (LOGO_BASE + ch.id.replace("ustv-", "") + ".png"),
    href: ch.id,
  }));
}

// extractDetails: called when user taps a channel
async function extractDetails(href) {
  const channels = await fetchCatalog();
  const ch = channels.find(c => c.id === href);
  if (!ch) return [];

  const genre = (ch.genres && ch.genres[0]) || ch.genre || "TV";
  return [{
    title: ch.name,
    image: ch.poster || ch.logo || "",
    description: `${genre} • Live TV • USA`,
    aliases: `Genre: ${genre}`,
    href: href,
  }];
}

// extractEpisodes: for live TV, we return a single "Live" episode
async function extractEpisodes(href) {
  const channels = await fetchCatalog();
  const ch = channels.find(c => c.id === href);
  if (!ch) return [];

  return [{
    number: 1,
    title: "Watch Live",
    href: href,
  }];
}

// extractStreamUrl: returns all available streams for the channel
async function extractStreamUrl(href) {
  const channels = await fetchCatalog();
  const ch = channels.find(c => c.id === href);
  if (!ch || !ch.streams || ch.streams.length === 0) return null;

  // Sort streams by source priority
  const sorted = [...ch.streams].sort((a, b) => {
    const labelA = getSourceLabel(a.url);
    const labelB = getSourceLabel(b.url);
    const idxA = SOURCE_PRIORITY.indexOf(labelA);
    const idxB = SOURCE_PRIORITY.indexOf(labelB);
    const rankA = idxA === -1 ? 999 : idxA;
    const rankB = idxB === -1 ? 999 : idxB;
    return rankA - rankB;
  });

  const streams = sorted.map(s => {
    const label = getSourceLabel(s.url);
    const quality = s.name || "HD";
    return {
      url: s.url,
      quality: `${quality} [${label}]`,
      subtitles: [],
      headers: {},
    };
  });

  return {
    streams: streams,
    subtitles: [],
  };
}
