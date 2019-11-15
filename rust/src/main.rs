use std::collections::HashSet;
use std::fs;
use std::path::Path;

use futures::future::join_all;
use serde_derive::{Deserialize, Serialize};
use serde_json;
use tokio;

const API: &'static str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";
const CRATES_INDEX_PATH: &'static str = "../extension/crates-index.js";

#[derive(Serialize, Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Crate {
    #[serde(rename(serialize = "i"))]
    id: String,
    #[serde(rename(serialize = "d"))]
    description: String,
    #[serde(rename(serialize = "h"))]
    homepage: Option<String>,
    #[serde(rename(serialize = "o"))]
    documentation: Option<String>,
    #[serde(rename(serialize = "r"))]
    repository: Option<String>,
    #[serde(rename(serialize = "x"))]
    downloads: u32,
    #[serde(rename(serialize = "v"))]
    max_version: String,
}

async fn fetch_crates(page: u32) -> Result<Vec<Crate>, Box<dyn std::error::Error>> {
    let resp: CrateApiResponse = reqwest::get(&API.replace("{}", &page.to_string())).await?
        .json().await?;
    Ok(resp.crates)
}

async fn generate_javascript_crates_index(crates: Vec<Crate>) -> std::io::Result<()> {
    let mut contents = String::from("");
    contents.push_str(&format!("var crateIndex={};\n", serde_json::to_string(&crates).unwrap()));

    let crate_ids = crates.into_iter().map(|krate| krate.id).collect::<HashSet<String>>();
    contents.push_str(&format!("var crateIds={};\n", serde_json::to_string(&crate_ids).unwrap()));

    let path = Path::new(CRATES_INDEX_PATH);
    fs::write(path, &contents)?;
    Ok(())
}

#[tokio::main]
async fn main() {
    let mut futures = vec![];
    for page in 1..10 {
        futures.push(fetch_crates(page));
    }
    let crates: Vec<Crate> = join_all(futures).await
        .into_iter().flat_map(|item| item.unwrap()).collect();
    match generate_javascript_crates_index(crates).await {
        Ok(_) => println!("\nGenerate javascript crates index successful!"),
        Err(error) => println!("{:?}", error),
    }
}