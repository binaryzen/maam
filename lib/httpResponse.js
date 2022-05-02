class HTTPViz extends ModelViz {
    constructor(args={}) {
        super(args);
        // this.inPath = args.inPath || [ VEC.inputPt, v3(0, 0, 3)];
        this.glyph400 = GEOM.httpStatusblip;
        this.glyph500 =  GEOM.httpStatusblip;
        this.glyphMaterial400 = MAT.YELLOW;
        this.glyphMaterial500 = MAT.RED;
        this.sparkPaths = [];
        this.blockPosition = args.blockPosition || v3(0, 0, 3);
        this.get500Rate = args.get500Rate || 4;
        this.get400Rate = args.get400Rate || 4;

        this.buildAvatar();
    }

    buildAvatar() {
        this.avatar = {
            // block: new THREE.Mesh( new THREE.BoxGeometry(3, 3, 1), MAT.BLUE ),
            glyphs400: [],
            glyphs500: []
        };
        while(this.sparkPaths.length < 30) {
            this.sparkPaths.push([this.blockPosition, v3((-Math.random() + .5) * 5, (-Math.random() + .5) * 5, (-Math.random()) * 5 ).add(this.blockPosition)]);
        }
    }

    update(t_ms = 0) {
        this.children.forEach(c => c.update(t_ms));

        if(this.isDirty()) {
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
