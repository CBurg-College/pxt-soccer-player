/*
The Nezha namespace is a revision of the ElecFreaks 'pxt-nezha' library:
https://github.com/elecfreaks/pxt-nezha/blob/master/main.ts
(MIT-license)
*/

namespace Nezha {

    export enum Connector {
        //% block="J1" 
        J1 = DigitalPin.P8,
        //% block="J2"
        J2 = DigitalPin.P12,
        //% block="J3"
        J3 = DigitalPin.P14,
        //% block="J4"
        J4 = DigitalPin.P16
    }

    export enum Motor {
        //% block="M1"
        M1,
        //% block="M2"
        M2,
        //% block="M3"
        M3,
        //% block="M4"
        M4
    }

    export function motorSpeed(motor: Motor, speed: number): void {

        let iic_buffer = pins.createBuffer(4);

        if (speed > 100) speed = 100
        else
            if (speed < -100) speed = -100

        iic_buffer[0] = motor + 1
        if (speed >= 0) {
            iic_buffer[1] = 0x01; // forward
            iic_buffer[2] = speed;
        }
        else {
            iic_buffer[1] = 0x02; // reverse
            iic_buffer[2] = -speed;
        }
        iic_buffer[3] = 0;

        pins.i2cWriteBuffer(0x10, iic_buffer);
    }

    export enum Servo {
        //% block="S1" 
        S1,
        //% block="S2"
        S2,
        //% block="S3" 
        S3,
        //% block="S4"
        S4
    }

    export function servoAngle(servo: Servo, angle: number): void {
        let iic_buffer = pins.createBuffer(4);
        iic_buffer[0] = 0x10 + servo
        iic_buffer[1] = angle;
        iic_buffer[2] = 0;
        iic_buffer[3] = 0;
        pins.i2cWriteBuffer(0x10, iic_buffer);
    }

}

/*
The ColorSensor namespace is a revision of the ElecFreaks 'pxt-PlanetX' library:
https://github.com/elecfreaks/pxt-PlanetX/blob/master/basic.ts
(MIT-license)
*/

namespace ColorSensor {

    const APDS9960_ADDR = 0x39
    const APDS9960_ENABLE = 0x80
    const APDS9960_ATIME = 0x81
    const APDS9960_CONTROL = 0x8F
    const APDS9960_STATUS = 0x93
    const APDS9960_CDATAL = 0x94
    const APDS9960_CDATAH = 0x95
    const APDS9960_RDATAL = 0x96
    const APDS9960_RDATAH = 0x97
    const APDS9960_GDATAL = 0x98
    const APDS9960_GDATAH = 0x99
    const APDS9960_BDATAL = 0x9A
    const APDS9960_BDATAH = 0x9B
    const APDS9960_GCONF4 = 0xAB
    const APDS9960_AICLEAR = 0xE7

    export enum Color {
        //% block="black"
        Black,
        //% block="red"
        Red,
        //% block="green"
        Green,
        //% block="blue"
        Blue,
        //% block="cyan"
        Cyan,
        //% block="magenta"
        Magenta,
        //% block="yellow"
        Yellow,
        //% block="white"
        White
    }

    let color_first_init = false
    let color_new_init = false

    function i2cwrite_color(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread_color(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    export function init() {

        // init module
        i2cwrite_color(APDS9960_ADDR, APDS9960_ATIME, 252)
        i2cwrite_color(APDS9960_ADDR, APDS9960_CONTROL, 0x03)
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_GCONF4, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_AICLEAR, 0x00)
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, 0x01)
        color_first_init = true

        // set to color mode
        let tmp = i2cread_color(APDS9960_ADDR, APDS9960_ENABLE) | 0x2;
        i2cwrite_color(APDS9960_ADDR, APDS9960_ENABLE, tmp);
    }

    function rgb2hsl(color_r: number, color_g: number, color_b: number): number {
        let Hue = 0
        let R = color_r * 100 / 255;
        let G = color_g * 100 / 255;
        let B = color_b * 100 / 255;
        let maxVal = Math.max(R, Math.max(G, B))
        let minVal = Math.min(R, Math.min(G, B))
        let Delta = maxVal - minVal;

        if (Delta < 0) {
            Hue = 0;
        }
        else if (maxVal == R && G >= B) {
            Hue = (60 * ((G - B) * 100 / Delta)) / 100;
        }
        else if (maxVal == R && G < B) {
            Hue = (60 * ((G - B) * 100 / Delta) + 360 * 100) / 100;
        }
        else if (maxVal == G) {
            Hue = (60 * ((B - R) * 100 / Delta) + 120 * 100) / 100;
        }
        else if (maxVal == B) {
            Hue = (60 * ((R - G) * 100 / Delta) + 240 * 100) / 100;
        }
        return Hue
    }

    export function readColor(): Color {
        let buf = pins.createBuffer(2)
        let c = 0
        let r = 0
        let g = 0
        let b = 0
        let temp_c = 0
        let temp_r = 0
        let temp_g = 0
        let temp_b = 0
        let temp = 0

        if (color_new_init == false && color_first_init == false) {
            let i = 0;
            while (i++ < 20) {
                buf[0] = 0x81
                buf[1] = 0xCA
                pins.i2cWriteBuffer(0x43, buf)
                buf[0] = 0x80
                buf[1] = 0x17
                pins.i2cWriteBuffer(0x43, buf)
                basic.pause(50);

                if ((i2cread_color(0x43, 0xA4) + i2cread_color(0x43, 0xA5) * 256) != 0) {
                    color_new_init = true
                    break;
                }
            }
        }
        if (color_new_init == true) {
            basic.pause(100);
            c = i2cread_color(0x43, 0xA6) + i2cread_color(0x43, 0xA7) * 256;
            r = i2cread_color(0x43, 0xA0) + i2cread_color(0x43, 0xA1) * 256;
            g = i2cread_color(0x43, 0xA2) + i2cread_color(0x43, 0xA3) * 256;
            b = i2cread_color(0x43, 0xA4) + i2cread_color(0x43, 0xA5) * 256;

            r *= 1.3 * 0.47 * 0.83
            g *= 0.69 * 0.56 * 0.83
            b *= 0.80 * 0.415 * 0.83
            c *= 0.3

            if (r > b && r > g) {
                b *= 1.18;
                g *= 0.95
            }

            temp_c = c
            temp_r = r
            temp_g = g
            temp_b = b

            r = Math.min(r, 4095.9356)
            g = Math.min(g, 4095.9356)
            b = Math.min(b, 4095.9356)
            c = Math.min(c, 4095.9356)

            if (temp_b < temp_g) {
                temp = temp_b
                temp_b = temp_g
                temp_g = temp
            }
        }
        else {
            if (color_first_init == false)
                init()
            let tmp = i2cread_color(APDS9960_ADDR, APDS9960_STATUS) & 0x1;
            while (!tmp) {
                basic.pause(5);
                tmp = i2cread_color(APDS9960_ADDR, APDS9960_STATUS) & 0x1;
            }
            c = i2cread_color(APDS9960_ADDR, APDS9960_CDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_CDATAH) * 256;
            r = i2cread_color(APDS9960_ADDR, APDS9960_RDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_RDATAH) * 256;
            g = i2cread_color(APDS9960_ADDR, APDS9960_GDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_GDATAH) * 256;
            b = i2cread_color(APDS9960_ADDR, APDS9960_BDATAL) + i2cread_color(APDS9960_ADDR, APDS9960_BDATAH) * 256;
        }

        // map to rgb based on clear channel
        let avg = c / 3;
        r = r * 255 / avg;
        g = g * 255 / avg;
        b = b * 255 / avg;

        // translate rgb to hue
        let hue = rgb2hsl(r, g, b)
        if (color_new_init == true && hue >= 180 && hue <= 201 && temp_c >= 6000 && (temp_b - temp_g) < 1000 || (temp_r > 4096 && temp_g > 4096 && temp_b > 4096)) {
            temp_c = Math.map(temp_c, 0, 15000, 0, 13000);
            hue = 180 + (13000 - temp_c) / 1000.0;
        }

        // translate hue to color
        if (hue > 330 || hue < 20)
            return Color.Red
        if (hue > 120 && 180 > hue)
            return Color.Green
        if (hue > 210 && 270 > hue)
            return Color.Blue
        if (hue > 190 && 210 > hue)
            return Color.Cyan
        if (hue > 260 && 330 > hue)
            return Color.Magenta
        if (hue > 30 && 120 > hue)
            return Color.Yellow
        if (hue >= 180 && 190 > hue)
            return Color.White
        return Color.Black
    }

}

//% color="#00CC00" icon="\uf1f9"
//% block="LedRing"
//% block.loc.nl="LedRing"
namespace LedRing {

    export enum Color {
        //% block="red"
        //% block.loc.nl="rood"
        Red = 0xFF0000,
        //% block="orange"
        //% block.loc.nl="oranje"
        Orange = 0xFFA500,
        //% block="yellow"
        //% block.loc.nl="geel"
        Yellow = 0xFFFF00,
        //% block="green"
        //% block.loc.nl="groen"
        Green = 0x00FF00,
        //% block="blue"
        //% block.loc.nl="blauw"
        Blue = 0x0000FF,
        //% block="indigo"
        //% block.loc.nl="indigo"
        Indigo = 0x4b0082,
        //% block="violet"
        //% block.loc.nl="violet"
        Violet = 0x8a2be2,
        //% block="purple"
        //% block.loc.nl="paars"
        Purple = 0xFF00FF,
        //% block="white"
        //% block.loc.nl="wit"
        White = 0xFFFFFF,
        //% block="black"
        //% block.loc.nl="zwart"
        Black = 0x000000
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }

    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }

    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }

    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    //% block="hue %h|saturation %s|luminosity %l"
    //% subcategory=Neopixel
    //% color=#EA5532
    export function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$:
            number;
        let g$:
            number;
        let b$:
            number;
        if (h1 == 0) {
            r$ = c;
            g$ = x;
            b$ = 0;
        }
        else if (h1 == 1) {
            r$ = x;
            g$ = c;
            b$ = 0;
        }
        else if (h1 == 2) {
            r$ = 0;
            g$ = c;
            b$ = x;
        }
        else if (h1 == 3) {
            r$ = 0;
            g$ = x;
            b$ = c;
        }
        else if (h1 == 4) {
            r$ = x;
            g$ = 0;
            b$ = c;
        }
        else if (h1 == 5) {
            r$ = c;
            g$ = 0;
            b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

    //% shim=light::sendWS2812Buffer
    declare function displaySendBuffer(buf: Buffer, pin: DigitalPin): void;

    let _buffer: Buffer;
    let _pin: DigitalPin;
    let _brightness: number;
    let _start: number; // start offset in LED strip
    let _length: number; // number of LEDs
    let _mode: number;
    let _matrixWidth: number; // number of leds in a matrix - if any

    //% block="%strip|show color %rgb=neopixel_colors"
    //% color=#EA5532
    //% subcategory=Neopixel
    export function showColor(rgb: number) {
        rgb = rgb >> 0;
        setAllRGB(rgb);
        show();
    }

    //% block="%strip|led color at %pixeloffset as %rgb=neopixel_colors"
    //% block.loc.nl="%strip|kleur de led op %pixeloffset met %rgb=neopixel_colors"
    //% color=#EA5532
    //% parts="neopixel"
    //% subcategory=Neopixel
    export function setPixelColor(pixeloffset: number, rgb: number): void {
        setPixelRGB(pixeloffset >> 0, rgb >> 0);
        // call show when all pixels have been set
    }

    //% block="%strip|Do now"
    //% block.loc.nl="%strip|Nu doen"
    //% block.loc.nl="%strip|"
    //% subcategory=Neopixel
    export function show() {
        // call when all pixel have been set by setPixelColor
        displaySendBuffer(_buffer, _pin);
    }

    //% block="%strip|all leds off"
    //% block="%strip|alle leds uit"
    //% color=#EA5532
    //% subcategory=Neopixel
    export function clear(): void {
        const stride = 3; // rgb mode
        _buffer.fill(0, _start * stride, _length * stride);
        // call show when all pixels have been set
    }

    //% block="%strip|rotate by %offset positions" 
    //% block.loc.nl="%strip|draai met %offset plaatsen"
    //% color=#EA5532
    //% subcategory=Neopixel
    export function rotate(offset: number = 1): void {
        offset = offset >> 0;
        const stride = 3; // rgb mode
        _buffer.rotate(-offset * stride, _start * stride, _length * stride)
        // call show when all pixels have been set
    }

    //% block="%strip|show a rainbow" 
    //% block.loc.nl="%strip|toon een regenboog"
    //% color=#EA5532
    //% subcategory=Neopixel
    export function rainbow() {
        setPixelColor(0, Color.Red)
        setPixelColor(1, Color.Orange)
        setPixelColor(2, Color.Yellow)
        setPixelColor(3, Color.Green)
        setPixelColor(4, Color.Blue)
        setPixelColor(5, Color.Indigo)
        setPixelColor(6, Color.Violet)
        setPixelColor(7, Color.Purple)
        show()
    }

    function setPin(pin: DigitalPin): void {
        _pin = pin;
        pins.digitalWritePin(_pin, 0);
        // don't yield to avoid races on initialization
    }

    function setBufferRGB(offset: number, red: number, green: number, blue: number): void {
        // rgb mode:
        _buffer[offset + 0] = green;
        _buffer[offset + 1] = red;
        _buffer[offset + 2] = blue;
    }

    function setAllRGB(rgb: number) {
        let red = unpackR(rgb);
        let green = unpackG(rgb);
        let blue = unpackB(rgb);

        const br = _brightness;
        if (br < 255) {
            red = (red * br) >> 8;
            green = (green * br) >> 8;
            blue = (blue * br) >> 8;
        }
        const end = _start + _length;
        const stride = 3; // rgb mode
        for (let i = _start; i < end; ++i) {
            setBufferRGB(i * stride, red, green, blue)
        }
    }

    function setPixelRGB(pixeloffset: number, rgb: number): void {
        if (pixeloffset < 0
            || pixeloffset >= _length)
            return;

        let stride = 3; // rgb mode
        pixeloffset = (pixeloffset + _start) * stride;

        let red = unpackR(rgb);
        let green = unpackG(rgb);
        let blue = unpackB(rgb);

        let br = _brightness;
        if (br < 255) {
            red = (red * br) >> 8;
            green = (green * br) >> 8;
            blue = (blue * br) >> 8;
        }
        setBufferRGB(pixeloffset, red, green, blue)
    }

    export function create(rjpin: Nezha.Connector, numleds: number) {
        let pin = DigitalPin.P1
        switch (rjpin) {
            case Nezha.Connector.J1:
                pin = DigitalPin.P8
                break;
            case Nezha.Connector.J2:
                pin = DigitalPin.P12
                break;
            case Nezha.Connector.J3:
                pin = DigitalPin.P14
                break;
            case Nezha.Connector.J4:
                pin = DigitalPin.P16
                break;
        }
        let stride = 3; // rgb mode
        _buffer = pins.createBuffer(numleds * stride);
        _start = 0;
        _length = numleds;
        _mode = 0; // rgb mode
        _matrixWidth = 0;
        setPin(pin)
    }

    //% color=#EA5532
    //% subcategory=Neopixel
    //% block="make color with: red %red, green %green and blue %blue"
    //% block.loc.nl="maak kleur met: rood %red, groen %green en blauw %blue "
    function rgbColor(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }
}


/*
The CameraAI namespace is a revision of the ElecFreaks 'pxt-PlanetX-AI' library:
https://github.com/elecfreaks/pxt-PlanetX-AI/blob/master/main.ts
(MIT-license)
*/

namespace CameraAI {

    const CameraAddr = 0X14;
    let DataBuffer = pins.createBuffer(9);
    let ITEM = 0

    export enum Recognize {
        //% block="balls"
        //% block.loc.nl="ballen"
        Ball = 7,
        //% block="colors"
        //% block.loc.nl="kleuren"
        Color = 9
    }

    export enum Colors {
        //% block="green"
        //% block.loc.nl = "groen"
        Green = 1,
        //% block="blue"
        //% block.loc.nl="blauw"
        Blue = 2,
        //% block="yellow"
        //% block.loc.nl = "geel"
        Yellow = 3,
        //% block="black"
        //% block.loc.nl="zwart"
        Black = 4,
        //% block="red"
        //% block.loc.nl = "rood"
        Red = 5,
        //% block="white"
        //% block.loc.nl = "wit"
        White = 6
    }

    /**
     * initialize the AI camera module
     */
    export function init(): void {
        let timeout = input.runningTime()
        while (!(pins.i2cReadNumber(CameraAddr, NumberFormat.Int8LE))) {
            if (input.runningTime() - timeout > 30000) {
                while (true) {
                    basic.showString("Init of AI-Lens failed")
                }
            }
        }
    }

    /**
     * set to the type of recognition
     * rec: Recognize.Ball or RecognizeColor
     */
    export function recognize(item: Recognize): void {
        ITEM = item
        let buff = pins.i2cReadBuffer(CameraAddr, 9)
        buff[0] = 0x20
        buff[1] = item
        pins.i2cWriteBuffer(CameraAddr, buff)
    }

    /**
     * fetch one image from the AI-Lens
     */
    export function fetchCamera(): void {
        DataBuffer = pins.i2cReadBuffer(CameraAddr, 9)
        basic.pause(30)
    }

    /**
     * report the number of recognized items in the image
     */
    export function itemCount(): number {
        if (DataBuffer[0] != ITEM)
            return 0
        return DataBuffer[7]
    }

    /**
     * report the x-position of an item
     */
    export function itemPosX(): number {
        return DataBuffer[2]
    }

    /**
     * report the y-position of an item
     */
    export function itemPosY(): number {
        return DataBuffer[3]
    }

    /**
     * report the size of an item
     */
    export function itemSize(): number {
        return DataBuffer[4]
    }

    /**
     * report the color of an item
     */
    export function itemColor(): number {
        return DataBuffer[1]
    }

    /**
     * report if an item has a sudden color
     */
    export function itemIsColor(col: Colors): boolean {
        return (DataBuffer[1] == col)
    }

    /**
     * report the id of an item
     */
    export function itemID(): number {
        return DataBuffer[8]
    }

    /**
     * report the confidence of an item
     */
    export function itemConfidence(): number {
        return 100 - DataBuffer[6]
    }
}

/*
Next code is original to the current 'pxt-soccer-player' library.
(MIT-license)
*/

CameraAI.init()
ColorSensor.init()

enum Player {
    //% block="green"
    //% block.loc.nl="groen"
    Green,
    //% block="blue"
    //% block.loc.nl="rood"
    Blue
}

function isPlayer() : Player {
    let player = Player.Green
    if (ColorSensor.readColor() == ColorSensor.Color.Blue)
        player = Player.Blue
    return player
}

let PLAYER = isPlayer()
let PLAYING = false
let HEADING = input.compassHeading()
let OBSTRUCTIONS = 0

type eventHandler = () => void
let EventOutsideField: eventHandler
let EventGoalAsset: eventHandler
let EventGoalAgainst: eventHandler
let EventObstruction: eventHandler
let EventWinner: eventHandler
let EventLoser: eventHandler

function handle(cmd:number) {

/*
    commands are defined in pxt-soccer as:

    export enum COMMAND {
        Start,
        Stop,
        GoalGreen,
        GoalBlue,
        ObstructGreen,
        ObstructBlue,
        WinnerGreen,
        WinnerBlue,
        DisqualGreen,
        DisqualBlue,
        Reset
    }
*/
    switch (cmd) {
        case CSoccer.COMMAND.Start:
            PLAYING = true
            break;
        case CSoccer.COMMAND.GoalGreen:
            if (PLAYER == Player.Green) {
                if (EventGoalAsset) EventGoalAsset()
            }
            else {
                if (EventGoalAgainst) EventGoalAgainst()
            }
            break;
        case CSoccer.COMMAND.GoalBlue:
            if (PLAYER == Player.Blue) {
                if (EventGoalAsset) EventGoalAsset()
            }
            else {
                if (EventGoalAgainst) EventGoalAgainst()
            }
            break;
        case CSoccer.COMMAND.ObstructGreen:
            if (PLAYER == Player.Green) {
                OBSTRUCTIONS++
                display()
                if (OBSTRUCTIONS > 2)
                    radio.sendNumber(CSoccer.COMMAND.WinnerBlue)
            }
            break;
        case CSoccer.COMMAND.ObstructBlue:
            if (PLAYER == Player.Blue) {
                OBSTRUCTIONS++
                display()
                if (OBSTRUCTIONS > 2)
                    radio.sendNumber(CSoccer.COMMAND.WinnerGreen)
            }
            break;
        case CSoccer.COMMAND.WinnerGreen:
        case CSoccer.COMMAND.DisqualBlue:
            if (PLAYER == Player.Green) {
                if (EventWinner) EventWinner()
            }
            else {
                if (EventLoser) EventLoser()
            }
            break;
        case CSoccer.COMMAND.WinnerBlue:
        case CSoccer.COMMAND.DisqualGreen:
            if (PLAYER == Player.Blue) {
                if (EventWinner) EventWinner()
            }
            else {
                if (EventLoser) EventLoser()
            }
            break;
    }
    PLAYING = (cmd == CSoccer.COMMAND.Start)
}

function display() {
    basic.showNumber(OBSTRUCTIONS)
}

//% color="#00CC00" icon="\uf1f9"
//% block="Soccer"
//% block.loc.nl="Voetbal"
namespace CSoccerPlayer
{
    function isHeading() : boolean {
        let heading = input.compassHeading()
        if ((HEADING >= 354 || HEADING <= 5) && (heading >= 355 || heading <= 5))
            return true
        if ((heading >= HEADING - 5) && (heading <= HEADING + 5))
            return true
        return false
    }

    export enum Direction {
        //% block="forward"
        //% block.loc.nl="vooruit"
        Forward,
        //% block="reverse"
        //% block.loc.nl="achteruit"
        Reverse
    }

    //             M1    M2    M3    M4
    let INVERT = [false,false,false,false]

    //% block="motor %motor runs in inverted direction"
    //% block.loc.nl="motor %motor draait in omgekeerde richting"
    export function invertMotor( motor: Nezha.Motor) {
        INVERT[motor] = true
    }

    function go(speedM2: number, speedM3: number) {
        if (INVERT[Nezha.Motor.M2])
            Nezha.motorSpeed(Nezha.Motor.M2, -speedM2)
        else
            Nezha.motorSpeed(Nezha.Motor.M2, speedM2)
        if (INVERT[Nezha.Motor.M3])
            Nezha.motorSpeed(Nezha.Motor.M3, -speedM3)
        else
            Nezha.motorSpeed(Nezha.Motor.M3, speedM3)
    }

    //% color="#FFCC00"
    //% block="when outside the field"
    //% block.loc.nl="wanneer buiten het speelveld"
    export function onEventOutsideField(programmableCode: () => void): void {
        EventOutsideField = programmableCode;
    }

    //% block="shoot the ball"
    //% block.loc.nl="schiet de bal"
    export function shoot() {
        if (PLAYING) {
            Nezha.servoAngle(Nezha.Servo.S1, 65)
        }
    }

    //% block="run %cm cm %dir"
    //% block.loc.nl="rijd %cm cm %dir"
    //% cm.max=20 cm.min=0
    export function run(cm: number, dir: Direction) {
        if (PLAYING) {
            let speed = (dir ? -15 : 15)
            go(speed, speed)
            basic.pause(cm * 1500)
            go(0, 0)
        }
    }

    //% block="turn to the goal"
    //% block.loc.nl="draai richting het doel"
    export function findGoal() {
        if (PLAYING) {
            CameraAI.recognize(CameraAI.Recognize.Color)
            go(15, -15)
            do {
                CameraAI.fetchCamera()
                if (!CameraAI.itemCount())
                    continue
                basic.pause(1)
            } while (CameraAI.itemIsColor(CameraAI.Colors.Blue))
            go(0, 0)
        }
    }

    //% block="turn to the start direction"
    //% block.loc.nl="draai in de startrichting"
    export function turnToOpponent() {
        if (PLAYING) {
            go(15, -15)
            while (!isHeading()) { basic.pause(1) }
            go(0, 0)
        }
    }

    //% block="take the ball in possession"
    //% block.loc.nl="neem balbezit"
    export function possessBall() {
        if (PLAYING) {
            Nezha.servoAngle(Nezha.Servo.S1, 120)
        }
    }

    //% block="run to the ball"
    //% block.loc.nl="rijd naar de bal"
    export function approachBall() {
        if (PLAYING) {
            CameraAI.recognize(CameraAI.Recognize.Ball)
            go(15, 15)
            do {
                CameraAI.fetchCamera()
            } while (CameraAI.itemPosY() > 200)
            go(0, 0)
        }
    }

    //% block="turn to the ball"
    //% block.loc.nl="draai richting de bal"
    export function findBall() {
        if (PLAYING) {
            CameraAI.recognize(CameraAI.Recognize.Ball)
            go(15, -15)
            do {
                CameraAI.fetchCamera()
            } while (!CameraAI.itemCount())
            go(0 , 0)
        }
    }

    //% block="the start signal was given"
    //% block.loc.nl="het startsignaal werd gegeven"
    export function waitForStart() : boolean {
        return PLAYING
    }

    basic.forever(function () {
        if (PLAYING) {
            if (ColorSensor.readColor() != ColorSensor.Color.White)
                if (EventOutsideField) EventOutsideField()
        }
    })

    //% group="Extra"
    //% color="#FFCC00"
    //% block="after an obstruction"
    //% block.loc.nl="na een obstructie"
    export function onEventObstruction(programmableCode: () => void): void {
        EventObstruction = programmableCode;
    }

    //% group="Extra"
    //% color="#FFCC00"
    //% block="when the loser"
    //% block.loc.nl="wanneer verloren"
    export function onEventLoser(programmableCode: () => void): void {
        EventLoser = programmableCode;
    }

    //% group="Extra"
    //% color="#FFCC00"
    //% block="when the winner"
    //% block.loc.nl="wanneer gewonnen"
    export function onEventWinner(programmableCode: () => void): void {
        EventWinner = programmableCode;
    }

    //% group="Extra"
    //% color="#FFCC00"
    //% block="when a goal against"
    //% block.loc.nl="bij een doelpunt tegen"
    export function onEventGoalAgainst(programmableCode: () => void): void {
        EventGoalAgainst = programmableCode;
    }

    //% group="Extra"
    //% color="#FFCC00"
    //% block="when an asset goal"
    //% block.loc.nl="bij een doelpunt voor"
    export function onEventGoalAsset(programmableCode: () => void): void {
        EventGoalAsset = programmableCode;
    }
}
