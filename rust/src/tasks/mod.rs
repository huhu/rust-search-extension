use anyhow::Result;

pub use books::BooksTask;
pub use caniuse::CaniuseTask;
pub use crates::CratesTask;

mod books;
mod crates;
mod caniuse;

pub trait Task {
    fn execute(&self) -> Result<()>;
}
