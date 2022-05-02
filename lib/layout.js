var layouts = [
    {
        name:"SQS1",
        component:new SQSViz(),
        position:v3(-15,0,3),
        rotation:v3(0,Math.PI/4,0)
    },
    {
        name:"SQS2",
        component:new SQSViz(),
        position:v3(0,0,0),
        rotation:v3(0,0,0)
    },
    {
        name:"SQS3",
        component:new SQSViz(),
        position:v3(15,0,3),
        rotation:v3(0,-Math.PI/4,0)
    },
    {
        name:"SQS11",
        component:new SQSViz(),
        position:v3(-15,12,3),
        rotation:v3(0,Math.PI/4,0)
    },
    {
        name:"SQS12",
        component:new SQSViz(),
        position:v3(0,12,0),
        rotation:v3(0,0,0)
    },
    {
        name:"SQS13",
        component:new SQSViz(),
        position:v3(15,12,3),
        rotation:v3(0,-Math.PI/4,0)
    },
    {
        name:"EC2",
        component:new EC2Viz(),
        position:v3(0,0,24),
        rotation:v3(0,0,0)
    },
    {
        name:"SNS1",
        component:new SNSViz(),
        position:v3(-6,0,30),
        rotation:v3(0,-Math.PI/2,0)
    },
    {
        name:"SQS4",
        component:new SQSViz(),
        position:v3(-18,0,30),
        rotation:v3(0,Math.PI,0)
    },
    {
        name:"SNS2",
        component:new SNSViz(),
        position:v3(0,0,30),
        rotation:v3(0,0,0)
    },
    {
        name:"SQS5",
        component:new SQSViz(),
        position:v3(0,0,42),
        rotation:v3(0,0,0)
    },
    {
        name:"ECS",
        component:new ECSViz(),
        position:v3(0,0,54),
        rotation:v3(0,-Math.PI/2,0)
    },
    {
        name:"ES",
        component:new ESViz(),
        position:v3(-12,0,54),
        rotation:v3(0,-Math.PI/2,0)
    },
    {
        name:"Dynamo",
        component:new DynamoViz(),
        position:v3(8,0,21),
        rotation:v3(0,Math.PI/2,0)
    },
    {
        name:"Dynamo2",
        component:new DynamoViz(),
        position:v3(8,0,27),
        rotation:v3(0,Math.PI/2,0)
    }
];

var cxnNdx = 0;
function connect(c1, p1, c2, p2, args) {
    c1.object3d.updateWorldMatrix();
    c2.object3d.updateWorldMatrix();
    let path = args.path || [c1.object3d.localToWorld(UTIL.vCopy(p1)), c2.object3d.localToWorld(UTIL.vCopy(p2))];
    console.log(path);
    let cxn = new ConduitViz({
        model: args.model || { from:c1, to:c2 },
        path: path,
        blipMaterial: args.blipMaterial || MAT.GREEN,
        getRate: args.getRate || UTIL.returnZero
    });
    scene.add(cxn.object3d);
    COMPONENTS["__cxn" + cxnNdx++] = cxn;
    return cxn;
}

function bindSQS(component, group) {
    component.bind(group);
    component.bind(MET.SQS_ANMVDLQ, group + "-DLQ:" + MET.SQS_ANMV);
    component.bind(MET.SQS_ANMVDLQ_LAST, group + "-DLQ:" + MET.SQS_ANMV + "_last");
}

function layout() {
    let oneLayout = (l) => {
        COMPONENTS[l.name] = l.component;
        l.component.setPosition(l.position);
        l.component.setRotation(l.rotation);
        scene.add(l.component.object3d);
    };
    layouts.forEach(l => {
        oneLayout(l);
    });

    bindSQS(COMPONENTS.SQS1, "ShipmentStatusEvents");
    bindSQS(COMPONENTS.SQS2, "ZAP-AuthEvents");
    bindSQS(COMPONENTS.SQS3, "OWEN-OrderItemQuantityChanged");
    bindSQS(COMPONENTS.SQS11, "OWEN-OrderConfirmation");
    bindSQS(COMPONENTS.SQS12, "OWEN-OrderCancelled");
    bindSQS(COMPONENTS.SQS13, "OWEN-OrderClosed");
    bindSQS(COMPONENTS.SQS4, "orderIndexRequest");
    bindSQS(COMPONENTS.SQS5, "orderIndexRequest-NewOrders");

    COMPONENTS.SNS1.bind("orderIndexRequest");
    COMPONENTS.SNS2.bind("orderIndexRequest-NewOrders");

    COMPONENTS.Dynamo.bind("customer_reviews");
    COMPONENTS.Dynamo2.bind("owenOrderConfirmationEventProcessed");
    COMPONENTS.ECS.bind("SearchDocumentIndexer");
    COMPONENTS.ES.bind("orderindex");
    COMPONENTS.EC2.bind("ZapposListAPI-AutoScalingGroup1-1NTNV0AV7D5YY_ELB");
    COMPONENTS.EC2.bind("ZapposListAPI-AutoScalingGroup1-1NTNV0AV7D5YY");

    setTimeout(function() {
        let c1 = connect(COMPONENTS.SQS1, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS1.bindings,
            getRate:(COMPONENTS.SQS1.children[1].getRate) });
        let c2 = connect(COMPONENTS.SQS2, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS2.bindings,
            getRate:(COMPONENTS.SQS2.children[1].getRate) });
        let c3 = connect(COMPONENTS.SQS3, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS3.bindings,
            getRate:(COMPONENTS.SQS3.children[1].getRate) });
        let c4 = connect(COMPONENTS.SQS11, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS11.bindings,
            getRate:(COMPONENTS.SQS11.children[1].getRate) });
        let c5 = connect(COMPONENTS.SQS12, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS12.bindings,
            getRate:(COMPONENTS.SQS12.children[1].getRate) });
        let c6 = connect(COMPONENTS.SQS13, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS13.bindings,
            getRate:(COMPONENTS.SQS13.children[1].getRate) });
        let c7 = connect(COMPONENTS.SQS4, VEC.outputPt, COMPONENTS.EC2, v3(0,0,-6), {
            bindings:COMPONENTS.SQS4.bindings,
            getRate:(COMPONENTS.SQS4.children[1].getRate) });
        connect(COMPONENTS.EC2, v3(0,0,-6), COMPONENTS.EC2, VEC.inputPt, {
            getRate:(m) => c1.getRate(m) + c2.getRate(m) + c3.getRate(m) + c4.getRate(m) + c5.getRate(m) + c6.getRate(m) + c7.getRate(m) });
        connect(COMPONENTS.EC2, VEC.inputPt, COMPONENTS.SNS1, VEC.inputPt, { getRate:(m) => COMPONENTS.SQS4.data(MET.SQS_NMS) });
        connect(COMPONENTS.EC2, VEC.inputPt, COMPONENTS.Dynamo, VEC.inputPt, { getRate:(m) => COMPONENTS.Dynamo.data(MET.DYN_CRCU) + COMPONENTS.Dynamo.data(MET.DYN_CWCU) });
        connect(COMPONENTS.EC2, VEC.inputPt, COMPONENTS.Dynamo2, VEC.inputPt, { getRate:(m) => COMPONENTS.Dynamo2.data(MET.DYN_CRCU) + COMPONENTS.Dynamo2.data(MET.DYN_CWCU) });
        connect(COMPONENTS.EC2, VEC.inputPt, COMPONENTS.SNS2, VEC.inputPt, { getRate:(m) => COMPONENTS.SQS5.data(MET.SQS_NMS) });
    }, 1);
}
