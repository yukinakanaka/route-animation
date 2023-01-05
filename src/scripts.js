import loadEncoder from "https://unpkg.com/mp4-h264@1.0.7/build/mp4-encoder.js";
import { simd } from "https://unpkg.com/wasm-feature-detect?module";
import { config } from "./config.js";
mapboxgl.accessToken = config.accessToken;

const routeLayer = {
    sourceId: "routeSourceId",
    layerId: "routeLayerId",
    backgroundLayerId: "routeBackgroundLayerId",
};
const pinLayer = {
    sourceId: "pinSourceId",
    layerId: "pinLayerId",
};
const featureLayer = {
    sourceId: "featureSourceId",
    layerId: "featureLayerId",
};
async function flyAndRotate({ map, routeGeojson }) {
    return new Promise(async (resolve) => {
        const path = turf.lineString(routeGeojson.features[0].geometry.coordinates);
        const pathDistance = turf.lineDistance(path);

        map.flyTo({
            zoom: config.zoomInView.zoomLevel,
            pitch: config.zoomInView.pitch,
            bearing: config.zoomInView.bearing,
            speed: config.videoSpeed.zoomInSpeed,
        });
        await map.once("idle");

        let start;
        async function frame(time) {
            if (!start) start = time;
            const animationPhase = (time - start) / (config.videoSpeed.rotateDurationSec * 1000);
            if (animationPhase > 1) {
                resolve();
                return;
            }

            // Get the new latitude and longitude by sampling along the path
            const alongPath = turf.along(path, pathDistance * animationPhase).geometry.coordinates;

            const pin = map.getSource(pinLayer.sourceId);
            await pin.setData({
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [alongPath[0], alongPath[1]],
                        },
                    },
                ],
            });

            // Reduce the visible length of the line by using a line-gradient to cutoff the line
            // animationPhase is a value between 0 and 1 that reprents the progress of the animation
            map.setPaintProperty(routeLayer.layerId, "line-gradient", [
                "step",
                ["line-progress"],
                config.style.routeColor,
                animationPhase,
                "rgba(0, 0, 0, 0)",
            ]);

            // Rotate the camera at a slightly lower speed to give some parallax effect in the background
            let rotation = 0;
            if (config.rotation.clockwize) {
                rotation = config.zoomInView.bearing + animationPhase * config.rotation.rotateDegree;
            } else {
                rotation = config.zoomInView.bearing - animationPhase * config.rotation.rotateDegree;
            }

            map.setBearing(rotation % 360);

            await window.requestAnimationFrame(frame);
        }

        await window.requestAnimationFrame(frame);
    });
}

const addRoute = (map, routeGeojson) => {
    map.addSource(routeLayer.sourceId, {
        type: "geojson",
        lineMetrics: true, // Line metrics is required to use the 'line-progress' property
        data: routeGeojson,
    });
    map.addLayer({
        type: "line",
        source: routeLayer.sourceId,
        id: routeLayer.backgroundLayerId,
        paint: {
            "line-color": "gray",
            "line-width": 2,
        },
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        minzoom: config.zoomInView.zoomLevel - 0.5,
    });
    map.addLayer({
        type: "line",
        source: routeLayer.sourceId,
        id: routeLayer.layerId,
        paint: {
            "line-color": "rgba(0,0,0,0)",
            "line-width": 5,
        },
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
    });
};

const addPin = (map, firstPosition) => {
    map.loadImage(config.style.pinImage, (error, image) => {
        if (error) throw error;
        map.addImage("point-img", image);
    });

    map.addSource(pinLayer.sourceId, {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [firstPosition[0], firstPosition[1]],
                    },
                },
            ],
        },
    });

    map.addLayer({
        id: pinLayer.layerId,
        type: "symbol",
        source: pinLayer.sourceId,
        visibility: "none",
        minzoom: config.zoomInView.zoomLevel - 0.5,
        layout: {
            "icon-image": "point-img",
            "icon-offset": [0, -160],
            "icon-size": 0.15,
            "text-allow-overlap": true,
            "icon-allow-overlap": true,
        },
    });
};

const add3D = (map) => {
    // Add some fog in the background
    if (config.style.fog) {
        map.setFog({
            range: [0, 2],
            color: "white",
            "horizon-blend": 0.2,
        });
    }

    // Add a sky layer over the horizon
    map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-color": "rgba(85, 151, 210, 0.5)",
        },
    });

    // Add terrain source, with slight exaggeration
    map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
    });
    map.setTerrain({
        source: "mapbox-dem",
        exaggeration: config.style.terrainExaggeration,
    });
};

const addFeatures = (map, featuresGeojson) => {
    map.addSource(featureLayer.sourceId, {
        type: "geojson",
        data: featuresGeojson,
    });

    map.addLayer({
        id: featureLayer.layerId,
        type: "symbol",
        source: featureLayer.sourceId,
        visibility: "none",
        minzoom: config.zoomInView.zoomLevel - 0.5,
        layout: {
            "icon-image": ["match", ["get", "type"], ["", "top"], "mountain", ["hut"], "ranger-station", "border-dot-13"],
            "icon-size": 1,
            "icon-allow-overlap": true,
            "text-allow-overlap": true,
            "text-font": ["DIN Pro Bold", "Arial Unicode MS Regular"],
            "text-anchor": "top",
            "text-size": config.style.featureTextSize,
            "text-field": ["get", "name"],
            "text-offset": [0, 0.5],
            "text-variable-anchor": config.style.textVariableAnchor,
        },
        paint: {
            "text-halo-color": "hsla(321, 0%, 13%, 0.8)",
            "text-halo-width": 1,
            "text-halo-blur": 1,
            "text-color": "hsl(0, 0%, 100%)",
        },
    });
};

const playAnimations = async (map, routeGeojson) => {
    return new Promise(async (resolve) => {
        await flyAndRotate({ map, routeGeojson });
        await map.fitBounds(turf.bbox(routeGeojson), {
            duration: config.videoSpeed.finalViewDurationSec * 1000,
            pitch: config.finalView.pitch,
            bearing: config.rotation.clockwize
                ? config.zoomInView.bearing + config.rotation.rotateDegree
                : config.zoomInView.bearing - config.rotation.rotateDegree,
            padding: config.finalView.padding,
        });
        await map.once("moveend");
        resolve();
    });
};

const initEncoder = async () => {
    const supportsSIMD = await simd();
    const Encoder = await loadEncoder({ simd: supportsSIMD });
    const gl = map.painter.context.gl;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const encoder = Encoder.create({
        width,
        height,
        fps: config.videoEncorder.fps,
        kbps: config.videoEncorder.kbps,
        rgbFlipY: true,
    });

    const ptr = encoder.getRGBPointer(); // keep a pointer to encoder WebAssembly heap memory
    let now = performance.now();
    function encodeFrame() {
        now += 1000 / 30;
        mapboxgl.setNow(now);

        const pixels = encoder.memory().subarray(ptr); // get a view into encoder memory
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels); // read pixels into encoder
        encoder.encodeRGBPointer(); // encode the frame
    }
    return [encoder, encodeFrame];
};

async function main() {
    // load data
    const routeGeojson = await fetch(config.data.route).then((d) => d.json());
    const featuresGeojson = await fetch(config.data.features).then((d) => d.json());

    // initialize map
    const map = await new mapboxgl.Map({
        container: "map",
        zoom: config.globalView.zoomLevel,
        center: turf.center(routeGeojson).geometry.coordinates,
        pitch: 0,
        bearing: 0,
        style: config.style.mapStyle,
        interactive: true,
        hash: false,
        fadeDuration: 0,
    });
    window.map = map;
    await map.once("load");

    // add Layers
    add3D(map);
    addRoute(map, routeGeojson);
    addFeatures(map, featuresGeojson);
    addPin(map, routeGeojson.features[0].geometry.coordinates[0]);

    if (config.record) {
        const [encoder, encodeFrame] = await initEncoder();

        mapboxgl.setNow();
        map.on("render", encodeFrame);

        await playAnimations(map, routeGeojson);

        map.off("render", encodeFrame);
        mapboxgl.restoreNow();

        // export video
        const mp4 = encoder.end();
        const anchor = document.createElement("a");
        anchor.href = URL.createObjectURL(new Blob([mp4], { type: "video/mp4" }));
        anchor.download = config.videoEncorder.fileName;
        anchor.click();
    } else {
        await playAnimations(map, routeGeojson);
    }
}

main();
