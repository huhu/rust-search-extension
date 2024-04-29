use minifier::js::{
    aggregate_strings_into_array_filter, simple_minify, Keyword, ReservedChar, Token, Tokens,
};
use rayon::prelude::*;
use std::collections::HashMap;
use std::ops::Deref;
use unicode_segmentation::UnicodeSegmentation;

use crate::frequency::FrequencyWord;

#[derive(Debug)]
pub struct Minifier<'a> {
    // A word to keys mapping. Such as <"cargo", "$0">.
    mapping: HashMap<&'a str, String>,
}

impl<'a> Minifier<'a> {
    const PREFIX: &'static str = "@$^&";
    const SUFFIX: &'static str = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    pub fn new(frequency_words: &'a [FrequencyWord]) -> Minifier<'a> {
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
            .into_par_iter()
            .take(keys.len())
            .collect::<Vec<_>>();

        Minifier {
            mapping: words
                .into_par_iter()
                .enumerate()
                .map(|(index, fw)| (fw.word.as_str(), keys.get(index).unwrap().to_owned()))
                .collect(),
        }
    }

    // Get the key to word mapping to help Javascript to decode the minified string.
    pub fn get_key_to_word_mapping(&self) -> HashMap<String, String> {
        self.mapping
            .iter()
            .map(|(key, value)| (value.to_owned(), (*key).to_owned()))
            .collect()
    }

    #[inline]
    pub fn minify_crate_name(&self, name: &str) -> String {
        let vec: Vec<&str> = name
            .split(|c| c == '_' || c == '-')
            .map(|item| self.mapping.get(item).map(Deref::deref).unwrap_or(item))
            .collect();
        vec.join("_")
    }

    #[inline]
    pub fn minify_description(&self, description: &str) -> String {
        description
            .split_word_bounds()
            .map(|item| self.mapping.get(item).map(Deref::deref).unwrap_or(item))
            .collect()
    }

    #[inline]
    pub fn minify_js(json: &str) -> String {
        let tokens: Tokens = simple_minify(json)
            .into_iter()
            .map(|token| match token {
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
