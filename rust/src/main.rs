use std::error::Error;

use argh::FromArgs;

use crate::tasks::*;

mod frequency;
mod minify;
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
    Crates(CratesTask),
    Books(BooksTask),
    Caniuse(CaniuseTask),
    Lints(LintsTask),
    Labels(LabelsTask),
    Rfcs(RfcsTask),
    Rustc(RustcTask),
    Targets(TargetsTask),
}

pub type Result<T> = std::result::Result<T, Box<dyn Error>>;

fn main() -> Result<()> {
    let options: Options = argh::from_env();
    match options.subcommand {
        Subcommand::Advisory(cmd) => cmd.execute()?,
        Subcommand::Crates(cmd) => cmd.execute()?,
        Subcommand::Books(cmd) => cmd.execute()?,
        Subcommand::Caniuse(cmd) => cmd.execute()?,
        Subcommand::Lints(cmd) => cmd.execute()?,
        Subcommand::Labels(cmd) => cmd.execute()?,
        Subcommand::Rfcs(cmd) => cmd.execute()?,
        Subcommand::Rustc(cmd) => cmd.execute()?,
        Subcommand::Targets(cmd) => cmd.execute()?,
    }
    Ok(())
}
