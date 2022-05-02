### Project contents:
```
[maam]
  |-[data]
  | |- *.json
  | \- readme.md
  |-[lib]
  |   |-[three.js]
  |   |- 3dview.js
  |   |- data.js
  |   |- global.js
  |   |- timeline.js
  |   \- visualizers.js
  |- favico.ico
  |- index.html
  \- README.md *

* You are here
```
The `data` folder holds metric data sets. `data/readme.md` should describe each data file well enough to make it useful

`global.js` is a list of global configs and util methods. Would not be bad to scope this

`data.js` defines methods to load metric data and load to view controller

`timeline.js` defines the controller and timeline-related entities

`visualizers.js` classes that extend ModelViz, and also ModelViz, which enjoin a 3d avatar with the model state

`3dview.js` view setup code

`favico.ico` stub to reduce 404 noise in trace logs

`index.html` tricks web browsers into running the program

### Quickstart

Install either the [http-server](https://www.npmjs.com/package/http-server) or [live-server](https://www.npmjs.com/package/live-server) npm package and run it from the MAAM root project folder.

`http-server`
```
npm install --global http-server
cd <maam project folder>
http-server
```

`live-server` (supports live reloading)
```
npm install --global live-server
cd <maam project folder>
live-server
```

Open FireFox or Chrome to [http://localhost:8080](http://localhost:8080) (port may differ per `http-server`/`live-server` output)

### Code notes:
#### Common name conventions:
- n - number of things
- t - global time index
- p - local cycle phase on interval (0,1) or (0,1]
- pos - 3d position cursor
- el - element (component)
- v - vector
#### Common shorthands:
Providing default values for optional parameters with `||` (not safe for params that might be 0 or false - macro might be better.)
```
attribute = value || default;
```
Constructor shortcuts - code creates a lot of 3-vectors, so shorthand makes code more readable:
```
const v3 = (x,y,z) => new THREE.Vector3(x,y,z);

var thisPoint = v3(0,0,0);
// is equivalent to:
var thatPoint = new THREE.Vector3(0,0,0);
```
### 3D assumptions:
- default component dimensions should be <12,12,12>
- component space should be bounded by intervals <[-6, 6], [-6, 6], [0, 12]>
- default local input point for a component is <0,0,0>
- default local output point for a component is <0,0,12>
- the positive Z dimension generally indicates upstream
### Animation assumptions:
- TEMPO is the period of animation cycles in ms (1000-10000 = reasonable range)
- animation cycles are driven from each component's update(t) function
- cycle phase `p` is equal to `(t % TEMPO)/TEMPO`
