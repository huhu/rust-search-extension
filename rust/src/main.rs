use std::error::Error;

use argh::FromArgs;

use crate::tasks::*;

mod tasks;

/// Options
#[derive(FromArgs)]
struct Options {
    #[argh(subcommand)]
    subcommand: Subcommand,
}

/// Subcommands
#[derive(FromArgs)]
#[argh(subcommand)]
#[non_exhaustive]
enum Subcommand {
    Advisory(AdvisoryTask),
}

pub type Result<T> = std::result::Result<T, Box<dyn Error>>;

fn main() -> Result<()> {
    let options: Options = argh::from_env();
    match options.subcommand {
        Subcommand::Advisory(cmd) => cmd.execute()?,
    }
    Ok(())
}
