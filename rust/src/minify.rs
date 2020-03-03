use std::cmp;
use std::collections::HashMap;
use std::ops::Deref;

use minifier::js::{
    aggregate_strings_into_array_filter, simple_minify, Keyword, ReservedChar, Token, Tokens,
};
use unicode_segmentation::UnicodeSegmentation;

#[derive(Debug)]
struct FrequencyWord {
    word: String,
    frequency: usize,
}

impl FrequencyWord {
    #[inline]
    fn score(&self) -> usize {
        self.word.len() * self.frequency
    }
}

#[derive(Debug)]
pub struct Minifier {
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
            .into_iter()
            .map(|(word, frequency)| FrequencyWord { word, frequency })
            .collect::<Vec<FrequencyWord>>();
        frequency_words.sort_by(|a, b| b.score().cmp(&a.score()));

        let keys: Vec<String> = Self::PREFIX
            .chars()
            .flat_map(|prefix| {
                Self::SUFFIX
                    .chars()
                    .map(|suffix| format!("{}{}", prefix, suffix))
                    .collect::<Vec<String>>()
            })
            .collect();
        let words = frequency_words
            // Get the min value to prevent drain method panic
            .drain(0..cmp::min(keys.len(), words.len()))
            .collect::<Vec<FrequencyWord>>();

        Minifier {
            mapping: words
                .iter()
                .enumerate()
                .map(|(index, fw)| (fw.word.clone(), keys.get(index).unwrap().to_owned()))
                .collect(),
        }
    }

    pub fn get_mapping(&self) -> HashMap<String, String> {
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

    pub fn minify_json(json: String) -> String {
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
