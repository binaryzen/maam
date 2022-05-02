class ESViz extends ModelViz {
    constructor(args={}) {
        super(args);
        this.inPath = args.inPath || PATHS.inQ;
        this.outPath = args.outPath || PATHS.outQ;
        this.alarm = args.alarm || ((m) => false);
        this.buildAvatar();
    }

    buildAvatar() {
        this.object3d.add(this.hitbox);
        this.avatar = {
            dbTower: new THREE.Mesh( new THREE.CylinderGeometry(1, 1, 2, 32), MAT.GREY ),
        };
        this.object3d.add(this.avatar.dbTower);
        this.avatar.dbTower.position.copy(VEC.centerPt);
        this.children = [
          new ConduitViz({
            bindings: this.bindings,
            path: this.inPath,
            blipMaterial: MAT.GREEN,
            getRate: (m) => this.data(MET.ES_2XX)
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [v3(1,3,6), v3(1,3,8), v3(0.25,0.5,8), v3(0.25,0.5,6)],
            blipMaterial: MAT.AQUA,
            getRate: (m) => this.data(MET.ES_INDEXING_LATENCY) * 1000
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [v3(-1,3,6), v3(-1,3,8), v3(-0.25,0.5,8), v3(-0.25,0.5,6)].reverse(),
            blipMaterial: MAT.ORANGE,
            getRate: (m) => this.data(MET.ES_SEARCH_LATENCY) * 1000
          }),
          new HealthStatusViz({
            bindings: this.bindings,
            alarm: this.alarm
          }),
          new InvalidHeaderRequestViz({
            bindings: this.bindings,
            blockPosition: v3(0, 3, 5),
            getHeaderRequest: (m) => UTIL.logRate(this.data(MET.ES_INVALID_HOST_HEADER_REQUESTS), 10)
          }),
          new HTTPCodesViz({
            bindings: this.bindings,
            blockPosition: v3(0, 3, 5),
            get200Rate: (m) => UTIL.logRate(this.data(MET.ES_2XX), 10),
            get300Rate: (m) => UTIL.logRate(this.data(MET.ES_3XX), 10),
            get400Rate: (m) => UTIL.logRate(this.data(MET.ES_4XX), 10),
            get500Rate: (m) => UTIL.logRate(this.data(MET.ES_5XX), 10)
          }),
          new SwarmViz({
            bindings: this.bindings,
            bounds: new THREE.Sphere(v3(0, 5, 8), 1),
            getCount: (m) => this.data(MET.ES_NODES),
            material: MAT.WHITE,
            glyph: new THREE.DodecahedronGeometry(0.2)
          })
        ];
        this.children.forEach(c => this.object3d.add(c.object3d));
    }

    update(t = 0) {
        this.children.forEach(c => c.update(t));
    }
}

class HealthStatusViz extends ModelViz {
  constructor(args={}) {
      super(args);
      this.getHealth = args.getHealth;
      this.inPath = args.inPath || PATHS.inQ;
      this.outPath = args.outPath || PATHS.outQ;
      this.statusRed = (m) => this.data(MET.ES_STATUS_RED);
      this.statusYellow = (m) => this.data(MET.ES_STATUS_YELLOW);
      this.statusGreen = (m) => this.data(MET.ES_STATUS_GREEN);
        // alarm strobe function
    this.strobe = args.strobe || UTIL.lubdub;//strobe4;
    // alarm hot function
    this.alarm = args.alarm || ((m) => (this.data(MET.ES_5XX) > 25));

      this.buildAvatar();
  }

  buildAvatar() {
      this.avatar = {
          block: new THREE.Mesh( new THREE.BoxGeometry(3,3,1), MAT.ORANGE ),
      };
      this.avatar.block.position.copy(VEC.centerPt);
      this.avatar.block.position.y = 3;
      this.object3d.add(this.avatar.block);
      this.children = [];
      this.children.forEach(c => this.object3d.add(c.object3d));
  }

  update(t_ms = 0) {
      this.children.forEach(c => c.update(t_ms));

      if ( this.isDirty() ) {
          if ( this.statusRed( this.model ) > 0) {
            this.avatar.block.material = mesh_of( { color:0xf46666 } );//red
          } else if ( this.statusYellow( this.model ) > 0) {
            this.avatar.block.material = mesh_of( { color:0xf49900 } );//yellow
          } else if ( this.statusGreen( this.model ) > 0){
            this.avatar.block.material= mesh_of( { color:0x008000 } );//green
          }
      }

        let p = (t_ms % TEMPO)/TEMPO;
        this.avatar.block.visible = !this.alarm(this.bindings) || (
          this.alarm(this.bindings) && this.strobe(p));
  }
}

class InvalidHeaderRequestViz extends ModelViz {
  constructor(args={}) {
      super(args);
      this.glyph = GEOM.headerRequestDot;
      this.glyphMaterial = MAT.AQUA;
      this.sparkPaths = [];
      this.blockPosition = args.blockPosition || v3(0, 3, 5);
      this.getHeaderRequest = args.getHeaderRequest || UTIL.returnZero;
      this.buildAvatar();
  }

  buildAvatar() {
      this.avatar = {
          glyphs: []
      };
      while(this.sparkPaths.length < 10) {
        this.sparkPaths.push([this.blockPosition, v3((-Math.random() + .5) * 5, (-Math.random() + .5) * 5, (-Math.random()) * 5 ).add(this.blockPosition)]);
    }
  }

  update(t_ms = 0) {
      this.children.forEach(c => c.update(t_ms));

      if(this.isDirty()) {
          UTIL.drainFill(this.avatar.glyphs, this.getHeaderRequest(this.model), UTIL.rmEl, () => {
              let el = new THREE.Mesh(this.glyph, this.glyphMaterial);
              this.object3d.add(el);
              return el;
            });
      }

      let t1 = TEMPO;
      let sparkPathIndex = 0;
      this.avatar.glyphs.forEach((el, i) => {
          let ti = ((t_ms + (i * t1 / this.avatar.glyphs.length / 2)) % t1) / t1;
          let pos = UTIL.getPathPos(ti, this.sparkPaths[++sparkPathIndex % this.avatar.glyphs.length]);
          if (pos) el.position.copy(pos);
      });
  }
} 

class HTTPCodesViz extends ModelViz {
  constructor(args={}) {
      super(args);
      this.glyph200 = GEOM.httpStatusblip;
      this.glyph300 = GEOM.httpStatusblip;
      this.glyph400 = GEOM.httpStatusblip;
      this.glyph500 = GEOM.httpStatusblip;
      this.glyphMaterial200 = MAT.ES_GREEN;
      this.glyphMaterial300 = MAT.YELLOW;
      this.glyphMaterial400 = MAT.ORANGE;
      this.glyphMaterial500 = MAT.RED;
      this.sparkPaths = [];
      this.blockPosition = args.blockPosition || v3(0, 3, 5);
      this.get200Rate = args.get200Rate || UTIL.returnZero;
      this.get300Rate = args.get300Rate || UTIL.returnZero;
      this.get400Rate = args.get400Rate || UTIL.returnZero;
      this.get500Rate = args.get500Rate || UTIL.returnZero;
      this.buildAvatar();
  }

  buildAvatar() {
      this.avatar = {
          glyphs200: [],
          glyphs300: [],
          glyphs400: [],
          glyphs500: []
      };
      while(this.sparkPaths.length < 40) {
        this.sparkPaths.push([this.blockPosition, v3((-Math.random() + .5) * 8, (-Math.random() + .5) *8, (-Math.random()) * 8 ).add(this.blockPosition)]);
    }
  }

  update(t_ms = 0) {
      this.children.forEach(c => c.update(t_ms));

      if(this.isDirty()) {
          UTIL.drainFill(this.avatar.glyphs200, this.get200Rate(this.model), UTIL.rmEl, () => {
              let el = new THREE.Mesh(this.glyph200, this.glyphMaterial200);
              this.object3d.add(el);
              return el;
          });
          UTIL.drainFill(this.avatar.glyphs300, this.get300Rate(this.model), UTIL.rmEl, () => {
              let el = new THREE.Mesh(this.glyph300, this.glyphMaterial300);
              this.object3d.add(el);
              return el;
          });
          UTIL.drainFill(this.avatar.glyphs400, this.get400Rate(this.model), UTIL.rmEl, () => {
              let el = new THREE.Mesh(this.glyph400, this.glyphMaterial400);
              this.object3d.add(el);
              return el;
          });
          UTIL.drainFill(this.avatar.glyphs500, this.get500Rate(this.model), UTIL.rmEl, () => {
              let el = new THREE.Mesh(this.glyph500, this.glyphMaterial500);
              this.object3d.add(el);
              return el;
          });
      }

      let t1 = TEMPO;
      let sparkPathIndex = 0;
      this.avatar.glyphs200.forEach((el, i) => {
          let ti = ((t_ms + (i * t1 / this.avatar.glyphs200.length / 2)) % t1) / t1;
          let pos = UTIL.getPathPos(ti, this.sparkPaths[++sparkPathIndex % this.sparkPaths.length]);
          if (pos) el.position.copy(pos);
      });
      this.avatar.glyphs300.forEach((el, i) => {
          let ti = ((t_ms + (i * t1 / this.avatar.glyphs300.length / 2)) % t1) / t1;
          let pos = UTIL.getPathPos(ti, this.sparkPaths[++sparkPathIndex % this.sparkPaths.length]);
          if (pos) el.position.copy(pos);
      });
      this.avatar.glyphs400.forEach((el, i) => {
          let ti = ((t_ms + (i * t1 / this.avatar.glyphs400.length / 2)) % t1) / t1;
          let pos = UTIL.getPathPos(ti, this.sparkPaths[++sparkPathIndex % this.sparkPaths.length]);
          if (pos) el.position.copy(pos);
      });
      this.avatar.glyphs500.forEach((el, i) => {
          let ti = ((t_ms + (i * t1 / this.avatar.glyphs500.length / 2)) % t1) / t1;
          let pos = UTIL.getPathPos(ti, this.sparkPaths[++sparkPathIndex % this.sparkPaths.length]);
          if (pos) el.position.copy(pos);
      });
  }
} 

