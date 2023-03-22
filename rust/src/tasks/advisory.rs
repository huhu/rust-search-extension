use std::{collections::HashMap, io::Write, path::Path};

use argh::FromArgs;
use rustsec::{database::Query, Advisory, Collection, Database, Repository};

use super::Task;

const ADVISORY_INDEX_PATH: &str = "../docs/static/advisory";

/// Advisory task
#[derive(FromArgs)]
#[argh(subcommand, name = "advisory")]
pub struct AdvisoryTask {
    /// advisory-db repository path
    #[argh(option, short = 'r')]
    repo_path: String,
}

impl Task for AdvisoryTask {
    fn execute(&self) -> crate::Result<()> {
        let mut map = HashMap::new();
        let repo = Repository::open(&self.repo_path)?;
        let db = Database::load_from_repo(&repo)?;
        for advisory in db
            .query(&Query::new().collection(Collection::Crates).withdrawn(false))
            .into_iter()
        {
            map.entry(&advisory.metadata.package)
                .or_insert_with(Vec::new)
                .push(advisory);
        }
        for (package, advisories) in map {
            generate_advisory_json(package.as_str(), &advisories)?;
        }
        Ok(())
    }
}

fn generate_advisory_json(package: &str, advisory: &[&Advisory]) -> crate::Result<()> {
    let path = Path::new(ADVISORY_INDEX_PATH);
    if !path.exists() {
        std::fs::create_dir(path)?;
    }
    let mut file = std::fs::File::create(path.join(format!("{package}.json")))?;
    let json = serde_json::to_string_pretty(&advisory)?;
    file.write_all(json.as_bytes())?;
    Ok(())
}
