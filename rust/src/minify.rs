use minifier::js::{Keyword, simple_minify, Token, Tokens};

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
        .map(|(token, _)| {
            match token {
                Token::Keyword(Keyword::Null) => Token::Other("N"),
                _ => token
            }
        })
        .collect::<Vec<_>>()
        .into();
    tokens.to_string()
}