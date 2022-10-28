pub use books::BooksTask;
pub use caniuse::CaniuseTask;
pub use crates::CratesTask;
pub use labels::LabelsTask;
pub use lints::LintsTask;
pub use rfcs::RfcsTask;
pub use rustc::RustcTask;

mod books;
mod caniuse;
mod crates;
mod labels;
mod lints;
mod rfcs;
mod rustc;

pub trait Task {
    fn execute(&self) -> crate::Result<()>;
}
