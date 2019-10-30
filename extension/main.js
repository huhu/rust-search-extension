window.nullOrDefault = function nullOrDefault(value, defaultValue) {
    return value === null ? defaultValue : value;
};

const omnibox = new Omnibox();
omnibox.bootstrap();