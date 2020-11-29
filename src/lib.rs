use std::f32::consts::PI;

use plotters::{
    chart::ChartBuilder,
    drawing::IntoDrawingArea,
    series::LineSeries,
    style::{
        colors::{BLUE, WHITE},
        Color,
    },
};
use plotters_canvas::CanvasBackend;

use rustfft::{num_complex::Complex, num_traits::Zero, FFTplanner};

use wasm_bindgen::prelude::wasm_bindgen;

use web_sys::HtmlCanvasElement;

#[wasm_bindgen]
pub enum WindowFunction {
    Blackman,
    Hamming,
    Hann,
    Rectangle,
}

impl WindowFunction {
    pub fn generate(&self, length: usize) -> Vec<f32> {
        match self {
            WindowFunction::Blackman => (0..length)
                .map(|i| {
                    0.42 - 0.5 * (2.0 * PI * i as f32).cos()
                        + 0.08 * (4.0 * PI * i as f32 / length as f32).cos()
                })
                .collect(),
            WindowFunction::Hamming => (0..length)
                .map(|i| 0.54 - 0.46 * (2.0 * PI * i as f32 / length as f32).cos())
                .collect(),
            WindowFunction::Hann => (0..length)
                .map(|i| 0.5 - 0.5 * (2.0 * PI * i as f32 / length as f32).cos())
                .collect(),
            WindowFunction::Rectangle => {
                vec![1.0; length]
            }
        }
    }
}

#[wasm_bindgen]
pub fn run_fft(input: &[f32], size: usize, window_function: WindowFunction) -> Vec<f32> {
    let mut planner = FFTplanner::<f32>::new(false);
    let fft = planner.plan_fft(size);

    let window = window_function.generate(size);
    let mut input: Vec<_> = input
        .iter()
        .zip(window.iter())
        .map(|(x, w)| x * w)
        .collect();
    input.resize(size, 0.0);
    let mut input: Vec<_> = input.iter().map(|f| Complex::new(*f, 0.0)).collect();
    let mut output = vec![Complex::zero(); size];
    fft.process(&mut input, &mut output);
    output.iter().flat_map(|c| vec![c.re, c.im]).collect()
}

#[wasm_bindgen]
pub fn spectra_to_powers(spectra: &[f32]) -> Vec<f32> {
    spectra
        .chunks_exact(2)
        .map(|chunk| chunk[0] * chunk[0] + chunk[1] * chunk[1])
        .collect()
}

#[wasm_bindgen]
pub fn peak_indices(powers: &[f32], num: usize) -> Vec<usize> {
    let mut tmp: Vec<_> = powers.iter().enumerate().collect();
    tmp.sort_by(|(_, a), (_, b)| b.partial_cmp(a).expect("Contains NaN"));
    tmp[..num].iter().map(|(i, _)| *i).collect()
}

#[wasm_bindgen]
pub fn plot_power_spectra_to_canvas(canvas: HtmlCanvasElement, powers: &[f32], sample_rate: f32) {
    let root = CanvasBackend::with_canvas_object(canvas)
        .expect("Illegal canvas")
        .into_drawing_area();
    root.fill(&WHITE)
        .expect("Some errors have been occurred in the backend");
    let df = sample_rate / powers.len() as f32;
    let mut chart = ChartBuilder::on(&root)
        .x_label_area_size(50)
        .y_label_area_size(60)
        .build_cartesian_2d(
            0..powers.len() / 2,
            0.0..plotters::data::fitting_range(powers).end + 0.1,
        )
        .expect("Can't build a 2d Cartesian coordinate");
    chart
        .configure_mesh()
        .x_labels(10)
        .y_labels(10)
        .disable_mesh()
        .x_label_formatter(&|&v| {
            format!(
                "{:0.1}",
                if v < (powers.len() + 1) / 2 {
                    v as f32 * df
                } else {
                    -((powers.len() - v) as f32) * df
                }
            )
        })
        .y_label_formatter(&|v| format!("{:e}", v))
        .x_desc("Frequency [Hz]")
        .y_desc("Power")
        .draw()
        .expect("Can't draw axes");
    chart
        .draw_series(LineSeries::new(
            powers
                .iter()
                .take(powers.len() / 2)
                .enumerate()
                .map(|(i, p)| (i, *p)),
            BLUE.filled(),
        ))
        .expect("Can't draw a series");
}
