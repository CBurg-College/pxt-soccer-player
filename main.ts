/*
The code is a revision of the cutebotProV2 namespace of the ElecFreaks 'v2.ts' library:
https://github.com/elecfreaks/pxt-Cutebot-Pro/blob/master/v2.ts
(MIT-license)
*/
namespace CutebotProV2 {

    const cutebotProAddr = 0x10

    function delay_ms(ms: number) {
        let endTime = input.runningTime() + ms;
        while (endTime > input.runningTime()) {}
    }

    export function pid_delay_ms(ms: number) {
        let time = control.millis() + ms
        while (1) {
            i2cCommandSend(0xA0, [0x05])
            if (pins.i2cReadNumber(cutebotProAddr, NumberFormat.UInt8LE, false) || control.millis() >= time) {
                basic.pause(500)
                break
            }
            basic.pause(10)
        }
    }

    export function i2cCommandSend(command: number, params: number[]) {
        let buff = pins.createBuffer(params.length + 4);
        buff[0] = 0xFF;
        buff[1] = 0xF9;
        buff[2] = command;
        buff[3] = params.length;
        for (let i = 0; i < params.length; i++) {
            buff[i + 4] = params[i];
        }
        pins.i2cWriteBuffer(cutebotProAddr, buff);
        delay_ms(1);
    }

    /**
     * motorControl
     * leftSpeed:[-100, 100] as percentage reverse to forward
     * rightSpeed:[-100, 100] as percentage reverse to forward
     */
    export function motorControl(leftSpeed: number, rightSpeed: number): void {
        let direction: number = 0;
        if (leftSpeed < 0)
            direction |= 0x01;
        if (rightSpeed < 0)
            direction |= 0x2;
        i2cCommandSend(0x10, [2, Math.abs(leftSpeed), Math.abs(rightSpeed), direction]);
    }

    /**
     * run a specific distance(distance.max=6000cm, distance.min=0cm)
     * speed: [20, 50] in cm/s 
     * direction: 0-forward, 1-backward
     * distance: [0, 6000] in cm
     */
    export function runDistance(speed: number, direction: number, distance: number): void {
        distance *= 10
        speed *= 10
        let tempDistance = distance
        let distance_h = distance >> 8;
        let distance_l = distance & 0xFF;
        let direction_flag = (direction == 0 ? 0 : 3);
        if (speed <= 0) {
            speed = 0;
        } else {
            speed = (speed > 500 ? 500 : speed) < 200 ? 200 : speed;
        }
        let speed_h = speed >> 8;
        let speed_l = speed & 0xFF;
        i2cCommandSend(0x84, [distance_h, distance_l, speed_h, speed_l, direction_flag]);
        pid_delay_ms(Math.round(tempDistance * 1.0 / 1000 * 8000 + 3000))
    }

    /**
     * servo control module
     * angle: [0, 180]
     */
    export function servoControl(angle: number): void {
        i2cCommandSend(0x40, [1, angle]);
    }

    /**
    * set the RGB color of selected led(s)
    * led:0-left led, 1-right led，2-both leds
    * r, g, b: value [0, 255] as off to bright
    */
    export function ledColor(led: number, r: number, g: number, b: number): void {
        i2cCommandSend(0x20, [led, Math.abs(r), Math.abs(g), Math.abs(b)]);
    }
}

function handle(cmd:number) {
    let speedL = 0 // percentage [-100, 100]
    let speedR = 0 // percentage [-100, 100]
    CutebotProV2.motorControl(speedL, speedR)
    let angle = 0 // degree [0, 180]
    CutebotProV2.servoControl(angle)
}

function display() {
}

//% color="#00CC00" icon="\uf1f9"
//% block="Soccer"
//% block.loc.nl="Voetbal"
namespace CSoccerPlayer
{
    //% block="shoot"
    //% block.loc.nl="schiet"
    export function shoot() {
    }

    //% block="dribble %cm cm"
    //% block.loc.nl="dribbel %cm cm"
    //% cm.max=10 cm.min=2
    export function dribble(cm: number) {
    }

    //% block="aim at the goal"
    //% block.loc.nl="richt op het doel"
    export function aim() {
    }

    //% block="run to the ball"
    //% block.loc.nl="ga naar de bal"
    export function find() {
    }

    //% block="aim at the ball"
    //% block.loc.nl="richt op de bal"
    export function locate() {
    }
}