class SNSViz extends ModelViz {
    constructor(args={}) {
        super(args);
        this.inPath = args.inPath || PATHS.inQ;
        this.outPath = args.outPath || PATHS.outQ;
        this.buildAvatar();
    }

    buildAvatar() {
        this.object3d.add(this.hitbox);
        this.avatar = {
            inGlyph: new THREE.Mesh( GEOM.funnel, MAT.WHITE ),
            outGlyph: new THREE.Mesh( GEOM.funnel, MAT.WHITE ),
            ctrGlyph: new THREE.Mesh( GEOM.bigBlip, MAT.AQUA )
        };
        this.avatar.ctrGlyph.position.copy(VEC.centerPt);
        this.avatar.inGlyph.position.z = 3;
        this.avatar.outGlyph.position.z = 9;
        this.avatar.outGlyph.rotateX(-Math.PI/2);
        this.avatar.inGlyph.rotateX(Math.PI/2);
        this.object3d.add(this.avatar.inGlyph);
        this.object3d.add(this.avatar.outGlyph);
        this.object3d.add(this.avatar.ctrGlyph);
        this.children = [
          new ConduitViz({
            bindings: this.bindings,
            path: [VEC.inputPt, v3(0,-1,0), v3(0,-1,1), v3(0,1,1), v3(0,1,2), v3(0,0,2), v3(0,0,3)],
            blipMaterial: MAT.GREEN,
            getRate: (m) => this.data(MET.SQS_NMS)
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [v3(0,0,3), v3(0,0,4), v3(1,0,4), v3(1,0,7), v3(0,0,7), VEC.centerPt],
            blipMaterial: MAT.AQUA,
            getRate: (m) => this.data(MET.SQS_NMS)
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [VEC.centerPt, v3(0,0,5), v3(-1,0,5), v3(-1,0,8), v3(0,0,8), v3(0,0,9), v3(0,0,9)],
            blipMaterial: MAT.AQUA,
            blipGlyph: GEOM.bigBlip,
            getRate: (m) => this.data(MET.SQS_NMS)
          }),
          new ConduitViz({
            bindings: this.bindings,
            path: [v3(0,0,9), v3(0,0,9), v3(0,0,9), v3(0,0,9), v3(0,0,9), v3(0,0,9), VEC.outputPt],
            blipMaterial: MAT.GREEN,
            getRate: (m) => this.data(MET.SQS_NMS)
          })
        ];
        this.children.forEach(c => this.object3d.add(c.object3d));
    }

    update(t = 0) {
        this.children.forEach(c => c.update(t));
    }
}