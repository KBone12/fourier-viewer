use rustfft::{num_complex::Complex, num_traits::Zero, FFTplanner};

use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn run_fft(input: &[f32], size: usize) -> Vec<f32> {
    let mut planner = FFTplanner::<f32>::new(false);
    let fft = planner.plan_fft(size);

    let mut input = input.to_vec();
    input.resize(size, 0.0);
    let mut input: Vec<_> = input.iter().map(|f| Complex::new(*f, 0.0)).collect();
    let mut output = vec![Complex::zero(); size];
    fft.process(&mut input, &mut output);
    output.iter().flat_map(|c| vec![c.re, c.im]).collect()
}
