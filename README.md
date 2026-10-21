
# Mount Ruang Eruption: Satellite Observations and Atmospheric Dispersion Analysis

**An April 2024 case study integrating satellite remote sensing, deep learning, atmospheric dispersion modeling, and geographic information systems.**

![Google Earth Engine](https://img.shields.io/badge/Google_Earth_Engine-Remote_Sensing-4285F4)
![Python](https://img.shields.io/badge/Python-Scientific_Computing-3776AB?logo=python&logoColor=white)
![Google Colab](https://img.shields.io/badge/Google_Colab-Notebooks-F9AB00?logo=googlecolab&logoColor=white)
![QGIS](https://img.shields.io/badge/QGIS-Cartography-589632?logo=qgis&logoColor=white)
![Deep Learning](https://img.shields.io/badge/Deep_Learning-CNN-7B1FA2)
![Sentinel-5P](https://img.shields.io/badge/Copernicus-Sentinel--5P-0072C6)
![Sentinel-2](https://img.shields.io/badge/Copernicus-Sentinel--2-00897B)
![Sentinel-3](https://img.shields.io/badge/Copernicus-Sentinel--3-00695C)
![ERA5](https://img.shields.io/badge/ECMWF-ERA5-6A1B9A)
![HYSPLIT](https://img.shields.io/badge/NOAA-HYSPLIT-005A9C)

## Abstract

This project presents a geospatial case study of the April 2024 Mount Ruang eruption in North Sulawesi, Indonesia. It integrates satellite remote sensing, convolutional neural network (CNN) classification, atmospheric dispersion modeling, and geographic information systems (GIS) to investigate complementary aspects of volcanic activity.

Sentinel-5P/TROPOMI observations are used to examine sulfur dioxide (SO₂) column variability. Sentinel-2 imagery supports thermal anomaly analysis using the Normalized Hotspot Index (NHI). ERA5 data provide near-surface wind context, while Sentinel-3/SLSTR imagery is used in a CNN classification workflow. NOAA HYSPLIT outputs are organized to visualize simulated particle dispersion, mass loading, and plume arrival time. QGIS is used for spatial visualization and cartographic presentation.

The repository documents the analytical workflow, selected datasets, processing scripts, model artifacts, evaluation outputs, and visualization products. Satellite observations, machine learning classifications, and atmospheric simulations are treated as distinct sources of evidence, each with its own assumptions and limitations.

![CNN classification map](outputs/maps/CNN_classification_map.png)

## Table of Contents

- [Overview](#overview)
- [Research Objectives](#research-objectives)
- [Study Context](#study-context)
- [Data and Technologies](#data-and-technologies)
- [Analytical Workflow](#analytical-workflow)
- [Results Gallery](#results-gallery)
- [Repository Structure](#repository-structure)
- [Main Analysis Files](#main-analysis-files)
- [Getting Started](#getting-started)
- [Evaluation and Reproducibility](#evaluation-and-reproducibility)
- [Interpretation and Limitations](#interpretation-and-limitations)
- [Skills Demonstrated](#skills-demonstrated)
- [Data and Software Acknowledgments](#data-and-software-acknowledgments)
- [Collaboration](#collaboration)
- [Author](#author)

## Overview

Mount Ruang is an active volcano in North Sulawesi, Indonesia. Its April 2024 eruption provides a case study for exploring how satellite observations, environmental data, machine learning, atmospheric transport modeling, and GIS can be combined in a geospatial analysis workflow.

This project brings together four complementary analytical components:

1. Satellite-based environmental observation.
2. CNN-based image classification.
3. Meteorological analysis and atmospheric dispersion simulation.
4. GIS visualization and cartographic communication.

The repository is intended as an educational, exploratory research, and professional portfolio project. It is not an operational volcanic hazard forecasting system.

## Research Objectives

- Examine daily mean and maximum SO₂ column values over the selected study region.
- Identify spectral thermal anomalies using the Normalized Hotspot Index (NHI).
- Analyze wind speed and direction using ERA5 meteorological data.
- Apply and evaluate a CNN classification workflow using Sentinel-3/SLSTR imagery.
- Visualize HYSPLIT particle dispersion, mass loading, and plume arrival-time products.
- Produce geospatial maps, analytical charts, evaluation records, and documented outputs.
- Organize the workflow into a structured and maintainable research repository.

## Study Context

| Item | Description |
|---|---|
| Study site | Mount Ruang, North Sulawesi, Indonesia |
| Event | April 2024 eruption |
| Selected eruption date | 17 April 2024 |
| SO₂ analysis period | 17–24 April 2024 |
| Thermal imagery search period | 17–29 April 2024 |
| Wind snapshots | 17 April 2024, 12:00 and 15:00 UTC |
| Time convention | UTC unless otherwise indicated |

These dates reflect the configured analysis periods documented for this project. Individual satellite products and simulations may have different acquisition times, valid times, and temporal coverage. Consult the corresponding scripts and figure annotations when interpreting results.

## Data and Technologies

| Component | Dataset or Platform | Analytical Role |
|---|---|---|
| SO₂ observations | Sentinel-5P / TROPOMI | SO₂ column analysis and daily statistics |
| Thermal anomaly analysis | Sentinel-2 | NHI calculation and visualization |
| Meteorological context | ERA5 | Near-surface wind speed and direction |
| CNN classification | Sentinel-3 / SLSTR | Satellite image classification workflow |
| Satellite processing | Google Earth Engine | Data filtering, analysis, visualization, and export |
| Machine learning | Python / Google Colab | Data preparation, CNN training, inference, and evaluation |
| Atmospheric simulation | NOAA HYSPLIT | Atmospheric transport and dispersion modeling |
| GIS and cartography | QGIS | Spatial visualization and map layout production |

## Analytical Workflow

### 1. Study Design

Define the study area, observation periods, data sources, and relevant processing parameters.

### 2. SO₂ Analysis

Process Sentinel-5P/TROPOMI observations to examine SO₂ column variability and generate daily statistical summaries.

### 3. Thermal Anomaly Analysis

Process Sentinel-2 imagery and calculate NHI outputs for the selected observation periods.

### 4. Meteorological Analysis

Examine ERA5 wind components and derive wind speed and direction for the selected times.

### 5. CNN Classification

Prepare Sentinel-3/SLSTR imagery, perform model training and inference, and evaluate predictions against the available reference labels.

### 6. Atmospheric Dispersion Simulation

Organize NOAA HYSPLIT outputs, including particle dispersion, mass loading, arrival-time products, and associated GIS exports.

### 7. GIS Visualization

Integrate selected spatial outputs into QGIS for map composition, interpretation, and cartographic presentation.

### 8. Documentation and Reproducibility

Organize scripts, model artifacts, processed data, evaluation records, and visualization products within the repository.

## Results Gallery

The following sections provide entry points to selected analytical outputs. Their interpretation depends on the underlying data, units, processing settings, and model assumptions.

### 1. Daily SO₂ Variation

![Daily mean and maximum SO₂](outputs/charts/so2_daily_mean_max.png)

Daily mean and maximum SO₂ column values for the selected analysis region.

[View daily SO₂ statistics](outputs/tables/Ruang_Daily_SO2_Statistics.csv)

### 2. CNN Classification

The CNN classification workflow generates spatial predictions from the selected satellite imagery. Class definitions, input preparation, and reference-label procedures should be reviewed in the associated notebook.

[View classification report](outputs/tables/classification_report.csv)

### 3. Classification Evaluation

![Confusion matrix](outputs/charts/confusion_matrix.png)

The confusion matrix summarizes agreement between model predictions and reference labels for the evaluated samples.

[View confusion matrix table](outputs/tables/confusion_matrix.csv)

### 4. CNN Training Behavior

![CNN training curves](outputs/charts/training_curves.png)

Training curves provide a record of the model's training behavior. Interpretation should consider the relationship between training and validation performance.

[View training history](outputs/tables/training_history.csv)

### 5. HYSPLIT Particle Dispersion

![HYSPLIT particle dispersion](outputs/animations/hysplit_particle_dispersion.gif)

Animation of simulated particle transport under the meteorological inputs and release conditions specified in the simulation.

### 6. HYSPLIT Mass Loading

![HYSPLIT mass loading](outputs/animations/hysplit_mass_loading.gif)

Visualization of simulated atmospheric mass loading. Interpret the displayed values using the units, vertical extent, timestamps, and other annotations provided by the original output.

### 7. HYSPLIT Plume Arrival Time

![HYSPLIT plume arrival time](outputs/maps/hysplit_time_of_arrival.gif)

Arrival-time visualization derived from the HYSPLIT simulation. Interpret the output in relation to its initialization time, arrival criterion, and simulation settings.

### 8. QGIS Map Layout

![QGIS map layout](outputs/maps/Trajektori_Ruang_24jam.png)

Cartographic output prepared in QGIS from the selected spatial analysis products.

[Open the QGIS map PDF](outputs/maps/Peta_Trajektori_Gunung_Ruang.pdf)

## Repository Structure

```text
mount-ruang-eruption-analysis/
├── README.md
├── .gitignore
├── gee/
├── notebooks/
├── data/
│   └── processed/
├── models/
│   └── cnn/
├── outputs/
│   ├── animations/
│   ├── charts/
│   ├── maps/
│   └── tables/
├── qgis/
└── simulations/
    └── hysplit/
        └── results/
            └── gis/
```

This tree is a simplified overview of the repository organization. Refer to the actual directory contents for the complete file inventory.

## Main Analysis Files

| File | Purpose |
|---|---|
| `gee/mount_ruang_so2_nhi_era5.js` | Google Earth Engine workflow for SO₂, NHI, and ERA5 wind analysis |
| `notebooks/Mount_Ruang_Sentinel3_CNN_2024.ipynb` | Python notebook for the Sentinel-3 CNN workflow |
| `qgis/Trajektori_Gunung_Ruang.qgz` | QGIS project for spatial visualization and mapping |
| `models/cnn/cnn_best.keras` | Saved CNN model checkpoint |
| `models/cnn/cnn_final.keras` | Saved final CNN model |
| `models/cnn/label_parameters.json` | Supporting label configuration |
| `models/cnn/normalization_and_split.npz` | Saved normalization and data-split information |
| `models/cnn/test_metrics.json` | Saved model evaluation metrics |

## Getting Started

### 1. Explore the Outputs

Browse the following directories:

- `outputs/maps/` — spatial visualizations and exported map layouts.
- `outputs/charts/` — statistical plots and model evaluation figures.
- `outputs/tables/` — numerical summaries, metrics, and training records.
- `outputs/animations/` — atmospheric dispersion visualizations.
- `simulations/hysplit/results/` — archived HYSPLIT products.

### 2. Run the Google Earth Engine Workflow

Open `gee/mount_ruang_so2_nhi_era5.js` in the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).

Before execution:

- Review the study area and date parameters.
- Verify the selected datasets and processing settings.
- Check export regions, coordinate reference systems, and spatial resolutions.
- Confirm that the required Earth Engine assets and permissions are available.

Run the script in the Earth Engine environment and start the required export tasks from the **Tasks** panel.

### 3. Run the Python Notebook

Open `notebooks/Mount_Ruang_Sentinel3_CNN_2024.ipynb` in [Google Colab](https://colab.research.google.com/) or a compatible Jupyter environment.

Before execution:

- Review the package installation and import cells.
- Locate the input imagery and reference datasets required by the notebook.
- Update Google Drive or local file paths for your environment.
- Review preprocessing, class definitions, data splits, and training parameters.
- Confirm that required supporting files are available.

Run the notebook in the intended cell order. Input imagery may need to be obtained separately. Model outputs depend on the input data, software environment, and training configuration.

### 4. Open the QGIS Project

Open `qgis/Trajektori_Gunung_Ruang.qgz` in QGIS.

If a layer cannot be found, reconnect it to the correct data source. A QGIS project stores layer references and visualization settings; external datasets must remain available for the project to display correctly.

### 5. Review HYSPLIT Products

The archived simulation products include:

- [Mass loading PDF](simulations/hysplit/results/mass_loading.pdf)
- [Particle positions PDF](simulations/hysplit/results/particle_positions.pdf)
- [Arrival-time PDF](simulations/hysplit/results/time_of_arrival.pdf)
- [Simulation archive](simulations/hysplit/results/JOBID26516.zip)
- [GIS archive](simulations/hysplit/results/gis/gis_26516.zip)

Reproducing the simulation requires the relevant meteorological inputs and configuration, including release location, release time, release height, duration, and other model settings. Exported plots and GIS files alone do not constitute a complete reproducible simulation setup.

## Evaluation and Reproducibility

The CNN evaluation outputs include a confusion matrix, classification report, saved metrics, and training records.

Model performance should be interpreted in the context of:

- The procedure used to generate reference labels.
- The distribution of samples across classes.
- The separation of training, validation, and test data.
- Potential spatial dependence between samples.
- Preprocessing and normalization procedures.
- The representativeness of the evaluation samples.

Agreement with reference labels does not, by itself, establish independent field validation or generalization to other dates, sensors, and geographic regions.

Reproducing the workflow also requires compatible software dependencies, access to the original inputs, and correct file paths. Exact numerical agreement may vary with data availability, software versions, random seeds, and execution settings.

## Interpretation and Limitations

### Satellite Observations

- SO₂ column values describe vertically integrated atmospheric quantities and do not directly measure ground-level exposure.
- Cloud cover, acquisition timing, spatial resolution, and processing choices affect satellite observations.
- NHI identifies spectral thermal anomalies; interpretation requires attention to cloud contamination, surface conditions, and acquisition timing.

### Meteorological Analysis

- The ERA5 wind data described in this workflow represent conditions at 10 m above the surface.
- Near-surface winds provide meteorological context but do not directly represent transport winds at volcanic plume altitude.

### CNN Classification

- Model performance depends on input quality, reference labels, class balance, and data partitioning.
- Evaluation results should be interpreted using the actual test metrics and validation procedures.
- Strong performance on selected samples does not establish generalization to other dates, sensors, or locations.

### Atmospheric Dispersion Modeling

- HYSPLIT results depend on meteorological inputs and release assumptions.
- Simulated particle distributions and mass loading are model outputs, not direct satellite measurements.
- Arrival-time products depend on initialization time, arrival criteria, and simulation settings.

### Cross-Product Interpretation

Satellite observations, CNN classifications, meteorological analyses, and HYSPLIT simulations represent different quantities. Comparisons should account for differences in observation time, spatial resolution, units, vertical extent, and methodological assumptions.

This project supports education, exploratory research, and portfolio presentation. It is not an operational aviation advisory, a public safety forecast, or a validated volcanic hazard assessment.

## Skills Demonstrated

- Satellite remote sensing and environmental data processing.
- Google Earth Engine scripting and data export.
- Environmental time-series analysis.
- Thermal anomaly detection.
- Python-based geospatial workflows.
- CNN training, inference, and evaluation.
- Interpretation of atmospheric dispersion products.
- GeoTIFF handling and GIS project organization.
- QGIS cartography and map layout production.
- Technical documentation and research reproducibility.

## Data and Software Acknowledgments

This project uses data and software associated with the following organizations and platforms:

- Copernicus Sentinel satellite missions.
- European Centre for Medium-Range Weather Forecasts (ECMWF), ERA5.
- Google Earth Engine.
- Google Colab.
- NOAA Air Resources Laboratory, HYSPLIT.
- QGIS.
- The open-source Python ecosystem.

Third-party datasets, software, and archived materials remain subject to their respective licenses, terms of use, and attribution requirements.

## Collaboration

Open to collaboration opportunities in satellite remote sensing, geospatial analysis, environmental monitoring, machine learning, atmospheric modeling, and GIS visualization.

For professional inquiries, please refer to the contact information available on the author's GitHub profile.

## Author

**M. Dedy Lesmana**

Geospatial analysis portfolio focused on satellite remote sensing, environmental data science, deep learning, atmospheric dispersion modeling, and GIS cartography.
