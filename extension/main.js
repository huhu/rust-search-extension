const deminifier = new Deminifier(mapping);
const crateSearcher = new CrateSearch(crateIndex);
const attributeSearcher = new AttributeSearch();
const omnibox = new Omnibox();

(async () => {
    await crateSearcher.ensureLatestCrateIndex();
    await omnibox.bootstrap();
})();