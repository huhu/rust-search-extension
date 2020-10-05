function CaniuseSearch(index) {
  this.feats = {};
  index.forEach(([ver, flag, title, rfc]) => {
    let searchTerm = `${flag}: ${title}`.replace(/[-_\s#\?]/ig, "");
    this.feats[searchTerm] = { ver, flag, title, rfc };
  });
  this.searchTerms = Object.keys(this.feats);
}

CaniuseSearch.prototype.search = function (rawKeyword) {
  let keyword = rawKeyword.replace(/[-_\s#\?]/ig, "");
  let result = [];

  for (let searchTerm of this.searchTerms) {
    if (searchTerm.length < keyword.length) continue;

    let foundAt = searchTerm.indexOf(keyword);
    if (foundAt > -1) {
      let rfc = this.feats[searchTerm].rfc;
      // skip those without RFC when searching for RFCs
      if (!(rawKeyword.startsWith("??") && rfc == null)) {
        result.push({
          ver: this.feats[searchTerm].ver,
          flag: this.feats[searchTerm].flag,
          title: this.feats[searchTerm].title,
          rfc,
          matchIndex: foundAt,
        });
      }
    }
  }

  return result;
};
