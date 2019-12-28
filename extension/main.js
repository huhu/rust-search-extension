let latestCrateIndexVersion = CrateSearch.getLatestIndexVersion();

// Load the latest crates index if we got one.
const crateSearcher = new CrateSearch(CrateSearch.getLatestCrateIndex(),
    latestCrateIndexVersion > 1 ? latestCrateIndexVersion : 1);

const omnibox = new Omnibox();
omnibox.bootstrap();