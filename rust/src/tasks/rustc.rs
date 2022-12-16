use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use argh::FromArgs;
use select::document::Document;
use select::predicate::Name;
use serde::Serialize;
use tokio::runtime::Runtime;

use super::Task;

static RUSTC_INDEX_PATH: &str = "../extension/index/rustc.js";

/// Rustc task
#[derive(FromArgs)]
#[argh(subcommand, name = "rustc")]
pub struct RustcTask {
    /// destination path
    #[argh(option, short = 'd', default = "RUSTC_INDEX_PATH.to_string()")]
    dest_path: String,
}

#[derive(Serialize)]
struct Doc {
    url: &'static str,
    items: Vec<String>,
}

impl Task for RustcTask {
    fn execute(&self) -> crate::Result<()> {
        let rt = Runtime::new()?;
        rt.block_on(self.run())?;
        Ok(())
    }
}

impl RustcTask {
    async fn run(&self) -> crate::Result<()> {
        let mut map = BTreeMap::new();
        map.insert(
            "Codegen Options",
            Doc::parse_from_url("https://doc.rust-lang.org/rustc/codegen-options/index.html")
                .await?,
        );
        map.insert(
            "Allowed By Default Lint",
            Doc::parse_from_url(
                "https://doc.rust-lang.org/rustc/lints/listing/allowed-by-default.html",
            )
            .await?,
        );
        map.insert(
            "Warn By Default Lint",
            Doc::parse_from_url(
                "https://doc.rust-lang.org/rustc/lints/listing/warn-by-default.html",
            )
            .await?,
        );
        map.insert(
            "Deny By Default Lint",
            Doc::parse_from_url(
                "https://doc.rust-lang.org/rustc/lints/listing/deny-by-default.html",
            )
            .await?,
        );

        fs::write(
            Path::new(&self.dest_path),
            format!("var rustcIndex={};", serde_json::to_string(&map).unwrap()),
        )?;
        println!("\nGenerate rustc index successful!");
        Ok(())
    }
}

impl Doc {
    async fn parse_from_url(url: &'static str) -> crate::Result<Doc> {
        let html = reqwest::get(url).await?.text().await?;
        let doc = Document::from(html.as_str());
        Ok(Doc {
            url,
            items: doc.find(Name("h2")).map(|h2| h2.text()).collect(),
        })
    }
}
