// ============================================================
// MINI PROJECT GUNUNG RUANG
// SO2 DAILY + NHI + ERA5 WIND
// ============================================================
// Kejadian: 17 April 2024, 12:15 UTC / 20:15 WITA.
// ERA5: 12:00 UTC (jam terdekat) dan 15:00 UTC.
// CNN dan HYSPLIT dikerjakan terpisah.
//
// Catatan:
// - Hari SO2 mengikuti UTC.
// - END bersifat eksklusif.
// - Angin ERA5 adalah angin 10 m, bukan angin di tinggi plume.
// ============================================================

// ============================================================
// 1. PARAMETER
// ============================================================
var VOLCANO = ee.Geometry.Point([125.374, 2.303]);

// Area berbeda untuk kebutuhan analisis berbeda.
var AOI_SO2 = VOLCANO.buffer(500000);
var AOI_NHI = VOLCANO.buffer(5000);
var AOI_WIND = VOLCANO.buffer(150000);

var SO2_START = '2024-04-17';
var SO2_END = '2024-04-25';

var NHI_START = '2024-04-17';
var NHI_END = '2024-04-30';

var WIND_TIMES = [
  '2024-04-17T12:00:00',
  '2024-04-17T15:00:00'
];

var SO2_BAND = 'SO2_column_number_density';

var SO2_VIS = {
  min: 0,
  max: 0.005,
  palette: [
    '132b80', '1565c0', '00bcd4',
    '66bb6a', 'ffee58', 'ff9800', 'd7191c'
  ]
};

var WIND_VIS = {
  min: 0,
  max: 15,
  palette: [
    '132b80', '1565c0', '00bcd4',
    '66bb6a', 'ffee58', 'ff9800', 'd7191c'
  ]
};

var HOT_VIS = {
  min: 1,
  max: 3,
  palette: ['ffff00', 'ff0000', '9900ff']
};

Map.setOptions('SATELLITE');

print('KEJADIAN: 17 April 2024, 12:15 UTC / 20:15 WITA');
print('ERA5: angin 10 m; bukan angin pada ketinggian plume.');

// ============================================================
// 2. SO2: KOLEKSI DAN KOMPOSIT HARIAN
// ============================================================
var so2Collection = ee.ImageCollection(
  'COPERNICUS/S5P/OFFL/L3_SO2'
)
  .filterBounds(AOI_SO2)
  .filterDate(SO2_START, SO2_END)
  .select(SO2_BAND);

print('Jumlah citra SO2:', so2Collection.size());

// Citra kosong bermasker untuk hari tanpa data.
// Tidak mengisi hari kosong dengan nilai nol.
var emptySO2 = ee.Image.constant(0)
  .rename(SO2_BAND)
  .updateMask(ee.Image.constant(0));

var numberOfDays = ee.Date(SO2_END)
  .difference(ee.Date(SO2_START), 'day')
  .toInt();

var dayOffsets = ee.List.sequence(0, numberOfDays.subtract(1));

var so2Daily = ee.ImageCollection.fromImages(
  dayOffsets.map(function(offset) {
    var date = ee.Date(SO2_START).advance(offset, 'day');

    var collection = so2Collection.filterDate(
      date, date.advance(1, 'day')
    );

    var dailyImage = ee.Image(
      ee.Algorithms.If(
        collection.size().gt(0),
        collection.mean(),
        emptySO2
      )
    );

    return dailyImage
      .clip(AOI_SO2)
      .set({
        'system:time_start': date.millis(),
        date: date.format('YYYY-MM-dd'),
        scene_count: collection.size()
      });
  })
);

// Maksimum berikut adalah maksimum spasial
// dari komposit rata-rata harian di dalam AOI.
var so2Stats = ee.FeatureCollection(
  so2Daily.toList(numberOfDays).map(function(item) {
    var image = ee.Image(item);

    var stats = image.reduceRegion({
      reducer: ee.Reducer.mean()
        .combine({
          reducer2: ee.Reducer.max(),
          sharedInputs: true
        })
        .combine({
          reducer2: ee.Reducer.count(),
          sharedInputs: true
        }),
      geometry: AOI_SO2,
      scale: 1113.2,
      maxPixels: 1e8,
      tileScale: 4
    });

    return ee.Feature(null, {
      date: image.get('date'),
      SO2_mean: stats.get(SO2_BAND + '_mean'),
      SO2_max: stats.get(SO2_BAND + '_max'),
      valid_pixel_count: stats.get(SO2_BAND + '_count'),
      scene_count: image.get('scene_count')
    });
  })
);

print('Tabel SO2 harian, mol/m2:', so2Stats);

print(
  ui.Chart.feature.byFeature({
    features: so2Stats,
    xProperty: 'date',
    yProperties: ['SO2_mean', 'SO2_max']
  })
    .setChartType('LineChart')
    .setOptions({
      title: 'Daily SO2 - Mount Ruang',
      hAxis: {title: 'Date (UTC)'},
      vAxis: {title: 'SO2 column density (mol/m²)'},
      lineWidth: 2,
      pointSize: 5,
      interpolateNulls: false,
      series: {
        0: {color: '#1565c0'},
        1: {color: '#d7191c'}
      }
    })
);

Export.table.toDrive({
  collection: so2Stats,
  description: 'Ruang_Daily_SO2_Statistics',
  fileFormat: 'CSV'
});

// ============================================================
// 3. NHI: SENTINEL-2 L1C DAN KONVERSI RADIANSI
// ============================================================
// NHI berbasis radiansi B5, B8A, B11, dan B12.
// Ambang klasifikasi mengacu pada Modul Sesi 1.
// Kandidat hotspot perlu diperiksa secara visual terhadap
// awan, plume, dan sumber panas non-vulkanik.
// ============================================================
function addNHI(image) {
  var cosZenith = ee.Number(
    image.get('MEAN_SOLAR_ZENITH_ANGLE')
  ).multiply(Math.PI / 180).cos();

  // Faktor U = 1 / d².
  var correction = ee.Number(
    image.get('REFLECTANCE_CONVERSION_CORRECTION')
  );

  function radiance(band, outputName) {
    var irradiance = ee.Number(
      image.get('SOLAR_IRRADIANCE_' + band)
    );

    return image.select(band)
      .multiply(0.0001)
      .multiply(irradiance)
      .multiply(cosZenith)
      .multiply(correction)
      .divide(Math.PI)
      .rename(outputName);
  }

  var L05 = radiance('B5', 'L05');
  var L08A = radiance('B8A', 'L08A');
  var L11 = radiance('B11', 'L11');
  var L12 = radiance('B12', 'L12');

  // Gunakan operasi langsung agar tidak ada masking otomatis
  // terhadap nilai negatif seperti pada normalizedDifference.
  var swir = L12.subtract(L11)
    .divide(L12.add(L11))
    .rename('NHI_SWIR');

  var swnir = L11.subtract(L08A)
    .divide(L11.add(L08A))
    .rename('NHI_SWNIR');

  var nd12 = L12.subtract(L08A)
    .divide(L12.add(L08A))
    .rename('ND12_8A');

  var midLow = L12.gt(2)
    .and(swir.gt(0))
    .and(L05.lt(90))
    .and(nd12.gt(-0.6));

  var high = L12.gt(2)
    .and(swnir.gt(0))
    .and(L05.lt(70))
    .and(nd12.gt(-0.3));

  var extreme = L11.gte(70)
    .and(L05.lt(70));

  // Kelas 0 = tidak terdeteksi sebagai kandidat hotspot.
  var valid = image.select(['B5', 'B8A', 'B11', 'B12'])
    .mask()
    .reduce(ee.Reducer.min());

  var hotspot = L12.multiply(0)
    .toByte()
    .where(midLow, 1)
    .where(high, 2)
    .where(extreme, 3)
    .updateMask(valid)
    .rename('HOTSPOT');

  return image
    .addBands(ee.Image.cat([
      L05, L08A, L11, L12,
      swir, swnir, nd12, hotspot
    ]))
    .set('date', image.date().format('YYYY-MM-dd'));
}

var s2 = ee.ImageCollection('COPERNICUS/S2_HARMONIZED')
  .filterBounds(VOLCANO)
  .filterDate(NHI_START, NHI_END)
  .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 80))
  .map(addNHI);

var nhiDates = ee.List(s2.aggregate_array('date'))
  .distinct()
  .sort();

print('Jumlah scene Sentinel-2:', s2.size());
print('Tanggal NHI tersedia:', nhiDates);

function getNHIImage(date) {
  return ee.Image(
    s2.filter(ee.Filter.eq('date', date))
      .sort('CLOUDY_PIXEL_PERCENTAGE')
      .first()
  );
}

var nhiStats = ee.FeatureCollection(
  nhiDates.map(function(date) {
    var image = getNHIImage(date);
    var hot = image.select('HOTSPOT');

    var areas = ee.Image.cat([
      hot.eq(1).multiply(ee.Image.pixelArea()).rename('mid_low'),
      hot.eq(2).multiply(ee.Image.pixelArea()).rename('high'),
      hot.eq(3).multiply(ee.Image.pixelArea()).rename('extreme')
    ]).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: AOI_NHI,
      scale: 20,
      maxPixels: 1e8,
      tileScale: 4
    });

    return ee.Feature(null, {
      date: date,
      acquisition_UTC: image.date().format('YYYY-MM-dd HH:mm'),
      scene_cloud_percent: image.get('CLOUDY_PIXEL_PERCENTAGE'),
      mid_low_area_m2: areas.get('mid_low'),
      high_area_m2: areas.get('high'),
      extreme_area_m2: areas.get('extreme')
    });
  })
);

print('Tabel kandidat hotspot NHI:', nhiStats);

Export.table.toDrive({
  collection: nhiStats,
  description: 'Ruang_NHI_Statistics',
  fileFormat: 'CSV'
});

// ============================================================
// 4. ERA5: DUA WAKTU TERPISAH
// ============================================================
var WIND_BANDS = [
  'u_component_of_wind_10m',
  'v_component_of_wind_10m'
];

var era5 = ee.ImageCollection('ECMWF/ERA5/HOURLY')
  .filterDate('2024-04-17', '2024-04-18')
  .select(WIND_BANDS);

function getWind(time) {
  var start = ee.Date(time);

  var image = ee.Image(
    era5.filterDate(start, start.advance(1, 'hour')).first()
  );

  var u = image.select(WIND_BANDS[0]);
  var v = image.select(WIND_BANDS[1]);

  var speed = u.pow(2)
    .add(v.pow(2))
    .sqrt()
    .rename('speed');

  return image.addBands(speed).clip(AOI_WIND);
}

function compassDirection(degrees) {
  var labels = ee.List([
    'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'
  ]);

  var index = ee.Number(degrees)
    .add(22.5)
    .divide(45)
    .floor()
    .mod(8);

  return labels.get(index);
}

var windStats = ee.FeatureCollection(
  WIND_TIMES.map(function(time) {
    var wind = getWind(time);

    var stats = wind.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: AOI_WIND,
      scale: 27830,
      maxPixels: 1e7
    });

    var u = ee.Number(stats.get(WIND_BANDS[0]));
    var v = ee.Number(stats.get(WIND_BANDS[1]));

    // Bearing menuju, searah jarum jam dari utara.
    var toward = u.atan2(v)
      .multiply(180 / Math.PI)
      .add(360)
      .mod(360);

    var from = toward.add(180).mod(360);

    return ee.Feature(null, {
      time_UTC: ee.Date(time).format('YYYY-MM-dd HH:mm'),
      mean_speed_m_s: stats.get('speed'),
      toward_degree: toward,
      toward_compass: compassDirection(toward),
      from_degree: from,
      from_compass: compassDirection(from),
      mean_u_m_s: u,
      mean_v_m_s: v,
      resultant_speed_m_s: u.pow(2).add(v.pow(2)).sqrt()
    });
  })
);

print('ERA5 - statistik dua waktu:', windStats);
print(
  'Arah ringkasan dihitung dari rata-rata u dan v. ' +
  'Toward = menuju; From = berasal dari.'
);

Export.table.toDrive({
  collection: windStats,
  description: 'Ruang_ERA5_Wind_Statistics',
  fileFormat: 'CSV'
});

// ============================================================
// 5. PANAH ANGIN DENGAN KEPALA PANAH
// ============================================================
// Sampling mendekati resolusi asli ERA5.
// Panjang panah tetap 18 km; warna raster menunjukkan kecepatan.
// ============================================================
function makeArrows(wind) {
  var samples = wind.select(WIND_BANDS).sample({
    region: AOI_WIND,
    scale: 27830,
    geometries: true
  });

  return samples.map(function(feature) {
    var xy = feature.geometry().coordinates();
    var lon = ee.Number(xy.get(0));
    var lat = ee.Number(xy.get(1));

    var u = ee.Number(feature.get(WIND_BANDS[0]));
    var v = ee.Number(feature.get(WIND_BANDS[1]));
    var speed = u.pow(2).add(v.pow(2)).sqrt();

    var safeSpeed = speed.max(0.000001);
    var east = u.divide(safeSpeed).multiply(18000);
    var north = v.divide(safeSpeed).multiply(18000);

    // Konversi meter ke derajat untuk area dekat ekuator.
    var meterPerDegreeLon = lat.multiply(Math.PI / 180)
      .cos()
      .multiply(111320);

    var dx = east.divide(meterPerDegreeLon);
    var dy = north.divide(111320);

    var endLon = lon.add(dx);
    var endLat = lat.add(dy);

    // Dua sayap kepala panah.
    var wing1East = east.multiply(-0.28)
      .subtract(north.multiply(0.16));
    var wing1North = north.multiply(-0.28)
      .add(east.multiply(0.16));

    var wing2East = east.multiply(-0.28)
      .add(north.multiply(0.16));
    var wing2North = north.multiply(-0.28)
      .subtract(east.multiply(0.16));

    var wing1 = ee.List([
      endLon.add(wing1East.divide(meterPerDegreeLon)),
      endLat.add(wing1North.divide(111320))
    ]);

    var wing2 = ee.List([
      endLon.add(wing2East.divide(meterPerDegreeLon)),
      endLat.add(wing2North.divide(111320))
    ]);

    var start = ee.List([lon, lat]);
    var end = ee.List([endLon, endLat]);

    var geometry = ee.Geometry.MultiLineString(
      ee.List([
        ee.List([start, end]),
        ee.List([wing1, end, wing2])
      ]),
      'EPSG:4326',
      false
    );

    return ee.Feature(geometry, {
      speed_m_s: speed
    });
  }).filter(ee.Filter.gt('speed_m_s', 0.1));
}

// ============================================================
// 6. PANEL DAN LEGENDA
// ============================================================
var panel = ui.Panel({
  style: {
    width: '350px',
    padding: '12px'
  }
});

panel.add(ui.Label('MOUNT RUANG MINI PROJECT', {
  fontWeight: 'bold',
  fontSize: '19px',
  color: '#183B65'
}));

panel.add(ui.Label(
  'Erupsi acuan: 17 April 2024, 12:15 UTC (20:15 WITA)',
  {
    fontSize: '12px',
    color: '#444444'
  }
));


var mapTitle = ui.Label('WIND SPEED AND DIRECTION', {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#183B65',
  textAlign: 'center',
  stretch: 'horizontal',
  margin: '0'
});

var mapSubtitle = ui.Label(
  'Mount Ruang | Wind Data: 12:00 UTC (20:00 WITA)',
  {
    fontSize: '13px',
    color: '#333333',
    textAlign: 'center',
    stretch: 'horizontal',
    margin: '6px 0 0 0'
  }
);

var titlePanel = ui.Panel({
  widgets: [mapTitle, mapSubtitle],
  style: {
    position: 'top-center',
    width: '440px',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.96)',
    border: '1px solid #D5DCE5'
  }
});

Map.add(titlePanel);

var title = ui.Label('', {
  fontWeight: 'bold',
  fontSize: '15px',
  margin: '12px 0 6px 0'
});

var detail = ui.Label('', {
  whiteSpace: 'pre-wrap'
});

var legend = ui.Panel();

panel.add(detail);
panel.add(legend);

function clearLegend() {
  legend.clear();
}

function continuousLegend(label, vis) {
  clearLegend();
  legend.add(ui.Label(label, {fontWeight: 'bold'}));

  legend.add(ui.Thumbnail({
    image: ee.Image.pixelLonLat()
      .select('longitude')
      .visualize({
        min: 0,
        max: 1,
        palette: vis.palette
      }),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '300x20',
      format: 'png'
    },
    style: {stretch: 'horizontal'}
  }));

  legend.add(ui.Panel({
    widgets: [
      ui.Label(String(vis.min)),
      ui.Label(String((vis.min + vis.max) / 2), {
        stretch: 'horizontal',
        textAlign: 'center'
      }),
      ui.Label(String(vis.max))
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  }));
}

function classLegend() {
  clearLegend();

  legend.add(ui.Label('NHI hotspot classes', {
    fontWeight: 'bold'
  }));

  [
    ['ffff00', '1 - Mid-low'],
    ['ff0000', '2 - High'],
    ['9900ff', '3 - Extreme']
  ].forEach(function(item) {
    legend.add(ui.Panel({
      widgets: [
        ui.Label('', {
          backgroundColor: '#' + item[0],
          padding: '8px',
          margin: '4px 8px 4px 0'
        }),
        ui.Label(item[1])
      ],
      layout: ui.Panel.Layout.flow('horizontal')
    }));
  });

  legend.add(ui.Label(
    'No hotspot detection does not prove absence of activity.'
  ));
}

function addBoundary(region) {
  Map.addLayer(
    ee.FeatureCollection([ee.Feature(region)]).style({
      color: 'ffff00',
      fillColor: '00000000',
      width: 2
    }),
    {},
    'Analysis boundary'
  );
}

function addVolcano() {
  Map.addLayer(
    VOLCANO,
    {color: 'ff3333'},
    'Mount Ruang'
  );
}

// ============================================================
// 7. TAMPILAN SO2 PER HARI
// ============================================================
function showSO2(date) {
  Map.layers().reset();

  var image = ee.Image(
    so2Daily.filter(ee.Filter.eq('date', date)).first()
  );

  Map.addLayer(image, SO2_VIS, 'SO2 ' + date);
  addBoundary(AOI_SO2);
  addVolcano();

  Map.centerObject(AOI_SO2, 6);

  title.setValue('DAILY SO2 COLUMN DENSITY');

  detail.setValue(
    date + ' UTC\n' +
    'Daily mean composite | Sentinel-5P/TROPOMI\n' +
    'Blank pixels indicate no valid observations.\n' +
    'Values above the legend maximum share the highest color.'
  );

  continuousLegend('SO2 (mol/m²)', SO2_VIS);
}

panel.add(ui.Label('SO2 - pilih tanggal', {
  fontWeight: 'bold',
  margin: '14px 0 4px 0'
}));

var so2Select = ui.Select({
  placeholder: 'Loading SO2 dates...',
  onChange: showSO2
});

panel.add(so2Select);

so2Daily.aggregate_array('date').evaluate(function(dates, error) {
  if (error || !dates || !dates.length) {
    print('Tanggal SO2 gagal dimuat:', error);
    return;
  }

  so2Select.items().reset(dates);
  so2Select.setValue(dates[0], true);
});

// ============================================================
// 8. TAMPILAN NHI PER TANGGAL
// ============================================================
function showNHI(date) {
  Map.layers().reset();

  var image = getNHIImage(date);

  Map.addLayer(
    image.clip(AOI_NHI),
    {
      bands: ['B12', 'B11', 'B8A'],
      min: 200,
      max: 3500
    },
    'Sentinel-2 SWIR composite ' + date
  );

  Map.addLayer(
    image.select('HOTSPOT').selfMask().clip(AOI_NHI),
    HOT_VIS,
    'NHI hotspot ' + date
  );

  addBoundary(AOI_NHI);
  addVolcano();
  Map.centerObject(AOI_NHI, 13);

  title.setValue('NORMALIZED HOTSPOT INDEX');

  detail.setValue(
    date + ' UTC | Sentinel-2 L1C\n' +
    'Radiance-based screening following the training module.\n' +
    'Check clouds, plume and non-volcanic heat sources visually.'
  );

  classLegend();

  print(
    'NHI tanggal terpilih:',
    nhiStats.filter(ee.Filter.eq('date', date))
  );
}

panel.add(ui.Label('NHI - pilih tanggal', {
  fontWeight: 'bold',
  fontSize: '16px',
  margin: '18px 0 8px 0'
}));

var nhiSelect = ui.Select({
  placeholder: 'Loading Sentinel-2 dates...',
  onChange: showNHI
});

panel.add(nhiSelect);

nhiDates.evaluate(function(dates, error) {
  if (error || !dates || !dates.length) {
    nhiSelect.setPlaceholder('Tidak ada scene yang memenuhi filter');
    print('NHI: tidak ada scene, atau pemuatan gagal.', error);
    return;
  }

  nhiSelect.items().reset(dates);

  // Tidak otomatis memilih scene sebagai hasil "terbaik".
  // Periksa setiap tanggal secara visual terlebih dahulu.
});

// ============================================================
// 9. TAMPILAN ANGIN PER WAKTU
// ============================================================
function showWind(time) {
  Map.layers().reset();

  var wind = getWind(time);

  Map.addLayer(
    wind.select('speed'),
    WIND_VIS,
    'ERA5 wind speed ' + time
  );

  Map.addLayer(
    makeArrows(wind).style({
      color: 'ffffff',
      width: 2
    }),
    {},
    'Wind movement arrows'
  );

  addBoundary(AOI_WIND);
  addVolcano();
  Map.centerObject(AOI_WIND, 8);

  title.setValue('WIND SPEED AND DIRECTION');

detail.setValue(
  time.replace('T', ' ') + ' UTC\n\n' +
  '➤  Wnd Direction' +
  '●   Mount Ruang\n' +
  '▰  Raster color = wind speed (m/s)'
);

  continuousLegend('Wind speed (m/s)', WIND_VIS);

  print(
    'Statistik angin terpilih:',
    windStats.filter(
      ee.Filter.eq(
        'time_UTC',
        ee.Date(time).format('YYYY-MM-dd HH:mm')
      )
    )
  );
}

panel.add(ui.Label('ERA5 - pilih waktu UTC', {
  fontWeight: 'bold',
  margin: '14px 0 4px 0'
}));

panel.add(ui.Select({
  items: WIND_TIMES,
  placeholder: 'Pilih waktu angin',
  onChange: showWind
}));

// ============================================================
// 10. INFORMASI LOKASI DAN KEJADIAN ERUPSI
// ============================================================
var studyDescription =
  'Lokasi penelitian adalah Gunung Ruang, ' +
  'Kabupaten Kepulauan Siau Tagulandang Biaro, ' +
  'Sulawesi Utara. Analisis dilakukan menggunakan ' +
  'data satelit SO2, kandidat anomali termal NHI, ' +
  'dan angin ERA5.\n\n' +

  'Kejadian acuan: 17 April 2024, pukul 12:15 UTC ' +
  '(20:15 WITA).\n\n' +

  'Periode analisis:\n' +
  '- SO2: 17-24 April 2024 (UTC).\n' +
  '- Pencarian NHI: 17-29 April 2024.\n\n' +

  'Catatan: waktu akuisisi citra satelit dapat ' +
  'berbeda dari waktu kejadian erupsi.';

var eventSource =
  'https://geologi.esdm.go.id/media-center/' +
  'kenaikan-status-g-ruang-dari-siaga-ke-awas-17-april-2024';

print('NOMOR 1 — LOKASI DAN KEJADIAN:', studyDescription);
print('Sumber kejadian — Badan Geologi:', eventSource);

var studyPanel = ui.Panel({
  style: {
    padding: '8px',
    margin: '8px 0',
    backgroundColor: 'f2f5f8'
  }
});

studyPanel.add(ui.Label('LOKASI DAN KEJADIAN ERUPSI', {
  fontWeight: 'bold'
}));

studyPanel.add(ui.Label(studyDescription, {
  whiteSpace: 'pre-wrap',
  fontSize: '12px'
}));

studyPanel.add(ui.Label({
  value: 'Sumber kejadian: Badan Geologi',
  targetUrl: eventSource,
  style: {
    color: '1565c0',
    fontSize: '12px'
  }
}));

panel.insert(1, studyPanel);

// Mengisi pilihan NHI awal tanpa mengganti peta SO2 otomatis.
nhiDates.evaluate(function(dates, error) {
  if (!error && dates && dates.length > 0) {
    nhiSelect.items().reset(dates);
    nhiSelect.setValue(dates[0], false);
  }
});

// ============================================================
// JUDUL DAN LEGENDA DI DALAM PETA 
// ============================================================
// Simpan teks yang sedang tampil.
var currentTitle = title.getValue();
var currentDetail = detail.getValue();

// Sembunyikan widget lama di panel samping.
title.style().set('shown', false);
detail.style().set('shown', false);
legend.style().set('shown', false);

// Buat widget baru.
// Fungsi showSO2, showNHI, dan showWind akan memakai ini.
title = ui.Label(currentTitle, {
  fontWeight: 'bold',
  fontSize: '16px',
  margin: '0 0 6px 0'
});

detail = ui.Label(currentDetail, {
  whiteSpace: 'pre-wrap',
  fontSize: '12px',
  margin: '0 0 8px 0'
});

legend = ui.Panel();

var mapInfo = ui.Panel({
  widgets: [title, detail, legend],
  style: {
    position: 'bottom-left',
    width: '330px',
    padding: '12px',
    backgroundColor: 'ffffff'
  }
});

Map.add(mapInfo);

// ============================================================
// 11. EKSPOR RASTER
// ============================================================
// Ekspor raster GeoTIFF ke Google Drive.
// ============================================================
panel.add(ui.Label('Ekspor data ke Google Drive', {
  fontWeight: 'bold',
  margin: '14px 0 4px 0'
}));

panel.add(ui.Button('Export SO2 tanggal terpilih', function() {
  var date = so2Select.getValue();

  if (!date) {
    print('Pilih tanggal SO2 dahulu.');
    return;
  }

  var image = ee.Image(
    so2Daily.filter(ee.Filter.eq('date', date)).first()
  );

  Export.image.toDrive({
    image: image.toFloat(),
    description: 'Ruang_SO2_' + date.replace(/-/g, ''),
    region: AOI_SO2,
    scale: 1113.2,
    crs: 'EPSG:4326',
    maxPixels: 1e9,
    fileFormat: 'GeoTIFF'
  });

  print('Task ekspor SO2 dibuat. Buka tab Tasks.');
}));

panel.add(ui.Button('Export NHI tanggal terpilih', function() {
  var date = nhiSelect.getValue();

  if (!date) {
    print('Pilih tanggal NHI dahulu.');
    return;
  }

  Export.image.toDrive({
    image: getNHIImage(date).select('HOTSPOT').toByte(),
    description: 'Ruang_NHI_' + date.replace(/-/g, ''),
    region: AOI_NHI,
    scale: 20,
    crs: 'EPSG:32651',
    maxPixels: 1e9,
    fileFormat: 'GeoTIFF'
  });

  print('Task ekspor NHI dibuat. Buka tab Tasks.');
}));

WIND_TIMES.forEach(function(time) {
  Export.image.toDrive({
    image: getWind(time).toFloat(),
    description: 'Ruang_ERA5_' + time.replace(/[-:]/g, ''),
    region: AOI_WIND,
    scale: 27830,
    crs: 'EPSG:4326',
    maxPixels: 1e9,
    fileFormat: 'GeoTIFF'
  });
});

ui.root.insert(0, panel);