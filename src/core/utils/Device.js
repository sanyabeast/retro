import DeviceDetector from "device-detector-js";

const deviceDetector = new DeviceDetector();
const device = deviceDetector.parse(navigator.userAgent);
export default {
    os_name: device.os.name,
    os_version: device.os.version,
    os_platform: device.os.platform,
    device_brand: device.device.brand,
    device_model: device.device.model,
    device_type: device.device.type,
    client_engine: device.client.engine,
    client_name: device.client.name,
    client_type: device.client.type,
    client_version: device.client.version,
    client_engineVersion: device.client.engineVersion,
}