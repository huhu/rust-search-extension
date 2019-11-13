use serde_derive::{Deserialize, Serialize};
use tokio;

static API: &'static str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";

#[derive(Serialize, Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Crate {
    id: String,
    name: String,
    description: String,
    homepage: Option<String>,
    documentation: Option<String>,
    repository: Option<String>,
    downloads: u32,
    max_version: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let resp: CrateApiResponse = reqwest::get(&API.replace("{}", "1"))
        .await?
        .json()
        .await?;
    println!("{:#?}", resp);
    Ok(())
}