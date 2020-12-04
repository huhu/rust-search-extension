use std::collections::HashMap;
use std::fs;
use std::path::Path;

use anyhow::Result;
use argh::FromArgs;
use regex::Regex;
use select::document::Document;
use select::predicate::{Name, Predicate};
use tokio::runtime::Runtime;

use crate::tasks::Task;

/// Rust blog urls task
#[argh(subcommand, name = "blog_urls")]
#[derive(FromArgs)]
pub struct BlogUrlsTask {
    /// destination path
    #[argh(option, short = 'd', default = "\"rust-blog-urls.json\".to_string()")]
    dest_path: String,
}

fn parse_version_from_url(url: &str) -> String {
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

impl Task for BlogUrlsTask {
    fn execute(&self) -> Result<()> {
        let mut rt = Runtime::new().unwrap();
        rt.block_on(async {
            match self.parse_rust_blog_page_urls().await {
                Ok(map) => {
                    println!("map {:?}", map);

                    let path = Path::new(&self.dest_path);
                    fs::write(path, serde_json::to_string(&map).unwrap()).unwrap();
                }
                Err(e) => println!("{}", e),
            }
        });
        Ok(())
    }
}

impl BlogUrlsTask {
    async fn parse_rust_blog_page_urls(&self) -> Result<HashMap<String, String>> {
        let regex = Regex::new(r"^/\d{4}/\d+/\d+/Rust-[01]\..*html$")?;
        let html = reqwest::get("https://blog.rust-lang.org/")
            .await?
            .text()
            .await?;

        let mut map = HashMap::new();
        for (version, url) in Document::from(html.as_str())
            .find(Name("tr").descendant(Name("a")))
            .filter_map(|item| {
                item.attr("href")
                    .filter(|url| regex.is_match(url))
                    .map(|url| (parse_version_from_url(url), url.to_string()))
            })
        {
            if !map.contains_key(&version) {
                map.insert(version, url);
            }
        }
        Ok(map)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_version_from_url() {
        let f = parse_version_from_url;
        assert_eq!("1.47.0", &f("/2020/10/08/Rust-1.47.html"));
        assert_eq!("1.46.0", &f("/2020/08/27/Rust-1.46.0.html"));
        assert_eq!("1.45.1", &f("/2020/08/27/Rust-1.45.1.html"));
        assert_eq!("1.31.0", &f("/2018/12/06/Rust-1.31-and-rust-2018.html"));
    }
}
