// Define the coordinate points
var coordinates = [
  [22.85478143035103,-36.47555859803085],
  [29.710250180351025,-33.30428730517047],
  [51.331343930351025,-20.8191961706331],
  [52.561812680351025,-18.501923790917555],
  [47.991500180351025,-7.9084536049570024],
  [53.616500180351025,9.77249036723594],
  [46.409468930351025,11.1553179007554],
  [40.432906430351025,17.11830468215251],
  [27.249312680351025,16.950235077979737],
  [-7.028031069648972,18.956774134780606],
  [-18.45381231964897,17.453987471653075],
  [-18.98115606964897,13.900564657481267],
  [-16.34443731964897,9.425850845692608],
  [-11.246781069648971,4.016146496762777],
  [-2.4577185696489723,3.1389616488646395],
  [2.2883751803510277,4.36676814973759],
  [6.682906430351028,1.3825863545484143],
  [6.682906430351028,-1.2538980963577457],
  [9.671187680351027,-5.4644452793315],
  [11.956343930351027,-10.510947373763202],
  [10.550093930351027,-18.16820959492417],
  [12.307906430351027,-24.548539260702075],
  [16.35087518035103,-30.922411900448772],
  [17.93290643035103,-34.76094509840067],
  [22.85478143035103,-36.47555859803085] 
];
// Create a polygon
var polygon = ee.Geometry.Polygon([coordinates]);
// Convert the polygon to Feature and add attributes
var feature = ee.Feature(polygon, {name: 'MyPolygon', description: 'Example feature'});
// Create FeatureCollection
var roi = ee.FeatureCollection([feature]);
Map.addLayer(roi, {color: 'red'}, 'roi');

var table = ee.FeatureCollection("users/4321hsd/Fishnet");


//Import kNDVI datasets
//2000 year
var kNDVI2000_P1 = ee.Image("projects/ee-chuchu2024bfu/assets/kNDVI_P1")
var kNDVI2000_P2 = ee.Image("projects/ee-chuchu2024bfu/assets/kNDVI_P2")
var kNDVI2000_P3 = ee.Image("projects/ee-chuchu2024bfu/assets/kNDVI_P3")
var kNDVI2000_P4 = ee.Image("projects/ee-chuchu2024bfu/assets/kNDVI_P4")
//2023 year
var kNDVI2023_P1 = ee.Image("projects/ee-charlienzo6603/assets/kNDVI_p1")
var kNDVI2023_P2 = ee.Image("projects/ee-charlienzo6603/assets/kNDVI_p2")
var kNDVI2023_P3 = ee.Image("projects/ee-eckefrancisco282/assets/kNDVI_P3")
var kNDVI2023_P4 = ee.Image("projects/ee-liyibing7009/assets/kNDVI_P4")
//Merge subregions kNDVI 
var kNDVI2000 = ee.ImageCollection([kNDVI2000_P1,kNDVI2000_P2,kNDVI2000_P3,kNDVI2000_P4]).max()
var kNDVI2023 = ee.ImageCollection([kNDVI2023_P1,kNDVI2023_P2,kNDVI2023_P3,kNDVI2023_P4]).max()

//Show kNDVI     
var ndviVis = {
min: -1,  
max: 1,  
palette: [
'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
'66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
'012E01', '011D01', '011301'
],
};

Map.centerObject(roi,{},"roi")
Map.addLayer(kNDVI2000,ndviVis,"kNDVI2000")
Map.addLayer(kNDVI2023,ndviVis,"kNDVI2023")


//2000 forest cover
var Forest2000 = ee.Image("UMD/hansen/global_forest_change_2023_v1_11")
                .select('treecover2000')
                .gte(25)
                .unmask()
                .clip(roi)
//Loss forest from 2000 to 2023
var Loss2023 = ee.Image("UMD/hansen/global_forest_change_2023_v1_11")
                .select('loss')
                .unmask()
                .clip(roi)
//2023 forest cover                
var Forest2023 = Forest2000.updateMask(Loss2023.neq(1)).unmask()
Map.addLayer(Forest2000,{},"Forest2000")
Map.addLayer(Forest2023,{},"Forest2023")

//Unchanged forest from 2000 to 2023
var unchanged_Forest = Forest2000.eq(1).and(Forest2023.eq(1)).clip(roi)
//Using the forest layer mask corresponding to the kNDVI of the pixel 
var ForestNDVI2000 = (kNDVI2000).updateMask(Forest2000).rename("kNDVI2000")
var ForestNDVI2023 = (kNDVI2023).updateMask(Forest2023).rename("kNDVI2023")
//Merge bands
var kNDVI = ForestNDVI2000.addBands(ForestNDVI2023)
var Common_kNDVI = kNDVI.updateMask(unchanged_Forest)

//The average kNDVI of the forest in the corresponding area was extracted according to a 5km×5km grid
var Mean_kndvi = Common_kNDVI.reduceRegions({
  collection: table,  // The grid cell to be counted
  reducer: ee.Reducer.mean(),  // Using the mean value
  scale: 30  // scale
});

//Export the mean kNDVI as a CSV file
Export.table.toDrive({
  collection: Mean_kndvi,
  description: 'Mean_kndvi',
  folder:'Mean_kndvi',
  fileFormat: 'CSV'
});
 
 
 
 
 
 
 
 
 
 
 
 
 
 