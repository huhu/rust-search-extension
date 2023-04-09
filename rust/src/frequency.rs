#[derive(Debug)]
pub struct FrequencyWord {
    pub word: String,
    pub frequency: usize,
}

impl FrequencyWord {
    #[inline]
    pub fn score(&self) -> usize {
        // Due to the prefix + suffix occupying two letters,
        // we should minus the length to calculate the score.
        // This will lead to a 0.4% reduction in file size.
        (self.word.len() - 2) * self.frequency
    }
}
