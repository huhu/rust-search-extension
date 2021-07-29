use std::clone::Clone;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use argh::FromArgs;
use serde_derive::Deserialize;
use tokio::runtime::Runtime;

use crate::minify::Minifier;
use crate::tasks::Task;

const LINT_URL: &str = "https://rust-lang.github.io/rust-clippy/master/lints.json";
const LINTS_INDEX_PATH: &str = "../extension/index/lints.js";

/// Lint task
#[derive(FromArgs)]
#[argh(subcommand, name = "lints")]
pub struct LintsTask {
    /// destination path
    #[argh(option, short = 'd', default = "LINTS_INDEX_PATH.to_string()")]
    dest_path: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
enum LintLevel {
    Allow,
    Warn,
    Deny,
    Deprecated,
    None,
}

impl ToString for LintLevel {
    fn to_string(&self) -> String {
        match self {
            Self::Allow => "Allow".to_string(),
            Self::Warn => "Warn".to_string(),
            Self::Deny => "Deny".to_string(),
            Self::Deprecated => "Deprecated".to_string(),
            Self::None => "None".to_string(),
        }
    }
}

#[derive(Deserialize, Debug)]
struct Lint {
    id: String,
    level: LintLevel,
    docs: Option<String>,
}

async fn fetch_clippy_lints() -> crate::Result<Vec<Lint>> {
    let lints = reqwest::get(LINT_URL).await?.json().await?;
    Ok(lints)
}

impl Task for LintsTask {
    fn execute(&self) -> crate::Result<()> {
        let mut rt = Runtime::new()?;
        rt.block_on(self.run())?;
        Ok(())
    }
}

impl LintsTask {
    async fn run(&self) -> crate::Result<()> {
        let lints: HashMap<String, [String; 2]> = fetch_clippy_lints()
            .await?
            .iter()
            .filter_map(|lint| {
                if let Some(docs) = lint
                    .docs
                    .as_ref()
                    .map(|d| d.trim().strip_prefix("### What it does"))
                    .flatten()
                {
                    let mut desc = docs.replace("`", "").replace('#', "");
                    desc.truncate(100);
                    Some((lint.id.clone(), [lint.level.to_string(), desc]))
                } else {
                    None
                }
            })
            .collect();

        let contents = format!("var lintsIndex={};", serde_json::to_string(&lints)?);
        let path = Path::new(&self.dest_path);
        fs::write(path, &Minifier::minify_js(contents))?;
        println!("\nGenerate javascript lints index successful!");
        Ok(())
    }
}
