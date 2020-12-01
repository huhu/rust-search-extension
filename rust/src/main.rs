use argh::FromArgs;

use crate::tasks::*;

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
    Crates(CratesTask),
    Books(BooksTask),
    Caniuse(CaniuseTask),
}

fn main() -> anyhow::Result<()> {
    let options: Options = argh::from_env();
    match options.subcommand {
        Subcommand::Crates(cmd) => cmd.execute()?,
        Subcommand::Books(cmd) => cmd.execute()?,
        Subcommand::Caniuse(cmd) => cmd.execute()?,
    }
    Ok(())
}
