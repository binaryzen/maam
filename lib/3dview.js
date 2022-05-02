// component references
var qVizList = {};
var timelineController = null;
var layouts = layouts || [];

// animation/camera filters
var animationFilter = ( t ) => {
  let dt = t % TEMPO;
  let key = t - dt;
  let p = dt / TEMPO;
  p += ( SYNC_OFFSET/TEMPO );
  if ( p < 0 ) p += 1.0;
  camVibe( p );
  p = UTIL.shuffle ( p, SHUFFLE, BEAT_COUNT );
  return key + ( p * TEMPO );
};
var camVibe = ( p ) => {
    if ( SHUFFLE == 0 ) return;
    var phase = Math.PI * 2 * p;
    var bd1 = AUD.currentTime > BEAT_DROP ? 1/200 : 0;
    var bd2 = AUD.currentTime > BEAT_DROP ? 1/5
        : AUD.currentTime > BEAT_DROP - .5 ? 0
        : AUD.currentTime > BEAT_DROP * .75 ? 1/10
                : 1/20;
    var dz = Math.sin( phase * 2 ) * SHUFFLE * bd1; // subtle
    var dy = Math.abs( Math.sin( phase * 2 ) ) * SHUFFLE * bd2 / 5;
    camera.zoom = 1 + dz;
    camera.lookAt( v3( controls.target.x, controls.target.y + dy, controls.target.z ) );
    camera.updateProjectionMatrix();
};
//
// set the scene
//
const scene = new THREE.Scene();
//
// lights
//
const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight( 0xffffff, 1.0 );
directionalLight1.position.set(0, 10, 0);
directionalLight1.target.position.set(-5, 0, -2);
scene.add( directionalLight1 );
scene.add( directionalLight1.target );

const directionalLight2 = new THREE.DirectionalLight( 0x999999, 1.0 );
directionalLight2.position.set(0, -10, 0);
directionalLight2.target.position.set(5, 0, 2);
scene.add( directionalLight2 );
scene.add( directionalLight2.target );
//
// cameras
//
const fov = 35;
const ortho = 40;
const aspect = WIDTH/HEIGHT;
const cams = [
  new THREE.OrthographicCamera( -ortho*aspect/2, ortho*aspect/2, ortho/2, -ortho/2),
  new THREE.PerspectiveCamera( fov, aspect )
];
var camIndex = 0;
var camera = cams[0];
camera.position.x = -40;
camera.position.y = 25;
camera.position.z = 50;
scene.add(camera);
//
// Rendering
//
var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(BG_COLOR, 1.0);
//
// UI camera control hooks
//
var controls = new OrbitControls( camera, renderer.domElement );
//
// Camera control swap
//
function swapCams() {
  console.log("swappin' cams");
  // get new camera
  setCam(++camIndex);
}
function setCam( index ) {
  let cam = cams[ index  % cams.length ];
  cam.position.copy(camera.position);
  cam.rotation.copy(camera.rotation);
  let tX = controls.target.x;
  let tY = controls.target.y;
  let tZ = controls.target.z;

  camera = cam;

  controls = new OrbitControls( camera, renderer.domElement );
  controls.target = new THREE.Vector3( tX, tY, tZ );
}
//
// Update HTML controls state
//
function updateUIControls(t = 0) {
  if ( timelineController & positionSlider ) {
    positionSlider.val( timelineController.p * 4096 );
  }
}

function render( t ) {
    T = t; // globalize time
    timelineController.update( t );
    updateUIControls( t );
    // use filtered t for animation updates
    let tt = animationFilter( t );
    for (c in COMPONENTS) {
        COMPONENTS[c].update( tt );
    }
    // render scene from camera
    renderer.render( scene, camera );
    requestAnimationFrame( render );

    TWEEN.update();
}

//
// handles resizing of the window
//
function handleResize(event) {
  let width = window.innerWidth;
  let height = window.innerHeight - FOOTER_HEIGHT;
  let newAspect = width / height;
  camera.aspect = newAspect;
  camera.left = ortho * newAspect / -2;
  camera.right = ortho * newAspect / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);  
  setCanvasDimensions(renderer.domElement, width, height);
}

//
// updates the canvas dimensions
//
function setCanvasDimensions(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}


let cameraPresetIndex = 0;
//
// listens for click events to change the camera preset
//

function changeCameraPreset(event) {
  index = cameraPresetIndex % CAMERA_PRESET_POSITIONS.length;
  console.log("index is "+index);
  moveCamera(getNextCameraPresetPosition());
}

//
// moves the camera to the specified destination
//
function moveCamera(destinationPosition, duration = 1500) {
  let currentPosition = new THREE.Vector3().copy(camera.position);
  // move camera
  controls.target.copy(destinationPosition[1]);
  new TWEEN.Tween(currentPosition)
    .to(destinationPosition[0], duration)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      camera.position.copy(currentPosition);
      camera.lookAt(destinationPosition[1]);
    })
    .start();
}

//
// returns the next preset camera position
//
function getNextCameraPresetPosition() {
  cameraPresetIndex++;
  return CAMERA_PRESET_POSITIONS[cameraPresetIndex % CAMERA_PRESET_POSITIONS.length];
}
// puts text in 3d space
var sprite;
function context_hide() {
    scene.remove(sprite);
}
function context_display( text, position, duration = 1500 ) {
    scene.remove(sprite);
    showText(text);
    const canvasTexture = new THREE.CanvasTexture( document.querySelector("#canvas") );
    const material = new THREE.SpriteMaterial( { map: canvasTexture } );
    sprite = new THREE.Sprite( material );
    sprite.scale.set(25, 25, 1);
    sprite.position.copy(position);
    scene.add( sprite );
}
function showText(lines){
    let text = lines.split('\n');
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = 500;
    ctx.canvas.height = 500;
    const x = 30;
    const y = 30;
    const lineheight = 15;
    ctx.fillStyle = "white";
    ctx.font = "20px arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for ( i = 0; i<text.length; i++ )
        ctx.fillText(text[i], x, y + ( i * lineheight ) );
}