pub use advisory::AdvisoryTask;

mod advisory;

pub trait Task {
    fn execute(&self) -> crate::Result<()>;
}
