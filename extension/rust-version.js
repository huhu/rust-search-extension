function getNextStableVersions(limit = 10) {
    let versions = [];
    let startMinor = 42;
    let date = new Date("2020-03-12");
    let now = new Date();
    for (let i = 1, j = 1; j <= limit; i++) {
        date.setDate(date.getDate() + 42);
        if (date >= now) {
            let minor = startMinor + i;
            versions.push({
                number: "1." + minor + ".0",
                major: 1,
                minor,
                fix: 0,
                date: new Date(date),
            });
            j += 1;
        }
    }
    return versions;
}