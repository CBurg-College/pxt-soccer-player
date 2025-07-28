/*
From here to the 'pxt-soccer-player' specific code,
the code below is a composition and refactoring of:
- the ElecFreaks 'pxt-nezha' library:
  https://github.com/elecfreaks/pxt-nezha/blob/master/main.ts
- the ElecFreaks 'pxt-PlanetX' library:
  https://github.com/elecfreaks/pxt-PlanetX/blob/master/basic.ts
  https://github.com/elecfreaks/pxt-PlanetX/blob/master/display.ts
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

namespace LedRing {

    export enum Rotation {
        //% block="clockwise"
        //% block.loc.nl="rechtsom"
        Clockwise,
        //% block="anti-clockwise"
        //% block.loc.nl="linksom"
        AClockwise
    }

    export enum Pace {
        //% block="slow"
        //% block.loc.nl="laag"
        Slow = 100,
        //% block="normal"
        //% block.loc.nl="gewoon"
        Normal = 50,
        //% block="fast"
        //% block.loc.nl="hoog"
        Fast = 25
    }

    //% shim=light::sendWS2812Buffer
    declare function displaySendBuffer(buf: Buffer, pin: DigitalPin): void;

    let _buffer = pins.createBuffer(24); // 8 pixels of 3 byte (rgb)
    let _pin : DigitalPin
    let _pace = Pace.Normal

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
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        setPixel(pixel, red, green, blue)
    }

    export function setRing(red: number, green: number, blue: number) {
        for (let i = 0; i < 8; ++i)
            setPixel(i, red, green, blue)
    }

    export function setRingRGB(rgb: number) {
        let red = (rgb >> 16) & 0xFF;
        let green = (rgb >> 8) & 0xFF;
        let blue = (rgb) & 0xFF;
        for (let i = 0; i < 8; ++i)
            setPixel(i, red, green, blue)
    }

    export function setClear(): void {
        _buffer.fill(0, 0, 24);
    }

    export function setPace(pace: Pace) {
        _pace = pace
    }

    export function getPace() : Pace {
        return _pace
    }

    export function rotate(rot: Rotation): void {
        if (rot == Rotation.Clockwise)
            _buffer.rotate(-3, 0, 24)
        else
            _buffer.rotate(3, 0, 24)
    }

    export function rainbow(rot: Rotation) {
        if (rot == Rotation.Clockwise) {
            setPixelRGB(0, rgb(Color.Red))
            setPixelRGB(1, rgb(Color.Orange))
            setPixelRGB(2, rgb(Color.Yellow))
            setPixelRGB(3, rgb(Color.Green))
            setPixelRGB(4, rgb(Color.Blue))
            setPixelRGB(5, rgb(Color.Indigo))
            setPixelRGB(6, rgb(Color.Violet))
            setPixelRGB(7, rgb(Color.Purple))
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
        basic.pause(_pace)
        for (let i = 0; i < 7; i++) {
            rotate(rot)
            showBuffer()
            basic.pause(_pace)
        }
    }

    export function snake(color: Color, dir: Rotation) {
        let col = rgb(color)
        let red = (col >> 16) & 0xFF;
        let green = (col >> 8) & 0xFF;
        let blue = (col) & 0xFF;
        setClear();
        showBuffer()
        for (let i = 7; i >= 0; i--) {
            if (dir == Rotation.Clockwise)
                setPixel(7 - i, red, green, blue)
            else
                setPixel(i, red, green, blue)
            showBuffer()
            basic.pause(_pace)
        }
        showBuffer()
        for (let i = 6; i >= 0; i--) {
            if (dir == Rotation.Clockwise)
                setPixel(7 - i, 0, 0, 0)
            else
                setPixel(i, 0, 0, 0)
            showBuffer()
            basic.pause(_pace)
        }
        if (dir == Rotation.Clockwise)
            setPixel(0, 0, 0, 0)
        else
            setPixel(7, 0, 0, 0)
        showBuffer()
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
    if (ColorSensor.read() == Color.Blue)
        PLAYER = Player.Blue
    showPlayerColor()
})

input.onButtonPressed(Button.B, function () {
    PLAYING = false
    Nezha.motorSpeed(Nezha.Motor.M2, 0)
    Nezha.motorSpeed(Nezha.Motor.M3, 0)
})

type eventHandler = () => void
let EventOutsideField: eventHandler
let EventGoalAsset: eventHandler
let EventGoalAgainst: eventHandler
let EventObstruction: eventHandler
let EventWinner: eventHandler
let EventLoser: eventHandler

setMatchHandling(() => {
/*
    commands are defined in pxt-soccer as:

    export enum COMMAND {
        Start,
        Stop,
        PointA, // Green
        PointB, // Blue
        DisallowA,
        DisallowB,
        WinnerA,
        WinnerB,
        DisqualA,
        DisqualB
    }
*/
    switch (MATCH) {
        case Match.Start:
            PLAYING = true
            break;
        case Match.PointA:
            if (PLAYER == Player.Green) {
                if (EventGoalAsset) EventGoalAsset()
                showPlayerColor()
            }
            else {
                if (EventGoalAgainst) EventGoalAgainst()
                showPlayerColor()
            }
            break;
        case Match.PointB:
            if (PLAYER == Player.Blue) {
                if (EventGoalAsset) EventGoalAsset()
                showPlayerColor()
            }
            else {
                if (EventGoalAgainst) EventGoalAgainst()
                showPlayerColor()
            }
            break;
        case Match.WinnerA:
        case Match.DisqualB:
            if (PLAYER == Player.Green) {
                if (EventWinner) EventWinner()
                showPlayerColor()
            }
            else {
                if (EventLoser) EventLoser()
                showPlayerColor()
            }
            break;
        case Match.WinnerB:
        case Match.DisqualA:
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
    PLAYING = (MATCH == Match.Start)
})

function display() {
    basic.showNumber(OBSTRUCTIONS)
    showPlayerColor()
}

displayAfterLogo(() => {
    display()
})

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
            if (ColorSensor.read() != Color.White)
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
    //% block="rotate at %pace pace"
    //% block.loc.nl="draai in %pace tempo"
    export function setPace(pace: LedRing.Pace) {
        LedRing.setPace(pace)
    }

    //% subcategory="Kleuren"
    //% color="#FFCC44"
    //% block="rotate a snake %rot with color %color"
    //% block.loc.nl="draai een slang %rot met kleur %color"
    //% color.defl=Color.White
    export function showSnake(rot: LedRing.Rotation, color: Color) {
        LedRing.snake(color, rot)
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
    //% color.defl=Color.White
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
    //% block="rotate a full circle %rot at %pace pace"
    //% block.loc.nl="draai een hele cirkel %rot in %pace tempo"
    //% pace.defl=Pace.Normal
    export function circle(rot: LedRing.Rotation, pace: LedRing.Pace) {
        LedRing.showBuffer()
        for (let i = 0; i <= 7; i++) {
            LedRing.rotate(rot)
            LedRing.showBuffer()
            basic.pause(pace)
        }
    }

    //% subcategory="Kleuren"
    //% group="Leds apart"
    //% color="#FFCC44"
    //% block="rotate one position %rot"
    //% block.loc.nl="draai één positie %rot"
    export function rotate(rot: LedRing.Rotation) {
        LedRing.rotate(rot)
        LedRing.showBuffer()
    }

    //% subcategory="Kleuren"
    //% group="Leds apart"
    //% color="#FFCC44"
    //% block="set led %num to color %color"
    //% block.loc.nl="stel led %num in op kleur %color"
    //% color.defl=Color.White
    //% num.min=1 num.max=8
    export function setLed(num: number, color: Color) {
        LedRing.setPixelRGB(num - 1, rgb(color))
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
