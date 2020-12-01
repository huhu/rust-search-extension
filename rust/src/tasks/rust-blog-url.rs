use std::collections::HashMap;
use std::path::Path;
use std::{env, fs};

use regex::Regex;
use select::document::Document;
use select::predicate::{Name, Predicate};
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
    // /2018/12/06/Rust-1.31-and-rust-2018.html
    let mut split = url.split('-');
    split
        .nth(1)
        .map(|v| {
            let mut v = v.replace(".html", "");
            if v.matches('.').count() == 1 {
                v.push_str(".0");
            }
            v
        })
        .unwrap()
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let path_name = match args.get(1) {
        Some(path_name) => path_name,
        None => "rust-blog-urls.json",
    };
    let mut rt = Runtime::new().unwrap();
    rt.block_on(async {
        match parse_rust_blog_page_urls().await {
            Ok(map) => {
                println!("vec {:?}", map);

                let path = Path::new(path_name);
                fs::write(path, serde_json::to_string(&map).unwrap()).unwrap();
            }
            Err(e) => println!("{}", e),
        }
    });
}
