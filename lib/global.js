//
// Bucket o' semantics
//
// visual parameters
const FOOTER_HEIGHT = 200;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight - FOOTER_HEIGHT;
var BPM = 120;
var BEAT_COUNT = 4;
var BEAT_DROP = 32.2;
var T = 0; // updated on render frame
var SYNC_OFFSET = 0; // music sync <(*_*<)
var TEMPO = ( 60 * 1000 ) * BEAT_COUNT / BPM; // length of 1 animation cycle in ms
var SHUFFLE = 0; // (-1, 1)
var OFFSET = 0; // audio sync
var BG_COLOR = 0x161224;
var COMPONENTS = {};
var DATA = {};
var INT_MOUSE = new THREE.Vector2(); // used for mouseover intersections
var RAYCASTER = new THREE.Raycaster(); // used for mouseover intersections
//
// so tedious
const v3 = (x,y,z) => new THREE.Vector3(x,y,z);
const e3 = (x,y,z,order='XYZ') => new THREE.Euler(x,y,z,order);
//
// materials
const mesh_of = ( args ) => new THREE.MeshPhongMaterial( args );
const line_of = ( args ) => new THREE.LineDashedMaterial( args );

const MAT = {
  TRANS: mesh_of({ color: 0xffffff, opacity: 0.1, transparent: true }),
  AQUA:   mesh_of({ color: 0x049ef4 }),
  RED:    mesh_of({ color: 0xf46666 }),
  GREEN:  mesh_of({ color: 0x00f466 }),
  ES_GREEN: mesh_of({ color: 0x3FFF00 }),
  EC2_GREEN:  mesh_of({ color: 0x00f466 }),
  EC2_LIGHTGREEN: mesh_of({color: 0x00f466, opacity: 0.5, transparent: true}),
  BLUE:   mesh_of({ color: 0x0000f4 }),
  ECS_BLUE: mesh_of({ color: 0x2986cc}),
  ECS_LIGHTBLUE: mesh_of({ color: 0x2986cc, opacity: 0.5, transparent: true }),
  YELLOW: mesh_of({ color: 0xf4f400 }),
  ORANGE: mesh_of({ color: 0xf49900 }),
  GOLD: mesh_of({ color: 0xd4af37 }), // metalic gold
  GREY:   mesh_of({ color: 0x999999 }),
  WHITE:  mesh_of({ color: 0xFFFFFF }),
  LINE: line_of({
    color: 0x666666,
    scale: 8,
    dashSize:1,
    gapSize:0
  })
}
//
// release the acronyms (maybe scope this to a metrics dict)
const MET = {
  // SQS
  SQS_ANMV:               "ApproximateNumberOfMessagesVisible",
  SQS_ANMVDLQ:            "ApproximateNumberOfMessagesVisible-DLQ",
  SQS_ANMNV:              "ApproximateNumberOfMessagesNotVisible",
  SQS_NMS:                "NumberOfMessagesSent",
  SQS_NMD:                "NumberOfMessagesDeleted",
  SQS_NMR:                "NumberOfMessagesReceived",
  SQS_ANMV_LAST:          "ApproximateNumberOfMessagesVisible_last",
  SQS_ANMVDLQ_LAST:       "ApproximateNumberOfMessagesVisible-DLQ_last",
  SQS_ANMNV_LAST:         "ApproximateNumberOfMessagesNotVisible_last",
  SQS_NMS_LAST:           "NumberOfMessagesSent_last",
  SQS_NMD_LAST:           "NumberOfMessagesDeleted_last",
  SQS_NMR_LAST:           "NumberOfMessagesReceived_last",
  // EC2
  EC2_CPU:          "CPUUtilization",
  EC2_NUM_HOSTS:    "HealthyHostCount",
  EC2_500_RATE:     "HTTPCode_Backend_5XX",
  EC2_400_RATE:     "HTTPCode_Backend_4XX",
  EC2_ERR_RATE:     "EC2_ERR_RATE",
  EC2_LATENCY:      "Latency",
  EC2_ALARM:        "EC2_ALARM",
  EC2_NUM_REQUEST: "RequestCount",
  EC2_STATUS_HEALTH_CHECK: "StatusCheckFailed",
  // ECS
  ECS_CPU_UTILIZATION:    "CPUUtilization",
  ECS_MEMORY_UTILIZATION: "MemoryUtilization",
  ECS_RC:          "RequestCount",
  ECS_RTC:          "RunningTaskCount",
  // ES
  ES_READ_IOPS:           "ReadIOPS",
  ES_NODES:               "Nodes",
  ES_STATUS_GREEN:        "ClusterStatus.green",
  ES_STATUS_YELLOW:       "ClusterStatus.yellow",
  ES_STATUS_RED:          "ClusterStatus.red",
  ES_READ_LATENCY:        "ReadLatency",
  ES_WRITE_LATENCY:       "WriteLatency",
  ES_SEARCH_LATENCY:      "SearchLatency",
  ES_INDEXING_LATENCY:    "IndexingLatency",
  ES_2XX:                 "2xx",
  ES_3XX:                 "3xx",
  ES_4XX:                 "4xx",
  ES_5XX:                 "5xx",
  ES_INVALID_HOST_HEADER_REQUESTS: "InvalidHostHeaderRequests",
  // Dynamo
  DYN_CRCU:               "ConsumedReadCapacityUnits",
  DYN_CWCU:               "ConsumedWriteCapacityUnits",
  DYN_SYS_ERRS:           "SystemErrors",
  DYN_USER_ERRS:          "UserErrors",
  DYN_LATENCY:            "SuccessfulRequestLatency"
};
//
// handy functions
const UTIL = {
  vCopy: (v) => v3( v.x, v.y, v.z ),
  returnZero: (x) => 0,
  // produces signal -_-_
  strobe4: (p) => Math.floor(p * 4) % 2 == 0,
  // <3
  lubdub: (p) => (
    [ 0, BEAT_COUNT * 1.5, BEAT_COUNT * 2, BEAT_COUNT * 3.5 ]
    .reduce( ( x, i ) => ( x |
      ( (p>(i/(4*BEAT_COUNT))?1:0) & (p<((i+1)/(4*BEAT_COUNT))?1:0) )
    ), 0 ) == 1 ),
  // number of artifacts appropriate to represent the log of n in b
  logRate: (n, b) => {
    if (n < 0) return 0;
    return Math.ceil( Math.log(n) / Math.log(b) );
  },
  // same as logRate, but w/ pos/neg dimension
  deltaLogRate: (dx, b) => {
    if (dx == 0) return 0;
    let dir = dx/Math.abs(dx);
    return dir * UTIL.logRate(Math.abs(dx), b);
  },
  // handy for building/destroying arrays of visual artifacts
  drainFill: (array, limit, dispose, generate) => {
    while (array.length > limit) {
        dispose(array.pop());
        if (array.length == 0) return;
    }
    while (array.length < limit) {
      array.push(generate());
    }
  },
  // removes an element if its a thing
  rmEl: (el) => {
    if (el) el.removeFromParent();
  },
  // for a multi-point 3d path, returns point along path at p | 0.0 <= p <= 1
  getPathPos: function ( p , path ) {
    let n = path.length - 1;
    let i0 = Math.floor(p * n);
    let i1 = i0 + 1;
    let dp = n * p - i0;
    try {
      return path[i0].clone().lerp(path[i1], dp);
    }
    catch(error) {
      return null;
    }
  },
  interpolate: function ( p, poles ) {
    let n = poles.length - 1;
    let i0 = Math.floor ( p * n );
    let i1 = i0 + 1;
    let p0 = i0 / n;
    let p1 = i1 / n;
    let dp = ( p - p0 ) / ( p1 - p0 );
    let pp0 = poles[ i0 ];
    let pp1 = poles[ i1 ];
    return pp0 + ( dp * ( pp1 - pp0 ) );
  },
  shuffle: function ( p, amt=1.0, n=8 ) {
    let i0, i1, p0, p1, s0, s1;
    let poles = [];
    // scale shuffle amt to 8% (triplet shuffle)
    amt *= 0.08;
    for (i = 0; i < n + 1; i ++) {
      poles[i] = ( i / n )
        + ( amt * ( i % 2 ) ); // shuffle odd poles
      if ( poles[i] > p ) {
        i0 = i - 1;
        p0 = poles[ i0 ];
        dp = poles[ i0 + 1 ] - p0;
        s0 = i0 / n;
        ds = 1 / n;
        break;
      }
    }
    return s0 + ( ds * ( p - p0 ) / dp );
  }
};

const DIALOGUE = {
  bindingViz: function (component) {
    let binding = "";
    for ( let b in component.bindings ) {
        binding = component.bindings[b].split(":")[0];
        break;
    }
    let htmlString = '<div class="row">';
    htmlString += '<div class="col-md-12">';
    let newConstructorName = component.constructor.name.replace('Viz', '');
    htmlString += 'Component: ' + binding + ' (' + newConstructorName + ')';
    htmlString += '</div>'; // end col
    htmlString += '</div>'; // end row
    htmlString += '<div class="row">'; // start row
    htmlString += '<div class="col-md-6">'; // start col
    let rows = 0;
    let keys = Object.keys(component.bindings);
    for ( let i in keys ) {
      let key = keys[i];
      if (! key.endsWith("_last")) {
        let value = DATA[component.bindings[key]];
        let skipFormatting = false;
        if (typeof value === 'undefined') {
          value = 'n/a';
          skipFormatting = true;
        }
        if (KEY_TO_FORMATTER.hasOwnProperty(key) && !skipFormatting) {
          value = KEY_TO_FORMATTER[key](value);
        }
        htmlString += key + ': ' + value + '<br/>';
        rows++;
        if (rows >= 8) {
          htmlString += '</div>'; // end col
          htmlString += '<div class="col-md-6">'; // start col
        }
      }
    }
    htmlString += '</div>'; // end col
    htmlString += '</div>'; // end row
    return htmlString;
  },
  handleMouseMove: function handleMouseMove(event) {
    INT_MOUSE.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    INT_MOUSE.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    RAYCASTER.setFromCamera(INT_MOUSE, camera);

    let threeDObjects = [];
    let uuidToComponent = {}; //map of uuid of 3d object to component name
    for ( let c in COMPONENTS ) {
      if (! c.startsWith("__")) { // don't add conduit components
        let tdObject = COMPONENTS[c].object3d;
        threeDObjects.push(tdObject);
        uuidToComponent[tdObject.uuid] = c;
      }
    }

    let intersects = RAYCASTER.intersectObjects(threeDObjects, true);
    if (intersects.length > 0) {
      let intersect = intersects[0]; //TODO if there's multiple intersects we'll need to be smarter
      //we hit this branch mousing over containers, but UUID won't match until we hover over an inner component
      //so, we need a safety mechanism to avoid infinite while loop
      let safety = 0;
      let uuid = intersect.object.uuid;
      while ( uuidToComponent[uuid] === undefined ) {
        if (safety > 30) {
          break;
        }
        uuid = intersect.object.parent.uuid;
        safety++
      }
      if (uuidToComponent[uuid]) {
        let componentName = uuidToComponent[uuid];
        let component = COMPONENTS[componentName];
        let htmlToInject = DIALOGUE.bindingViz(component);
        DIALOGUE.populateInfoBox(htmlToInject);
      }
      //mouse does not have any intersects
      else {
        DIALOGUE.emptyInfoBox();
      }
    } else {
      DIALOGUE.emptyInfoBox();
    }
  },
  emptyInfoBox: function() {
    $("#dialogue").empty();
  },
  populateInfoBox: function(innterHTML) {
    $("#dialogue").html(innterHTML);
  }
};

const CONTEXT = {
  bindingViz: function (component) {
    let String = "";
    String += "Component: " + component.constructor.name;
    let keys = Object.keys(component.bindings);
    for ( let i in keys ) {
      let key = keys[i];
      if (! key.endsWith("_last")) {
        let dataString = key + ": " + DATA[component.bindings[key]] + "";
        String += '\n'+dataString;
      }
    }
    String += "";
    return String;
  },
  emptyInfoBox: function() {
    $("#dialogue").empty();
  },
  populateInfoBox: function(innterHTML) {
    $("#dialogue").html(innterHTML);
  }
};
//
// these are some really good points
const VEC = {
  stackSpacing: v3(0, 0.75, 0),
  inStack:      v3(0, 3, 6 - 1.1/2),
  outStack:     v3(0, 3, 6 + 1.1/2),
  dlqStack:     v3(1.1, 3, 6),
  inputPt:      v3(0, 0, 0),
  centerPt:     v3(0, 0, 6),
  outputPt:     v3(0, 0, 12)
};
//
// 3D glyphs to use as building blocks
const GEOM = {
  dot:      new THREE.SphereGeometry(0.5, 16, 16),
  headerRequestDot: new THREE.SphereGeometry(0.2, 8, 8),
  plate:    new THREE.CylinderGeometry(0.5, 0.5, VEC.stackSpacing.y/2, 32),
  bar:      new THREE.BoxGeometry(4, 0.6, 2.5),
  cubelet:  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  blip:     new THREE.BoxGeometry(0.4, 0.4, 0.4),
  bigBlip:  new THREE.BoxGeometry(0.6, 0.6, 0.6),
  httpStatusblip: new THREE.BoxGeometry(0.2, 0.2, 0.2),
  stackCap: new THREE.BoxGeometry(1.1, 0.1 + VEC.stackSpacing.y/2, 1.1),
  funnel:   new THREE.CylinderGeometry(1.0, 0.6, 1, 16),
  hitBox:   new THREE.BoxGeometry(6, 6, 6)
};
//
// paths most travelled
const PATHS = {
  // SQS incoming
  inQ:[
    VEC.inputPt,
    v3(0, 0, 3),
    v3(0, 3, 3),
    v3(0, 3, 6)
  ],
  // SQS outgoing
  outQ:[
    v3(0, 3, 6),
    v3(0, 3, 9),
    v3(0, 0, 9),
    VEC.outputPt
  ],
  // SQS go-coming
  returnQ:[
    VEC.outputPt,
    v3(3, 0, 8),
    v3(3, 0, 6),
    v3(3, 3, 6),
    v3(0, 3, 6)
  ],
  // mux in (first pt = offset from source)
  muxInputPath:[
    v3(0,0,0),

    VEC.centerPt
  ],
  // mux out
  muxOutputPath:[
    VEC.centerPt,
    VEC.outputPt
  ],
  outEC2:[
    v3(0, 0, -6),
    v3(0, 0, 0),
    v3(0, 0, 0),
    VEC.inputPt
  ],
};

//
// Camera presets
let i = 0;
let r = 75;
let h = 50;
let z0 = 36;
let x0 = 0;
let inc = Math.PI/4;
let ctr = v3(0, 0, 30);
const CAMERA_PRESET_POSITIONS = [
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
  [v3(x0 + r * Math.cos(i * inc), h, z0 + r * Math.sin(i++ * inc)), v3(0,0,24), 0.75],
];

function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return 'n/a'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
  if (i === 0) return `${bytes} ${sizes[i]}`
  return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
}

function numberToPercentage(number) {
  return `${parseFloat(number).toFixed(2)}%`;
}

function perSecond(val) {
  return `${parseFloat(val).toFixed(2)}/sec`;
}

function formatMillis(ms) {
  return `${parseFloat(ms).toFixed(2)} ms`;
}

function formatSeconds(seconds) {
  return `${parseFloat(seconds).toFixed(2)} sec`;
}

const KEY_TO_FORMATTER = {
  'NetworkIn': bytesToSize,
  'NetworkOut': bytesToSize,
  'CPUUtilization': numberToPercentage,
  'MemoryUtilization': numberToPercentage,
  'ReadIOPS': perSecond,

  // Elasticsearch metrics are in seconds
  'ReadLatency': formatSeconds,
  'WriteLatency': formatSeconds,
  'SearchLatency': formatSeconds,
  'IndexingLatency': formatSeconds,

  // EC2 latency also appears to be in seconds
  'Latency': formatSeconds,

  'SuccessfulRequestLatency': formatMillis,
};

