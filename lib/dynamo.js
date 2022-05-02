class DynamoViz extends ModelViz {
    constructor(args={}) {
        super(args);
        this.inPath = args.inPath || PATHS.inQ;
        this.outPath = args.outPath || PATHS.outQ;
        this.buildAvatar();
    }

    buildAvatar() {
        this.object3d.add(this.hitbox);
        this.avatar = {
            dbTower: new THREE.Mesh( new THREE.CylinderGeometry(2, 2, 4, 32), MAT.GREY ),
            poppers:[
                new THREE.Mesh( new THREE.BoxGeometry(0.5, 0.5, 0.5), MAT.GREY ),
                new THREE.Mesh( new THREE.BoxGeometry(0.5, 0.5, 0.5), MAT.GREY ),
                new THREE.Mesh( new THREE.BoxGeometry(0.5, 0.5, 0.5), MAT.GREY )
            ]
        };
        this.avatar.dbTower.position.copy(VEC.centerPt);
        this.avatar.dbTower.position.y = 2;
        this.avatar.poppers.forEach((popper, i) => {
            popper.position.copy(VEC.centerPt);
            popper.position.y = 3.5 - i * 1.5;
            popper.position.z = 5;
            this.object3d.add(popper);
        });
        this.object3d.add(this.avatar.dbTower);
        this.children = [
          new ConduitViz({
            bindings: this.bindings,
            path: [VEC.inputPt, v3(0,2,0), v3(0,2,0.5)],
            blipMaterial: MAT.GREEN,
            getRate: (m) => this.data(MET.DYN_CRCU) + this.data(MET.DYN_CWCU)
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [v3(0,2.6,4), v3(0,2.6,0.5), v3(0,2,0.5)],
            blipMaterial: MAT.AQUA,
            getRate: (m) => this.data(MET.DYN_CRCU)
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [v3(0,2,0.5), v3(0,1.3,0.5), v3(0,1.3,4)],
            blipMaterial: MAT.ORANGE,
            getRate: (m) => this.data(MET.DYN_CWCU)
          }),
          new HTTPViz({
            bindings: this.bindings,
            get400Rate: (m) => UTIL.logRate(this.data(MET.DYN_USER_ERRS), 10),
            get500Rate: (m) => UTIL.logRate(this.data(MET.DYN_SYS_ERRS), 10),
            blockPosition: v3(0,2,0.5)
          })
        ];
        this.children.forEach(c => this.object3d.add(c.object3d));
    }

    update(t = 0) {
        this.children.forEach(c => c.update(t));
        let latency = this.data(MET.DYN_LATENCY);
        let p = latency == 0 ? 0 : (T % latency)/latency;

        this.avatar.poppers.forEach((popper, i) => {
            popper.position.z = 4.1 + Math.sin(p * Math.PI * 2) * ( ( i % 2 == 0 ) ? -1 : 1 ) * 0.2;
        });
    }
}