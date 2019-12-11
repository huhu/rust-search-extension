let latestCrateIndexVersion = CrateSearch.getLatestIndexVersion();

// Load the latest crates index if we got one.
const crateSearcher = latestCrateIndexVersion > 1 ?
    new CrateSearch(CrateSearch.getLatestCrateIndex(), latestCrateIndexVersion) : new CrateSearch(crateIndex);

const omnibox = new Omnibox();
omnibox.bootstrap();