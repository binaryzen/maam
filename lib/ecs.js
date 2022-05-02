class ECSViz extends ModelViz {
  constructor(args={}) {
      super(args);
      // this.inPath = args.inPath || PATHS.inQ;
      // this.outPath = args.outPath || PATHS.outQ;
      this.buildAvatar();
  }

  buildAvatar() {
      this.object3d.add(this.hitbox);
      this.avatar = {
        // block: new THREE.Mesh( new THREE.BoxGeometry(3,3,3), MAT.ORANGE ),
      };
      // this.avatar.block.position.copy(VEC.centerPt);
      // this.avatar.block.position.y = 3;
      // this.object3d.add(this.avatar.block);
      this.children = [
        new ConduitViz({
          model: this.model,
          path: [v3(0,0,0), v3(0,0,2), v3(0,3,2), v3(0,3,6)],
          blipMaterial: MAT.GREEN,
          getRate: (m) => this.data(MET.ECS_RC)
        }),
        new ConduitViz({
          model: this.model,
          path: [v3(0,3,6), v3(0,3,10), v3(0,0,10), v3(0,0,12)],
          blipMaterial: MAT.GREEN,
          getRate: (m) => this.data(MET.ECS_RC)
        }), 
        new ECSInstanceViz({
          model: this.model,
          getCPU: (m) => this.data(MET.ECS_CPU_UTILIZATION),
        }),
        new ECSMemoryViz({
          model: this.model,
          getMemory: (m) => this.data(MET.ECS_MEMORY_UTILIZATION),
        }),
        // Task Manager
        new SwarmViz({
          model: this.model,
          bounds: new THREE.Sphere(v3(0, 5.5, 6), 1),
          getCount: (m) => this.data(MET.ECS_RTC),
          material: MAT.GOLD,
          glyph: new THREE.DodecahedronGeometry(0.2)
        })
      ];
      this.children.forEach(c => this.object3d.add(c.object3d));
  }

  update(t = 0) {
      this.children.forEach(c => c.update(t));
  }
}

class ECSInstanceViz extends ModelViz {
constructor(args = {}) {
  super(args);
  // data adapters
  this.getCPU = args.getCPU;
  console.log(this.getCPU(this.model));
  // skin
  this.topCap = args.topCap || args.cap || new THREE.BoxGeometry(3,3,3);
  this.bottomCap = args.bottomCap || args.cap || new THREE.BoxGeometry(3,3,3);
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
  this.avatar.cpuContainer.position.copy(VEC.centerPt);
  // Position cpuContainer
  this.avatar.cpuContainer.position.y = 3;
  let z = this.avatar.cpuContainer.position.z
  this.avatar.cpuContainer.position.z = z + 1.5;
  this.avatar.cpuLevel.position.copy(VEC.centerPt);
  this.avatar.cpuLevel.posi
  this.avatar.cpuContainer.position.y = 3;
  // Position cpuLevel
  let p = this.avatar.cpuLevel.position.z
  this.avatar.cpuLevel.position.z = p + 1.5;
  this.object3d.add(this.avatar.cpuContainer);
  this.object3d.add(this.avatar.cpuLevel);
  this.children.forEach((c) => {
    this.object3d.add(c.object3d);
  });
}

update(t_ms) {
  let A = this.avatar.cpuContainer;
  let B = this.avatar.cpuLevel;
  if (this.isDirty()) {

    //change cpu level in container
    let scaleY = this.getCPU(this.model)/100;

    //change color to red when utilization is high
    if (scaleY >= 90/100) {
      B.material = mesh_of({color:0xf46666});//red
      A.material = mesh_of({color:0x00f466, opacity: 0.125, transparent: true}); //changed opacity to show more of the red
    } else {
        B.material = mesh_of({color:0x00f466});//green
    }

    this.avatar.cpuLevel.scale.y = scaleY;
    let aSize = v3(0,0,0);
    let bSize = v3(0,0,0);

    A.geometry.computeBoundingBox();
    B.geometry.computeBoundingBox();
    A.geometry.boundingBox.getSize(aSize);
    B.geometry.boundingBox.getSize(bSize);

    let C = (aSize.y - (bSize.y * scaleY))/2;
    B.position.y = A.position.y - C;
  }
}
}
class ECSMemoryViz extends ModelViz {
constructor(args = {}) {
  super(args);
  // data adapters
  this.getMemory = args.getMemory;
  console.log(this.getMemory(this.model));
  // skin
  this.topCap = args.topCap || args.cap || new THREE.BoxGeometry(3,3,3);
  this.bottomCap = args.bottomCap || args.cap || new THREE.BoxGeometry(3,3,3);
  this.topCapMaterial = args.topCapMaterial || args.capMaterial || MAT.ECS_LIGHTBLUE;
  this.bottomCapMaterial = args.bottomCapMaterial || args.capMaterial || MAT.ECS_BLUE;
  // init
  this.buildAvatar();
}

buildAvatar() {
  // 3d layout
  this.avatar = {
    memoryContainer: new THREE.Mesh(this.topCap, this.topCapMaterial),
    memoryLevel: new THREE.Mesh(this.bottomCap, this.bottomCapMaterial),

    glyphs: []
  };
  this.avatar.memoryContainer.position.copy(VEC.centerPt);
  // Position memoryContainer
  this.avatar.memoryContainer.position.z = 4.5;
  this.avatar.memoryContainer.position.y = 3;
  this.avatar.memoryLevel.position.copy(VEC.centerPt);
  this.avatar.memoryLevel.posi
  // position memoryLevel
  this.avatar.memoryLevel.position.z = 4.5;
  this.avatar.memoryLevel.position.y = 3;
  this.object3d.add(this.avatar.memoryContainer);
  this.object3d.add(this.avatar.memoryLevel);
  this.children.forEach((c) => {
    this.object3d.add(c.object3d);
  });
}

update(t_ms) {
  let A = this.avatar.memoryContainer;
  let B = this.avatar.memoryLevel;
  if (this.isDirty()) {

    //change memory level in container
    let scaleY = this.getMemory(this.model)/100;

     //change color to red when utilization is high
    if (scaleY >= 90/100) {
      B.material = mesh_of({color:0xf46666});//red
      A.material = mesh_of({color:0x2986cc, opacity: 0.25, transparent: true}); //changed opacity to show more of the red
    } else {
        B.material = mesh_of({color:0x2986cc});//blue
    }

    this.avatar.memoryLevel.scale.y = scaleY;
    let aSize = v3(0,0,0);
    let bSize = v3(0,0,0);

    A.geometry.computeBoundingBox();
    B.geometry.computeBoundingBox();
    A.geometry.boundingBox.getSize(aSize);
    B.geometry.boundingBox.getSize(bSize);

    let C = (aSize.y - (bSize.y * scaleY))/2;
    B.position.y = A.position.y - C;
  }
}
}
