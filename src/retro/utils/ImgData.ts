/* created by @sanyabeast 8/20/2021 15:04:45
 *
 *
 */

export default class ImgData {
    inited: boolean = false;
    width: number = 0;
    height: number = 0;
    canvas: HTMLCanvasElement
    url: string
    context2d: CanvasRenderingContext2D

    constructor(url: string) {
        this.url = url;
        this.canvas = document.createElement("canvas");
        this.context2d = this.canvas.getContext("2d");
    }

    init(url: string): Promise<void> {
        return new Promise((resolve: () => void) => {
            if (!this.inited) {
                this.inited = true;
                let img: HTMLImageElement = new Image(); // Создаёт новое изображение
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
        x: number = 0,
        y: number = 0,
        scale: number = 1,
        size: number = 10,
        offset_x: number = 0,
        offset_y: number = 0,
        power: number = 1
    ) {
        let cx: number = Math.floor(
            ((x < 0 ? this.width - Math.abs(x) : x) * scale) % this.width
        );
        let cy: number = Math.floor(
            ((y < 0 ? this.height - Math.abs(y) : y) * scale) % this.height
        );
        let image_data: ImageData = this.context2d.getImageData(
            (cx + offset_x) % this.width,
            (cy + offset_y) % this.height,
            1,
            1
        );
        let data: number =
            (image_data.data[0] / 256 +
                image_data.data[1] / 256 +
                image_data.data[2] / 256) /
            3;
        data = Math.pow(data, power)
        let value: number = Math.floor(data * size);
        return value;
    }
}