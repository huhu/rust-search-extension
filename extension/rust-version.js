// 6 week release gap.
const RUST_RELEASE_GAP = 6 * 7;

function getNextStableVersions(limit = 10) {
    let versions = [];
    let startMinor = 42;
    let date = new Date("2020-03-12");
    let now = new Date();
    for (let i = 1, j = 1; j <= limit; i++) {
        date.setDate(date.getDate() + RUST_RELEASE_GAP);
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

function getPreviousStableVersions() {
    let versions = [];
    let nextVersion = getNextStableVersions(1)[0];
    let startMinor = nextVersion.minor;
    let date = nextVersion.date;
    let now = new Date();
    for (let i = startMinor, j = 1; i > 0; i--) {
        date.setDate(date.getDate() - RUST_RELEASE_GAP);
        if (date <= now) {
            let minor = startMinor - j;
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