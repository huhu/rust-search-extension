use std::collections::HashMap;
use std::fs;
use std::path::Path;

use futures::future::join_all;
use serde_derive::{Deserialize, Serialize};
use serde_json;
use tokio;

const API: &'static str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";
const CRATES_INDEX_PATH: &'static str = "../extension/crates-index.js";

trait MinifiedUrl: Sized {
    fn minify_url(&self) -> Self;
}

impl MinifiedUrl for Option<String> {
    fn minify_url(&self) -> Self {
        match self {
            Some(value) => Some(value
                .to_lowercase()
                .replace("http://", "")
                .replace("https://", "")
                .replace("docs.rs", "D")
                .replace("crates.io", "C")
                .replace("github.io", "O")
                .replace("github.com", "G")
                .replace("index.html", "I")),
            None => None
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Crate {
    id: String,
    description: Option<String>,
    documentation: Option<String>,
    max_version: Option<String>,
}

async fn fetch_crates(page: u32) -> Result<Vec<Crate>, Box<dyn std::error::Error>> {
    let resp: CrateApiResponse = reqwest::get(&API.replace("{}", &page.to_string())).await?
        .json().await?;
    Ok(resp.crates)
}

async fn generate_javascript_crates_index(crates: Vec<Crate>) -> std::io::Result<()> {
    let mut contents = String::from("var N=null;");
    let crates_map: HashMap<String, [Option<String>; 3]> = crates.into_iter()
        .map(|item| (item.id.to_lowercase(), [
            item.description.map(|mut value| {
                value.truncate(100);
                value
            }),
            item.documentation.minify_url(),
            item.max_version
        ])).collect();
    let mut crate_index = format!("var crateIndex={};", serde_json::to_string(&crates_map).unwrap());
    crate_index = crate_index.replace("null", "N");
    contents.push_str(&crate_index);
    contents.push_str("let crateSearcher=new CrateSearch(crateIndex);");

    let path = Path::new(CRATES_INDEX_PATH);
    fs::write(path, &contents)?;
    Ok(())
}

#[tokio::main]
async fn main() {
    let mut futures = vec![];
    for page in 1..=100 {
        futures.push(fetch_crates(page));
    }
    let crates: Vec<Crate> = join_all(futures).await
        .into_iter().flat_map(|item| item.unwrap()).collect();
    match generate_javascript_crates_index(crates).await {
        Ok(_) => println!("\nGenerate javascript crates index successful!"),
        Err(error) => println!("{:?}", error),
    }
}