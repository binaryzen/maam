class EC2Viz extends ModelViz {
  constructor(args = {}) {
    // always calls super
    super(args);
    this.rcGlyph = args.rcGlyph || new THREE.BoxGeometry(4, 2, 2.5);
    this.rcMaterial = args.rcMaterial || MAT.GREEN;
    //
    // process args (visual parameters, data handler functions)
    //
    this.outPath = args.outPath || PATHS.outEC2;
    // alarm strobe function
    this.strobe = args.strobe || UTIL.lubdub;//strobe4;
    // alarm hot function
    this.alarm = args.alarm || ((m) => this.data(MET.EC2_ALARM) > 0);
    // call view setup
    this.buildAvatar();
  }

  buildAvatar() {
    this.object3d.add(this.hitbox);
    //
    // create constituents in avatar object, add to 3d container
    //
    this.avatar = {
      status:new THREE.Mesh(GEOM.cubelet, MAT.RED),
      // glyph: new THREE.Mesh(this.rcGlyph, this.rcMaterial)
    };

    this.avatar.status.position.copy(v3(0, 0, 2));
    // this.object3d.add( this.avatar.glyph );
    this.object3d.add(this.avatar.status);
    //
    // build child components and add to 3D container
    //
    this.children = [
      new EC2InstanceViz({
        bindings: this.bindings,
        getCPU: (m) => this.data(MET.EC2_CPU)/100,
        getHealth: (m) => this.data(MET.EC2_STATUS_HEALTH_CHECK)
      }),
      new HTTPViz({
        bindings: this.bindings,
        blockPosition: v3(0,0,-1),
        get500Rate: (m) => this.data(MET.EC2_500_RATE),
        get400Rate: (m) => this.data(MET.EC2_400_RATE)
      }),
      new SwarmViz({
        bindings: this.bindings,
        bounds: new THREE.Sphere( v3(0,3,3), 2 ),
        material: MAT.WHITE,
        glyph: new THREE.DodecahedronGeometry(0.25),
        getCount: (m) => this.data(MET.EC2_NUM_HOSTS)
      })
    ];
    this.children.forEach((c) => {
      this.object3d.add(c.object3d);
    });
  }

  update(t_ms=0) {
    if (this.isDirty()) {
      this.children.forEach((c) => {
        c.model = this.model;
      });
    }
    //
    // animation code
    //
    let p = (t_ms % TEMPO)/TEMPO;
    this.avatar.status.visible = this.alarm(this.model) && this.strobe(p);

    this.children.forEach((c) => {
      c.update(t_ms);
    });
  }
}

class EC2InstanceViz extends ModelViz {
  constructor(args = {}) {
    super(args);
    // data adapters
    this.getCPU = args.getCPU;
    this.getHealth = args.getHealth;
    // skin
    this.topCap = args.topCap || args.cap || new THREE.BoxGeometry(4, 3, 2.5);
    this.bottomCap = args.bottomCap || args.cap || new THREE.BoxGeometry(4, 3, 2.5);
    this.topCapMaterial = args.topCapMaterial || args.capMaterial || MAT.EC2_LIGHTGREEN;
    this.bottomCapMaterial = args.bottomCapMaterial || args.capMaterial || MAT.EC2_GREEN;
    // init
    this.buildAvatar();
  }

  buildAvatar() {
    // 3d layout
    this.avatar = {
      cpuContainer: new THREE.Mesh(this.topCap, this.topCapMaterial),
      cpuLevel: new THREE.Mesh(this.bottomCap, this.bottomCapMaterial),
      glyphs: []
    };
    this.children = [

    ];
    this.object3d.add(this.avatar.cpuContainer);
    this.object3d.add(this.avatar.cpuLevel);
    this.children.forEach((c) => {
      this.object3d.add(c.object3d);
    });
  }

  update(t_ms) {
    if (this.isDirty()) {
      let A = this.avatar.cpuContainer;
      let B = this.avatar.cpuLevel;
      //change cpu level in container
      let scaleY = this.getCPU(this.model);
      this.avatar.cpuLevel.scale.y = scaleY;
      let aSize = v3(0,0,0);
      let bSize = v3(0,0,0);

      A.geometry.computeBoundingBox();
      B.geometry.computeBoundingBox();
      A.geometry.boundingBox.getSize(aSize);
      B.geometry.boundingBox.getSize(bSize);

      let C = (aSize.y - (bSize.y * scaleY))/2;
      B.position.y = A.position.y - C;

      if(this.getHealth(this.model) > 0) {
        B.material = mesh_of({color:0xf46666});//red
        A.material = mesh_of({color:0xf46666, opacity: 0.5, transparent: true});
      } else {
        B.material = mesh_of({color:0x00f466});//green
        A.material = mesh_of({color:0x00f466, opacity: 0.5, transparent: true});
      }//Todo fix
    }
  }
}
