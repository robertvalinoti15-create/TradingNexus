// Real photos are available for whole articles (via og:image), but Google
// News' RSS links route through a JS-driven interstitial (news.google.com)
// rather than a plain HTTP redirect, so there's no reliable way to resolve
// the true article URL server-side and scrape its image. These are
// category-level images instead — real photos from Wikimedia Commons
// (same free, keyless source already used for the "About" sections),
// picked per news feed rather than per headline.
export interface CategoryImage {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

export const NEWS_CATEGORY_IMAGES: Record<string, CategoryImage> = {
  tech: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Silicon_Valley%2C_facing_southward_towards_Downtown_San_Jose%2C_2014_%28cropped%29.jpg/500px-Silicon_Valley%2C_facing_southward_towards_Downtown_San_Jose%2C_2014_%28cropped%29.jpg",
    alt: "Aerial view of Silicon Valley",
    credit: "Silicon Valley, via Wikimedia Commons",
    creditUrl: "https://en.wikipedia.org/wiki/Silicon_Valley",
  },
  economy: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Capitol_Building_Full_View.jpg/500px-Capitol_Building_Full_View.jpg",
    alt: "The United States Capitol building",
    credit: "United States Capitol, via Wikimedia Commons",
    creditUrl: "https://en.wikipedia.org/wiki/United_States_Capitol",
  },
  crypto: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/500px-Bitcoin.svg.png",
    alt: "The Bitcoin logo",
    credit: "Bitcoin, via Wikimedia Commons",
    creditUrl: "https://en.wikipedia.org/wiki/Bitcoin",
  },
  commodities: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Gold_bullion_2.jpg/500px-Gold_bullion_2.jpg",
    alt: "Stacked gold bullion bars",
    credit: "Gold bar, via Wikimedia Commons",
    creditUrl: "https://en.wikipedia.org/wiki/Gold_bar",
  },
};
