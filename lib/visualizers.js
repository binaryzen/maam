//
// Classes that extend ModelViz and also ModelViz
//

// ==========================================================================
// A generic visual component. May have sub-components. References a 3D object
// container, connectors between sub-components.
// ==========================================================================
class ModelViz {
  constructor(args) {
    this.model = args.model || {};
    // anchor point for visual component
    this.origin = args.origin || v3( 0, 0, 0 );
    // array of sub-components
    this.children = args.children || [];
    // root 3d group
    this.object3d = args.object3d || new THREE.Group();
    // dirty by default
    this.dirty = true;
    // intialize position vector
    this.setPosition(args.position || v3( 0, 0, 0,));
    // data binding map
    this.bindings = args.bindings || {};
    this.hitbox = new THREE.Mesh(GEOM.hitBox, MAT.TRANS);
    this.hitbox.position.copy(v3(0,3,6));
    this.hitbox.visible = false;
  }
  // data binding method
  // use bind("sourceName") or bind(MET.NMS, "sourceName:NumberOfMessagesReceived")
  bind(key1, key2=null) {
    if (!key2) {
        // bind to source metric group
        for (let d in DATA) {
            let grp, key;
            [ grp, key ] = d.split(":",2);
            if (key && key1 == grp) this.bindings[key] = d;
        }
    } else {
        // bind individual metric
        this.bindings[key1] = key2;
    }
  }
  data(key) {
    return DATA[this.bindings[key]];
  }
  // aligns the object in world space offset from the origin
  setPosition(pos) {
    this.object3d.position.subVectors(pos, this.origin);
  }
  setRotation(rot) {
    this.object3d.rotateX(rot.x);
    this.object3d.rotateY(rot.y);
    this.object3d.rotateZ(rot.z);
  }
  // catch modifications to model
  setModel(model) {
    this.model = model;
    this.setDirty();
  }
  setDirty(drill=true) {
    this.dirty = true;
    if (drill) {
      this.children.forEach((c) => c.setDirty(true));
    }
  }
  isDirty() {
    if (this.dirty) {
      this.dirty = false;
      return true;
    }
    return false;
  }
}
// ==========================================================================
// Represents an SQS queue
// ==========================================================================
class SQSViz extends ModelViz {
  constructor(args = {}) {
    super(args);
    // messages follow these paths
    this.inPath = args.inPath || PATHS.inQ;
    this.outPath = args.outPath || PATHS.outQ;
    this.returnPath = args.returnPath || PATHS.returnQ;
    // alarm strobe function
    this.strobe = args.strobe || UTIL.lubdub;//strobe4;
    // alarm hot function
    this.alarm = args.alarm || ((m) => this.data(MET.SQS_ANMV) > 5000);
    this.buildAvatar();
  }

  buildAvatar() {
    this.object3d.add(this.hitbox);

    // alarm voxel
    this.avatar = {
      status:new THREE.Mesh(GEOM.cubelet, MAT.RED)
    };
    this.avatar.status.position.copy(v3(0, 1.5, 6));
    this.object3d.add(this.avatar.status);
    // create conduit and message stack sub-components
    this.children = [
      new ConduitViz({
        bindings: this.bindings,
        path: this.inPath,
        blipMaterial: MAT.GREEN,
        getRate: (m) => this.data(MET.SQS_NMS)
      }),
      new ConduitViz({
        bindings: this.bindings,
        path: this.outPath,
        blipMaterial: MAT.GREEN,
        getRate: (m) => this.data(MET.SQS_NMR)
      }),
      new ConduitViz({
        bindings: this.bindings,
        path: this.returnPath,
        blipMaterial: MAT.RED,
        getRate: (m) => this.data(MET.SQS_NMR) - this.data(MET.SQS_NMD)

      }),
      new StackViz({
        bindings: this.bindings,
        position: VEC.inStack,
        glyphMaterial: MAT.ORANGE,
        getSize: (m) => this.data(MET.SQS_ANMV),
        getDelta: (m) => this.data(MET.SQS_ANMV) - this.data(MET.SQS_ANMV_LAST)
      }),
      new StackViz({
        bindings: this.bindings,
        position: VEC.outStack,
        glyphMaterial: MAT.AQUA,
        getSize: (m) => this.data(MET.SQS_ANMNV),
        getDelta: (m) => this.data(MET.SQS_ANMNV) - this.data(MET.SQS_ANMNV_LAST)
      }),
      new StackViz({
        bindings: this.bindings,
        position: VEC.dlqStack,
        glyphMaterial: MAT.RED,
        getSize: (m) => this.data(MET.SQS_ANMVDLQ),
        getDelta: (m) => this.data(MET.SQS_ANMVDLQ) - this.data(MET.SQS_ANMVDLQ_LAST)
      })
    ];
    // add child components to container
    this.children.forEach((c) => {
      this.object3d.add(c.object3d);
    });
  }

  update(t_ms = 0) {
    if (this.isDirty()) {
      this.children.forEach((c) => {
        c.model = this.model;
      });
    }
    // apply alarm function & strobe function to status visibility
    let p = (t_ms % TEMPO)/TEMPO;
    this.avatar.status.visible = this.alarm(this.model) && this.strobe(p);
    this.children.forEach((c) => {
      c.update(t_ms);
    });
  }
}
// ==========================================================================
// Visualizes a queue's size and the direction it is trending (delta)
// ==========================================================================
class StackViz extends ModelViz {
  constructor(args = {}) {
    super(args);
    // data adapters
    this.getSize = args.getSize || utils.returnZero;
    this.getDelta = args.getDelta || utils.returnZero;
    this.sizeScale = args.sizeScale || args.scale || (r => UTIL.logRate(r, 10));
    this.deltaScale = args.deltaScale || args.scale || (r => UTIL.deltaLogRate(r, 10));
    // skin
    this.topCap = args.topCap || args.cap || GEOM.stackCap;
    this.bottomCap = args.bottomCap || args.cap || GEOM.stackCap;
    this.topCapMaterial = args.topCapMaterial || args.capMaterial || MAT.GREY;
    this.bottomCapMaterial = args.bottomCapMaterial || args.capMaterial || MAT.GREY;
    this.glyph = args.glyph || GEOM.plate;
    this.glyphMaterial = args.glyphMaterial || MAT.GREY;
    this.spacing = args.spacing || VEC.stackSpacing;
    // init
    this.buildAvatar();
  }

  buildAvatar() {
    // 3d layout
    this.avatar = {
      topCap: new THREE.Mesh(this.topCap, this.topCapMaterial),
      bottomCap: new THREE.Mesh(this.bottomCap, this.bottomCapMaterial),
      glyphs: []
    };
    this.object3d.add(this.avatar.topCap);
    this.object3d.add(this.avatar.bottomCap);
  }

  update(t_ms) {
    let size = this.sizeScale(this.getSize(this.model));
    let delta = this.deltaScale(this.getDelta(this.model));
    let rate = Math.abs(delta);
    let dir = (delta == 0) ? 0 : rate/delta; // { 0, 1, -1 }

    // if state changed, elements may need to be created/deleted
    if (this.isDirty()) {
      // adjust number of elements in glyph array
      UTIL.drainFill(this.avatar.glyphs, size, UTIL.rmEl, () => {
        let el = new THREE.Mesh(this.glyph, this.glyphMaterial);
        this.object3d.add(el);
        return el;
      });
      // stack is invisible when empty
      // this.avatar.topCap.visible = this.avatar.bottomCap.visible = (size > 0);
    }

    // cursor for layout operation
    let pos = v3(0,this.spacing.y,0);
    // set sub-component positions
    this.avatar.topCap.position.y = pos.y + this.spacing.y * (size - 1);
    this.avatar.bottomCap.position.y = pos.y - this.spacing.y;
    this.avatar.glyphs.forEach((el, index) => {
      // animation cycle
      let p = (t_ms % TEMPO)/TEMPO;
      let pp = ((2 * rate * t_ms) % TEMPO)/TEMPO;
      let h = Math.sin(Math.PI * pp);
      let dy = (p > 0.5) ?
        (dir * pp * this.spacing.y) :
        (dir * ((h == 0) ? 0 : Math.abs(h)) * this.spacing.y / 3);

      el.position.copy(pos);
      el.position.y += dy + ((dir + 1) / 2 * -this.spacing.y);
      pos.add(this.spacing);
    });
  }
}
// ==========================================================================
// Shows rate of requests (blips) on a line. `path` param is an ordered array
// of waypoints that make up the conduit's path.
// ==========================================================================
class ConduitViz extends ModelViz {
  constructor(args = {}) {
    super(args);
    this.getRate = args.getRate;
    this.rateScale = args.rateScale || args.scale || (r => UTIL.logRate(r, 10));
    this.blipGlyph = args.blipGlyph || GEOM.blip;
    this.blipMaterial = args.blipMaterial || MAT.WHITE;
    this.path = args.path || new THREE.Path();
    this.pathMaterial = args.pathMaterial || MAT.LINE;
    this.buildAvatar();
  }

  buildAvatar() {
    let g = new THREE.BufferGeometry().setFromPoints( this.path );
    this.avatar = {
        blips: [],
        line: new THREE.Line( g, this.pathMaterial )
    };
    this.avatar.line.computeLineDistances();
    UTIL.rmEl( this.avatar.line );
    this.object3d.add( this.avatar.line );
  }

  update(t_ms) {
    let t1 = TEMPO;
    let rate = this.rateScale(this.getRate(this.model));

    UTIL.drainFill(this.avatar.blips, rate, UTIL.rmEl, () => {
      let b = new THREE.Mesh(this.blipGlyph, this.blipMaterial);
      this.object3d.add(b);
      return b;
    });

    this.avatar.blips.forEach( (el, i) => {
      let ti = ((t_ms + (i * t1 / rate / 2)) % t1) / t1;
      let pos = UTIL.getPathPos(ti, this.path);
      if (pos) el.position.copy(pos);
    });
  }
}

class SwarmViz extends ModelViz {
  constructor(args = {}) {
    super(args);
    this.getCount = args.getCount || ((m) => 10);
    this.glyph = args.glyph || GEOM.blip;
    this.material = args.material || MAT.WHITE;
    this.bounds = args.bounds || new THREE.Sphere(v3(0,0,0), 1);
    this.pathMaterial = args.pathMaterial || MAT.LINE;
    this.buildAvatar();
  }

  buildAvatar() {
    this.avatar = {
        glyphs: []
    };
  }

  update(t_ms) {
    let t1 = TEMPO;
    let n = this.getCount(this.model);

    UTIL.drainFill(this.avatar.glyphs, n, UTIL.rmEl, () => {
      let b = new THREE.Mesh(this.glyph, this.material);
      this.object3d.add(b);
      return b;
    });

    this.avatar.glyphs.forEach( (el, i) => {
      let ti0 = ( ( t_ms + ( t1 * i/n ) ) % t1 ) / t1 * Math.PI * 2;
      let ti1 = ( ( t1 * i/n ) % t1 ) / t1 * Math.PI * 2;
      //
      // mix it up
      let p0 = ( i % 2 == 0 ? 1 : -1 );
      let p1 = ( i % 3 == 2 ? 1 : -1 );
      let p2 = ( ( i % 7 ) % 2 == 1 ? 1 : -1 );
      let p3 = ( i % 5 ) % 3;

      let s0 = Math.sin( ti0 ) * this.bounds.radius * 0.12 * p0;
      let s1 = Math.cos( ti0 ) * this.bounds.radius * 0.07 * p1;
      let s2 = Math.sin( ti0 ) * this.bounds.radius * 0.04 * p2;

      let n0 = Math.sin( ti1 + T/10000 ) * this.bounds.radius * p2;
      let n1 = Math.cos( ti1 + T/10000 ) * this.bounds.radius * 0.8 * p0;
      let n2 = Math.cos( ti1 + T/10000 ) * this.bounds.radius * 0.7 * p1;

      if ( p3 == 1 ) {
        el.position.copy(this.bounds.center.clone().add(v3(s0 + n0, s1 + n1, s2 + n2)));
      } else if ( p3 == 2 ) {
        el.position.copy(this.bounds.center.clone().add(v3(s0 + n2, s1 + n0, s2 + n1)));
      } else {
        el.position.copy(this.bounds.center.clone().add(v3(s0 + n1, s1 + n2, s2 + n0)));
      }
    });
  }
}
