/* created by @sanyabeast 8/20/2021 15:04:45
 *
 *
 */

class ImageData {
    inited = false;
    width = 0;
    height = 0;
    constructor(url) {
        this.url = url;
        this.canvas = document.createElement("canvas");
        this.context2d = this.canvas.getContext("2d");
    }

    init(url) {
        return new Promise((resolve) => {
            if (!this.inited) {
                this.inited = true;
                let img = new Image(); // Создаёт новое изображение
                img.addEventListener(
                    "load",
                    () => {
                        this.canvas.width = this.width = img.width;
                        this.canvas.height = this.height = img.height;
                        this.context2d.drawImage(img, 0, 0);
                        resolve();
                    },
                    false
                );

                this.url = url ?? this.url;
                img.src = this.url;
            } else {
                resolve();
            }
        });
    }

    get_value(
        x = 0,
        y = 0,
        scale = 1,
        size = 10,
        offset_x = 0,
        offset_y = 0,
        power = 1
    ) {
        let cx = Math.floor(
            ((x < 0 ? this.width - Math.abs(x) : x) * scale) % this.width
        );
        let cy = Math.floor(
            ((y < 0 ? this.height - Math.abs(y) : y) * scale) % this.height
        );
        let image_data = this.context2d.getImageData(
            (cx + offset_x) % this.width,
            (cy + offset_y) % this.height,
            1,
            1
        );
        let data =
            (image_data.data[0] / 256 +
                image_data.data[1] / 256 +
                image_data.data[2] / 256) /
            3;
        data = Math.pow(data, power)
        let value = Math.floor(data * size);
        return value;
    }
}

export default ImageData;
