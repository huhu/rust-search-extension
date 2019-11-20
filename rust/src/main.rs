use std::collections::HashMap;
use std::fs;
use std::path::Path;

use futures::future::join_all;
use serde_derive::Deserialize;
use serde_json;
use tokio;

mod minify;

const API: &str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";
const CRATES_INDEX_PATH: &str = "../extension/crates-index.js";

#[derive(Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Deserialize, Debug)]
struct Crate {
    id: String,
    description: Option<String>,
    documentation: Option<String>,
    max_version: Option<String>,
}

async fn fetch_crates(page: u32) -> Result<Vec<Crate>, Box<dyn std::error::Error>> {
    let resp: CrateApiResponse = reqwest::get(&API.replace("{}", &page.to_string()))
        .await?
        .json()
        .await?;
    Ok(resp.crates)
}

async fn generate_javascript_crates_index(crates: Vec<Crate>) -> std::io::Result<()> {
    let mut contents = String::from("var N=null;");
    let crates_map: HashMap<String, [Option<String>; 3]> = crates
        .into_iter()
        .map(|item| {
            (
                item.id.to_lowercase(),
                [
                    item.description.map(|mut value| {
                        value.truncate(100);
                        value
                    }),
                    item.documentation.map(minify::minify_url),
                    item.max_version,
                ],
            )
        })
        .collect();
    let crate_index = format!(
        "var crateIndex={};",
        serde_json::to_string(&crates_map).unwrap()
    );
    contents.push_str(&minify::minify_json(crate_index));
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
    let crates: Vec<Crate> = join_all(futures)
        .await
        .into_iter()
        .flat_map(|item| item.unwrap())
        .collect();
    match generate_javascript_crates_index(crates).await {
        Ok(_) => println!("\nGenerate javascript crates index successful!"),
        Err(error) => println!("{:?}", error),
    }
}
