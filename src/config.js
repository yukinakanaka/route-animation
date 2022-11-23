const config = {
    accessToken: "xxx",
    record: true,
    data: {
        route: "./data/example/ontake-route.geojson",
        features: "./data/example/ontake-features.geojson",
    },
    videoSpeed: {
        zoomInSpeed: 1,
        rotateDurationSec: 20,
        finalViewDurationSec: 5,
    },
    zoomInView: {
        zoomLevel: 14,
        pitch: 50,
        bearing: -70,
    },
    rotation: {
        clockwize: false,
        rotateDegree: 30,
    },
    finalView: {
        pitch: 10,
        padding: 100,
    },
    style: {
        terrainExaggeration: 1.5,
        pinImage: "./img/pin.png",
        routeBackgroundColor: "orange",
        routeColor: "orange",
        featureTextSize: 10,
    },
    videoEncorder: {
        fps: 30,
        kbps: 64000,
        fileName: "route-animation.mp4",
    },
};
export { config };
