/**
 * Global levenshtein_row2 array which used in function levenshtein().
 * @type {Array}
 */
const levenshtein_row2 = [];

/**
 * A function to compute the Levenshtein distance between two strings
 * Licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported
 * Full License can be found at http://creativecommons.org/licenses/by-sa/3.0/legalcode
 * This code is an unmodified version of the code written by Marco de Wit
 * and was found at http://stackoverflow.com/a/18514751/745719
 */
function levenshtein(s1, s2) {
    if (s1 === s2) {
        return 0;
    }
    const s1_len = s1.length, s2_len = s2.length;
    if (s1_len && s2_len) {
        let i1 = 0, i2 = 0, a, b, c, c2;
        const row = levenshtein_row2;
        while (i1 < s1_len) {
            row[i1] = ++i1;
        }
        while (i2 < s2_len) {
            c2 = s2.charCodeAt(i2);
            a = i2;
            ++i2;
            b = i2;
            for (i1 = 0; i1 < s1_len; ++i1) {
                c = a + (s1.charCodeAt(i1) !== c2 ? 1 : 0);
                a = row[i1];
                b = b < a ? (b < c ? b + 1 : c) : (a < c ? a + 1 : c);
                row[i1] = b;
            }
        }
        return b;
    }
    return s1_len + s2_len;
}