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

#[derive(Debug)]
pub(crate) struct MappingMinifier {
    mapping: HashMap<String, String>,
}

impl MappingMinifier {
    const UPPERCASE_LETTERS: &'static str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    pub fn new(words: &Vec<String>, top: usize) -> MappingMinifier {
        assert!(top < Self::UPPERCASE_LETTERS.len());
        let mut mapping: HashMap<String, usize> = HashMap::new();
        words
            .iter()
            .flat_map(|sentence| {
                sentence
                    .unicode_words()
                    .into_iter()
                    .filter(|word| word.len() >= 5)
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
        frequency_words.sort_by(|a, b| b.frequency.cmp(&a.frequency));
        let words = frequency_words
            .drain(0..=top)
            .collect::<Vec<FrequencyWord>>();

        MappingMinifier {
            mapping: words
                .iter()
                .enumerate()
                .map(|(index, fw)| {
                    (
                        fw.word.clone(),
                        format!("${}", Self::UPPERCASE_LETTERS.chars().nth(index).unwrap()),
                    )
                })
                .collect(),
        }
    }

    pub fn minify(&self, value: String) -> String {
        value
            .split_word_bounds()
            .into_iter()
            .map(|item| self.mapping.get(item).map(Deref::deref).unwrap_or(item))
            .collect()
    }
}

pub(crate) fn minify_url(url: String) -> String {
    url.to_lowercase()
        .replace("http://", "")
        .replace("https://", "")
        .replace("docs.rs", "D")
        .replace("crates.io", "C")
        .replace("github.io", "O")
        .replace("github.com", "G")
        .replace("index.html", "I")
}

pub(crate) fn minify_json(json: String) -> String {
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
