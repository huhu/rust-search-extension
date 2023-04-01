use minifier::js::{
    aggregate_strings_into_array_filter, simple_minify, Keyword, ReservedChar, Token, Tokens,
};
use rayon::prelude::*;
use std::cmp;
use std::cmp::Reverse;
use std::collections::HashMap;
use std::ops::Deref;
use unicode_segmentation::UnicodeSegmentation;

#[derive(Debug)]
struct FrequencyWord {
    word: String,
    frequency: usize,
}

impl FrequencyWord {
    #[inline]
    fn score(&self) -> usize {
        // Due to the prefix + suffix occupying two letters,
        // we should minus the length to calculate the score.
        // This will lead to a 0.4% reduction in file size.
        (self.word.len() - 2) * self.frequency
    }
}

#[derive(Debug)]
pub struct Minifier {
    // A word to keys mapping. Such as <"cargo", "$0">.
    mapping: HashMap<String, String>,
}

impl Minifier {
    const PREFIX: &'static str = "@$^&";
    const SUFFIX: &'static str = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    pub fn new(words: &[String]) -> Minifier {
        let mut mapping: HashMap<String, usize> = HashMap::new();
        words
            .iter()
            .flat_map(|sentence| {
                sentence
                    .unicode_words()
                    .filter(|word| word.len() >= 3)
                    .collect::<Vec<&str>>()
            })
            .for_each(|word| {
                let count = mapping.entry(word.to_string()).or_insert(0);
                *count += 1;
            });
        let mut frequency_words = mapping
            .into_par_iter()
            .map(|(word, frequency)| FrequencyWord { word, frequency })
            .collect::<Vec<FrequencyWord>>();
        frequency_words.par_sort_by_key(|b| Reverse(b.score()));

        let keys: Vec<String> = Self::PREFIX
            .chars()
            .flat_map(|prefix| {
                Self::SUFFIX
                    .chars()
                    .map(|suffix| format!("{prefix}{suffix}"))
                    .collect::<Vec<String>>()
            })
            .collect();
        let words = frequency_words
            // Get the min value to prevent drain method panic
            .drain(0..cmp::min(keys.len(), words.len()))
            .collect::<Vec<FrequencyWord>>();

        Minifier {
            mapping: words
                .into_par_iter()
                .enumerate()
                .map(|(index, fw)| (fw.word, keys.get(index).unwrap().to_owned()))
                .collect(),
        }
    }

    // Get the key to word mapping to help Javascript to decode the minified string.
    pub fn get_key_to_word_mapping(&self) -> HashMap<String, String> {
        self.mapping
            .iter()
            .map(|(key, value)| (value.to_owned(), key.to_owned()))
            .collect()
    }

    #[inline]
    pub fn mapping_minify_crate_id(&self, value: String) -> String {
        let vec: Vec<&str> = value
            .split(|c| c == '_')
            .map(|item| self.mapping.get(item).map(Deref::deref).unwrap_or(item))
            .collect();
        vec.join("_")
    }

    #[inline]
    pub fn mapping_minify(&self, value: String) -> String {
        value
            .split_word_bounds()
            .map(|item| self.mapping.get(item).map(Deref::deref).unwrap_or(item))
            .collect()
    }

    #[inline]
    pub fn minify_js(json: String) -> String {
        let tokens: Tokens = simple_minify(&json)
            .into_iter()
            .map(|(token, _)| match token {
                Token::Keyword(Keyword::Null) => Token::Other("N"),
                _ => token,
            })
            .collect::<Vec<_>>()
            .into();
        aggregate_strings_into_array_filter(tokens, "C", |tokens, position| {
            // Ignore the key of json (AKA, the crate id).
            position > 5 && !tokens[position + 1].eq_char(ReservedChar::Colon)
        })
        .to_string()
    }
}
