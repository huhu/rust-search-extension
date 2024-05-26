// 6 week release gap.
const RUST_RELEASE_GAP = 6 * 7;

function getScheduledVersions(limit = 10) {
    let versions = [];
    let startMinor = 42;
    let date = new Date("2020-03-12");
    let today = new Date();
    // Set to the start seconds of today
    today.setHours(0, 0, 0);
    for (let i = 1, j = 1; j <= limit; i++) {
        date.setDate(date.getDate() + RUST_RELEASE_GAP);
        if (date >= today) {
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

function getReleasedVersions() {
    let versions = [];
    let nextVersion = getScheduledVersions(1)[0];
    let startMinor = nextVersion.minor;
    let date = nextVersion.date;
    let now = new Date();
    for (let i = startMinor, j = 1; i > 1; i--) {
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
    // Version 1.0.0 is a special release date.
    versions.push({
        number: "1.0.0",
        major: 1,
        minor: 0,
        fix: 0,
        date: new Date("2015-05-15"),
    });
    return versions;
}

export { getScheduledVersions };