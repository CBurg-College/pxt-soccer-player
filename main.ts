/*
From here to the 'pxt-soccer-player' specific code,
the code below is a composition and refactoring of:
- the ElecFreaks 'pxt-nezha' library:
  https://github.com/elecfreaks/pxt-nezha/blob/master/main.ts
- the ElecFreaks 'pxt-PlanetX' library:
  https://github.com/elecfreaks/pxt-PlanetX/blob/master/basic.ts
  https://github.com/elecfreaks/pxt-PlanetX/blob/master/neopixel.ts
- the ElecFreaks 'pxt-PlanetX-AI' library:
  https://github.com/elecfreaks/pxt-PlanetX-AI/blob/master/main.ts
All under MIT-license.
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
General color module
Used by ColorSensor, LedRing and CameraAI
*/

// !!!    DO NOT CHANGE THE COLOR ORDER !!!    //
// !!! THEY ARE USED THIS WAY BY CAMERA-AI !!! //

enum Color {
    //% block="none"
    //% block.loc.nl="geen"
    None,
    //% block="green"
    //% block.loc.nl="groen"
    Green,
    //% block="blue"
    //% block.loc.nl="blauw"
    Blue,
    //% block="yellow"
    //% block.loc.nl="geel"
    Yellow,
    //% block="black"
    //% block.loc.nl="zwart"
    Black,
    //% block="red"
    //% block.loc.nl="rood"
    Red,
    //% block="white"
    //% block.loc.nl="wit"
    White,
    //% block="orange"
    //% block.loc.nl="oranje"
    Orange,
    //% block="cyan"
    //% block.loc.nl="cyaan"
    Cyan,
    //% block="magenta"
    //% block.loc.nl="magenta"
    Magenta,
    //% block="indigo"
    //% block.loc.nl="indigo"
    Indigo,
    //% block="violet"
    //% block.loc.nl="violet"
    Violet,
    //% block="purple"
    //% block.loc.nl="paars"
    Purple
}

function rgb(color: Color) : number{
    let val = 0
    switch (color) {
        case Color.Green: val = 0x00FF00; break;
        case Color.Blue: val = 0x0000FF; break;
        case Color.Yellow: val = 0xFFFF00; break;
        case Color.Black: val = 0x000000; break;
        case Color.Red: val = 0xFF0000; break;
        case Color.White: val = 0xFFFFFF; break;
        case Color.Orange: val = 0xFFA500; break;
        case Color.Cyan: val = 0x00FFFF; break;
        case Color.Magenta: val = 0xFF00FF; break;
        case Color.Indigo: val = 0x4b0082; break;
        case Color.Violet: val = 0x8a2be2; break;
        case Color.Purple: val = 0xFF00FF; break;
    }
    return val
}

function pack(red: number, green: number, blue: number): number {
    let rgb = ((red & 0xFF) << 16) | ((green & 0xFF) << 8) | (blue & 0xFF)
    return rgb;
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

function hsl2rgb(h: number, s: number, l: number): number {
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
    let r$: number;
    let g$: number;
    let b$: number;
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
    let rgb = ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)
    return rgb;
}

/*
PlanetX color sensor
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

namespace LedRing {

    export enum Rotation {
        //% block="clockwise"
        //% block.loc.nl="rechtsom"
        Clockwise,
        //% block="anti-clockwise"
        //% block.loc.nl="linksom"
        AClockwise
    }

    //% shim=light::sendWS2812Buffer
    declare function displaySendBuffer(buf: Buffer, pin: DigitalPin): void;

    let _buffer = pins.createBuffer(24); // 8 pixels of 3 byte (rgb)
    let _pin : DigitalPin

    export function init() {
        _pin = DigitalPin.P14;
        pins.digitalWritePin(_pin, 0);
    }

    export function showBuffer() {
        displaySendBuffer(_buffer, _pin);
    }

    export function setPixel(offset: number, red: number, green: number, blue: number): void {
        offset *= 3
        _buffer[offset + 0] = green;
        _buffer[offset + 1] = red;
        _buffer[offset + 2] = blue;
    }

    export function setPixelRGB(pixel: number, rgb: number): void {
        if (pixel < 0 || pixel >= 8)
            return;
        pixel *= 3;
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        setPixel(pixel, red, green, blue)
    }

    export function setRing(red: number, green: number, blue: number) {
        for (let i = 0; i < 8; ++i)
            setPixel(i * 3, red, green, blue)
    }

    export function setRingRGB(rgb: number) {
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        for (let i = 0; i < 8; ++i)
            setPixel(i * 3, red, green, blue)
    }

    export function setClear(): void {
        _buffer.fill(0, 0, 24);
    }

    export function rotate(rot: Rotation): void {
        if (rot == Rotation.Clockwise)
            _buffer.rotate(3, 0, 24)
        else
            _buffer.rotate(-3, 0, 24)
    }

    export function rainbow(rot: Rotation) {
        if (rot == Rotation.Clockwise) {
            setPixelRGB(0, rgb( Color.Red))
            setPixelRGB(1, rgb( Color.Orange))
            setPixelRGB(2, rgb( Color.Yellow))
            setPixelRGB(3, rgb( Color.Green))
            setPixelRGB(4, rgb( Color.Blue))
            setPixelRGB(5, rgb( Color.Indigo))
            setPixelRGB(6, rgb( Color.Violet))
            setPixelRGB(7, rgb( Color.Purple))
        }
        else {
            setPixelRGB(7, rgb(Color.Red))
            setPixelRGB(6, rgb(Color.Orange))
            setPixelRGB(5, rgb(Color.Yellow))
            setPixelRGB(4, rgb(Color.Green))
            setPixelRGB(3, rgb(Color.Blue))
            setPixelRGB(2, rgb(Color.Indigo))
            setPixelRGB(1, rgb(Color.Violet))
            setPixelRGB(0, rgb(Color.Purple))
        }
        showBuffer()
        for (let i = 0; i < 7; i++) {
            rotate(rot)
            showBuffer()
            basic.pause(100)
        }
    }

    export function fading(rgb: number, rot: Rotation) {
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        let r, g, b: number
        for (let i = 7; i >= 1; i--) {
            r = red / (i * 8)
            g = green / (i * 8)
            b = blue / (i * 8)
            if (rot == Rotation.Clockwise)
                setPixel(7 - i, r, g, b)
            else
                setPixel(i, r, g, b)
        }
        showBuffer()
        for (let i = 0; i < 7; i++) {
            rotate(rot)
            showBuffer()
            basic.pause(100)
        }
    }

    export function snake(rgb: number, dir: Rotation) {
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        setClear();
        showBuffer()
        for (let i = 7; i >= 0; i--) {
            if (dir == Rotation.Clockwise)
                setPixel(7 - i, red, green, blue)
            else
                setPixel(i, red, green, blue)
            showBuffer()
            basic.pause(50)
        }
        showBuffer()
        for (let i = 7; i >= 0; i--) {
            if (dir == Rotation.Clockwise)
                setPixel(7 - i, 0, 0, 0)
            else
                setPixel(i, 0, 0, 0)
            showBuffer()
            basic.pause(50)
        }
    }
}

/*
PlanetX AI-Camera
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

    export function recognize(item: Recognize): void {
        ITEM = item
        let buff = pins.i2cReadBuffer(CameraAddr, 9)
        buff[0] = 0x20
        buff[1] = item
        pins.i2cWriteBuffer(CameraAddr, buff)
    }

    export function fetchCamera(): void {
        DataBuffer = pins.i2cReadBuffer(CameraAddr, 9)
        basic.pause(30)
    }

    export function itemCount(): number {
        if (DataBuffer[0] != ITEM)
            return 0
        return DataBuffer[7]
    }

    export function itemPosX(): number {
        return DataBuffer[2]
    }

    export function itemPosY(): number {
        return DataBuffer[3]
    }

    export function itemSize(): number {
        return DataBuffer[4]
    }

    export function itemColor(): number {
        return DataBuffer[1]
    }

    export function itemIsColor(col: Color): boolean {
        return (DataBuffer[1] == col)
    }

    export function itemID(): number {
        return DataBuffer[8]
    }

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
LedRing.init()

enum Player {
    //% block="green"
    //% block.loc.nl="groen"
    Green,
    //% block="blue"
    //% block.loc.nl="rood"
    Blue
}

let PLAYER = Player.Green
let PLAYING = false
let HEADING = input.compassHeading()
let OBSTRUCTIONS = 0

function showPlayerColor() {
    if (PLAYER == Player.Green)
        LedRing.setRingRGB(rgb(Color.Green))
    else
        LedRing.setRingRGB(rgb(Color.Blue))
}

input.onButtonPressed(Button.A, function () {
    PLAYER = Player.Green
    if (ColorSensor.readColor() == Color.Blue)
        PLAYER = Player.Blue
    showPlayerColor()
})

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
                showPlayerColor()
            }
            else {
                if (EventGoalAgainst) EventGoalAgainst()
                showPlayerColor()
            }
            break;
        case CSoccer.COMMAND.GoalBlue:
            if (PLAYER == Player.Blue) {
                if (EventGoalAsset) EventGoalAsset()
                showPlayerColor()
            }
            else {
                if (EventGoalAgainst) EventGoalAgainst()
                showPlayerColor()
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
                showPlayerColor()
            }
            else {
                if (EventLoser) EventLoser()
                showPlayerColor()
            }
            break;
        case CSoccer.COMMAND.WinnerBlue:
        case CSoccer.COMMAND.DisqualGreen:
            if (PLAYER == Player.Blue) {
                if (EventWinner) EventWinner()
                showPlayerColor()
            }
            else {
                if (EventLoser) EventLoser()
                showPlayerColor()
            }
            break;
    }
    PLAYING = (cmd == CSoccer.COMMAND.Start)
}

function display() {
    basic.showNumber(OBSTRUCTIONS)
    showPlayerColor()
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

    basic.forever(function () {
        if (PLAYING) {
            if (ColorSensor.readColor() != Color.White)
                if (EventOutsideField) EventOutsideField()
        }
    })

    //% block="motor %motor runs in inverted direction"
    //% block.loc.nl="motor %motor draait in omgekeerde richting"
    export function invertMotor(motor: Nezha.Motor) {
        INVERT[motor] = true
    }

    //% block="game started"
    //% block.loc.nl="spel is gestart"
    export function isPlaying() {
        return PLAYING
    }

    //% subcategory="Bal-controle"
    //% block="shoot the ball"
    //% block.loc.nl="schiet de bal"
    export function shoot() {
        if (PLAYING) {
            Nezha.servoAngle(Nezha.Servo.S1, 65)
        }
    }

    //% subcategory="Bal-controle"
    //% block="take the ball in possession"
    //% block.loc.nl="neem balbezit"
    export function possessBall() {
        if (PLAYING) {
            Nezha.servoAngle(Nezha.Servo.S1, 120)
        }
    }

    //% subcategory="Bewegen"
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

    //% subcategory="Bewegen"
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
            } while (CameraAI.itemIsColor(Color.Blue))
            go(0, 0)
        }
    }

    //% subcategory="Bewegen"
    //% block="turn to the start direction"
    //% block.loc.nl="draai in de startrichting"
    export function turnToOpponent() {
        if (PLAYING) {
            go(15, -15)
            while (!isHeading()) { basic.pause(1) }
            go(0, 0)
        }
    }

    //% subcategory="Bewegen"
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

    //% subcategory="Bewegen"
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

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="rotate a snake %rot with color %color"
    //% block.loc.nl="draai een slang %rot met kleur %color"
    export function showSnake(rot: LedRing.Rotation, color: Color) {
        LedRing.snake(color, rot)
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="rotate fading color %color %rot"
    //% block.loc.nl="draai afnemende kleur %color %rot"
    export function showFading(color: Color, rot: LedRing.Rotation) {
        LedRing.fading(color, rot)
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="rotate rainbow %rot"
    //% block.loc.nl="draai de regenboog %rot"
    export function showRainbow(rot: LedRing.Rotation) {
        LedRing.rainbow(rot)
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="show color %color"
    //% block.loc.nl="toon de kleur %color"
    export function showColor(color: Color) {
        LedRing.setRingRGB(rgb(color))
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="show player color"
    //% block.loc.nl="toon de spelerkleur"
    export function playerColor() {
        showPlayerColor()
    }

    //% subcategory="Kleuren"
    //% group="Leds apart"
    //% color="#FFCC44"
    //% block="turn all leds off"
    //% block.loc.nl="schakel alle leds uit"
    export function turnLedsOff() {
        LedRing.setClear()
    }

    //% subcategory="Kleuren"
    //% group="Leds apart"
    //% color="#FFCC44"
    //% block="turn selected leds on"
    //% block.loc.nl="schakel de ingestelde leds aan"
    export function turnLedsOn() {
        LedRing.showBuffer()
    }

    //% subcategory="Kleuren"
    //% group="Leds apart"
    //% color="#FFCC44"
    //% block="rotate one position"
    //% block.loc.nl="draai één positie"
    export function rotate(rot: LedRing.Rotation) {
        LedRing.rotate(rot)
    }

    //% subcategory="Kleuren"
    //% group="Leds apart"
    //% color="#FFCC44"
    //% block="set led %num to color %color"
    //% block.loc.nl="stel led %num in op kleur %color"
    export function setLed(num: number, color: Color) {
        LedRing.setPixelRGB(num, rgb(color))
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="after an obstruction"
    //% block.loc.nl="na een obstructie"
    export function onEventObstruction(programmableCode: () => void): void {
        EventObstruction = programmableCode;
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="when the loser"
    //% block.loc.nl="als er verloren is"
    export function onEventLoser(programmableCode: () => void): void {
        EventLoser = programmableCode;
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="when the winner"
    //% block.loc.nl="als er gewonnen is"
    export function onEventWinner(programmableCode: () => void): void {
        EventWinner = programmableCode;
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="when a goal against"
    //% block.loc.nl="bij een doelpunt tegen"
    export function onEventGoalAgainst(programmableCode: () => void): void {
        EventGoalAgainst = programmableCode;
    }

    //% subcategory="Show"
    //% color="#FFCC00"
    //% block="when an asset goal"
    //% block.loc.nl="bij een doelpunt voor"
    export function onEventGoalAsset(programmableCode: () => void): void {
        EventGoalAsset = programmableCode;
    }
}
