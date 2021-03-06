pub use books::BooksTask;
pub use caniuse::CaniuseTask;
pub use crates::CratesTask;
pub use labels::LabelsTask;
pub use lints::LintsTask;

mod books;
mod caniuse;
mod crates;
mod labels;
mod lints;

pub trait Task {
    fn execute(&self) -> crate::Result<()>;
}
