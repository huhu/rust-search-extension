use regex::Regex;
use reqwest;
use select::document::Document;
use select::predicate::{Name, Predicate};
use std::collections::HashMap;
use tokio::runtime::Runtime;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

async fn parse_rust_blog_page_urls() -> Result<HashMap<String, String>> {
    let regex = Regex::new(r"^/\d{4}/\d+/\d+/Rust-[01]\..*html$")?;
    let html = reqwest::get("https://blog.rust-lang.org/")
        .await?
        .text()
        .await?;
    let doc = Document::from(html.as_str());
    Ok(doc
        .find(Name("tr").descendant(Name("a")))
        .filter_map(|item| {
            item.attr("href")
                .filter(|url| regex.is_match(url) && url.contains('-'))
                .map(|url| (parse_version_from_url(url), url.to_string()))
        })
        .collect())
}

fn parse_version_from_url(url: &str) -> String {
    // /2020/10/08/Rust-1.47.html
    // /2020/08/27/Rust-1.46.0.html
    let mut split = url.split('-');
    split.nth(1).map(|mut v| {
        let v = v.replace(".html", "");
        v
    }).unwrap()
}

fn main() {
    let mut rt = Runtime::new().unwrap();
    rt.block_on(async {
        match parse_rust_blog_page_urls().await {
            Ok(vec) => {
                println!("vec {:?}", vec);
            }
            Err(e) => println!("{}", e),
        }
    });
}
