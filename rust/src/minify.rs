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
    fn score(&self) -> usize {
        self.word.len() * self.frequency
    }
}

#[derive(Debug)]
pub(crate) struct Minifier {
    mapping: HashMap<String, String>,
}

impl Minifier {
    const UPPERCASE_LETTERS: &'static str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    pub fn new(words: &[String], top: usize) -> Minifier {
        assert!(top < Self::UPPERCASE_LETTERS.len());
        let mut mapping: HashMap<String, usize> = HashMap::new();
        words
            .iter()
            .flat_map(|sentence| {
                sentence
                    .unicode_words()
                    .filter(|word| word.len() >= 4)
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
        let words = frequency_words
            .drain(0..=top)
            .collect::<Vec<FrequencyWord>>();

        Minifier {
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

    pub fn get_mapping(&self) -> HashMap<String, String> {
        self.mapping
            .iter()
            .map(|(key, value)| (value.to_owned(), key.to_owned()))
            .collect()
    }

    pub fn mapping_minify(&self, value: String) -> String {
        value
            .split_word_bounds()
            .map(|item| self.mapping.get(item).map(Deref::deref).unwrap_or(item))
            .collect()
    }

    pub fn minify_url(url: String) -> String {
        url.to_lowercase()
            .replace("http://", "")
            .replace("https://", "")
            .replace("docs.rs", "D")
            .replace("crates.io", "C")
            .replace("github.io", "O")
            .replace("github.com", "G")
            .replace("index.html", "I")
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
