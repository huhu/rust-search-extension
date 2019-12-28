const crateSearcher = new CrateSearch(crateIndex);
const omnibox = new Omnibox();

(async () => {
    await crateSearcher.ensureLatestCrateIndex();
    await omnibox.bootstrap();
})();