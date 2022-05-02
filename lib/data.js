//
// Retrieve and format data
//
var components = {};
//
// a little massaging to organize data frames chronologically
var frames = [];
function marshallData(data) {
  data.MetricDataResults.forEach((metric) => {
    let dt_ms = 900 * 1000;
    let values = metric.Values.slice().reverse();
    let valueNdx = 0;
    while (values.length < frames.length) {
        values.push(values[valueNdx++]);
    }
    values.forEach((value, i) => {
      // fill in any missing frames too
      while (frames.length <= i) {
        frames.push(new DataFrame({ t:i * dt_ms, data:{} }));
      }
      frames[i].data[metric.Label] = value;
    });
  });
}
function initializeData() {
  timelineController = new TimelineController({
    frames: frames,
    onDataUpdate: updateData
  });
}
// load current/last frame into DATA
function updateData(args) {
  let data = args.data;
  let lastData = args.lastData || data;

  for (key in data) {
    let value = data[key];
    let lastValue = lastData[key];
    let lastKey = key + "_last";
    DATA[key] = value;
    DATA[lastKey] = lastValue;
  }
  for (c in COMPONENTS) COMPONENTS[c].setDirty();
}
// data files containing the CloudWatch metrics
const dataFiles = [
    "data/dynamo.json",
    "data/ec2.json",
    "data/ecs.json",
    "data/es.json",
    "data/sqs-sns.json" ];

//
// retrieve source data, arrange view, start rendering
function launch() {
  Promise.all(dataFiles.map(dataFile => fetch(dataFile)))
  .then(responses => Promise.all(responses.map(res => res.json())))
  .then(responses => {
    let data = {
      "MetricDataResults": []
    };
    responses.forEach((response) => {
      data.MetricDataResults = data.MetricDataResults.concat(response.MetricDataResults);
    });
    updateUIControls(0);
    initializeData(data);
    updateData({
      data: timelineController.timeline.lrf.data
    });
    doLayout();
    render(0);
    TWEEN.update();
  })
}
