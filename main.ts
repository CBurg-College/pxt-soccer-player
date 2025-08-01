CameraAI.init()
ColorSensor.init()
LedRing.init()
Nezha.setLeftMotor(Motor.M2, false)
Nezha.setRightMotor(Motor.M3, true)

enum Player {
    //% block="green"
    //% block.loc.nl="groen"
    Green,
    //% block="blue"
    //% block.loc.nl="rood"
    Blue
}

let PLAYER = Player.Green
let HEADING = input.compassHeading()
let OBSTRUCTIONS = 0

function showPlayerColor() {
    if (PLAYER == Player.Green)
        LedRing.setRingRGB(rgb(Color.Green))
    else
        LedRing.setRingRGB(rgb(Color.Blue))
}

input.onButtonPressed(Button.A, function () {
    Nezha.setTwoWheelSpeed(0,0)
    clearPause()
})

input.onButtonPressed(Button.B, function () {
    PLAYER = Player.Green
    if (ColorSensor.read() == Color.Blue)
        PLAYER = Player.Blue
    showPlayerColor()
})

let EventOutsideField: handler
let EventGoalAsset: handler
let EventGoalAgainst: handler
let EventObstruction: handler
let EventWinner: handler
let EventLoser: handler

setMatchHandling(() => {
    switch (MATCH) {
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
    let TMPOSSESS = 0

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

    //% color="#FFCC00"
    //% block="when playing"
    //% block.loc.nl="wanneer in het spel"
    export function onPlaying(programmableCode: () => void): void {
        playerHandler = programmableCode;
    }

    //% color="#FFCC00"
    //% block="when outside the field"
    //% block.loc.nl="wanneer buiten het speelveld"
    export function onEventOutsideField(programmableCode: () => void): void {
        EventOutsideField = programmableCode;
    }

    basic.forever(function () {
        if (TMPOSSESS != 0 && control.millis() > TMPOSSESS)
            shoot()
        if (PLAYING) {
            let color = ColorSensor.read()
            if (color == Color.Black) {
                if (TMPOSSESS) {
                    shoot()
                    TMPOSSESS = 0
                }
                if (EventOutsideField) EventOutsideField()
            }
            if (color == Color.Yellow) {
                setPause()
                Nezha.setTwoWheelSpeed(0, 0)
            }
        }
    })

    //% block="game started"
    //% block.loc.nl="spel is gestart"
    export function isPlaying() {
        return PLAYING
    }

    //% subcategory="Bal-controle"
    //% block="shoot the ball"
    //% block.loc.nl="schiet de bal"
    export function shoot() {
        if (PLAYING && !PAUSE) {
            Nezha.servoAngle(Servo.S1, 65)
            TMPOSSESS = 0
        }
    }

    //% subcategory="Bal-controle"
    //% block="take the ball in possession"
    //% block.loc.nl="neem balbezit"
    export function possessBall() {
        if (PLAYING && !PAUSE) {
            Nezha.servoAngle(Servo.S1, 120)
            TMPOSSESS = control.millis() + 5000
        }
    }

    //% subcategory="Bewegen"
    //% block="attack"
    //% block.loc.nl="val aan"
    export function attack() {
        TMPOSSESS = control.millis() + 1000
        if (PLAYING && !PAUSE) {
            Nezha.setTwoWheelSpeed(16, 16)
            while (TMPOSSESS) { basic.pause(1) }
            Nezha.setTwoWheelSpeed(0, 0)
        }
    }

    //% subcategory="Bewegen"
    //% block="turn to the goal"
    //% block.loc.nl="draai richting het doel"
    export function findGoal() {
        if (PLAYING && !PAUSE) {
            CameraAI.recognize(CameraAI.Recognize.Color)
            Nezha.setTwoWheelSpeed(8,-8)
            do {
                CameraAI.fetchCamera()
                basic.pause(1)
            } while (!CameraAI.itemIsColor(Color.Green))
            Nezha.setTwoWheelSpeed(0, 0)
        }
    }

    //% subcategory="Bewegen"
    //% block="turn to the start direction"
    //% block.loc.nl="draai in de startrichting"
    export function turnToOpponent() {
        if (PLAYING && !PAUSE) {
            Nezha.setTwoWheelSpeed(15, -15)
            while (!isHeading()) { basic.pause(1) }
            Nezha.setTwoWheelSpeed(0, 0)
        }
    }

    //% subcategory="Bewegen"
    //% block="run to the ball"
    //% block.loc.nl="rijd naar de bal"
    export function approachBall() {
        if (PLAYING && !PAUSE) {
            let y = 0
            let tm = control.millis() + 500
            CameraAI.recognize(CameraAI.Recognize.Ball)
            Nezha.setTwoWheelSpeed(9, 8)
            do {
                CameraAI.fetchCamera()
                y = CameraAI.itemPosY()
                if (y)
                    tm = control.millis() + 500
                else {
                    if (tm < control.millis())
                        break
                }
                basic.pause(1)
            } while (y == 0 || y > 80)
            basic.pause(1500)
            Nezha.setTwoWheelSpeed(0, 0)
        }
    }

    //% subcategory="Bewegen"
    //% block="turn to the ball"
    //% block.loc.nl="draai richting de bal"
    export function findBall() {
        if (PLAYING && !PAUSE) {
            CameraAI.recognize(CameraAI.Recognize.Ball)
            Nezha.setTwoWheelSpeed(8, -8)
            do {
                CameraAI.fetchCamera()
                basic.pause(1)
            } while (!CameraAI.itemCount())
            Nezha.setTwoWheelSpeed(-8, 8)
            basic.pause(100)
            Nezha.setTwoWheelSpeed(0 , 0)
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

PLAYING=true
CSoccerPlayer.shoot()
CameraAI.recognize(CameraAI.Recognize.Ball)
basic.pause(2000)

CSoccerPlayer.onPlaying( () => {
    CSoccerPlayer.findBall()
    CSoccerPlayer.approachBall()
    CSoccerPlayer.possessBall()
    CSoccerPlayer.findGoal()
    CSoccerPlayer.attack()
})
