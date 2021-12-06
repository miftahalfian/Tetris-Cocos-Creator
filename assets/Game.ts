// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Prefab)
    prefabItem: cc.Node[] = [];

    @property(cc.Node)
    board: cc.Node = null;

    @property(cc.Node)
    nextParent: cc.Node = null;

    @property(cc.Label)
    labelScore: cc.Label = null;

    @property(cc.Label)
    labelBest: cc.Label = null;

    @property(cc.Node)
    bgGameOver: cc.Node = null;

    @property(cc.Node)
    gameoverLabel: cc.Node = null;

    @property(cc.Node)
    retryBtn: cc.Node = null;

    private get curHeight () {
        let maxY = 0;

        for (let i = 0; i < this.blocks.length; i++) {
            let bb = this.blocks[i].getBoundingBox();
            if (maxY < bb.yMax) maxY = bb.yMax;
        }

        return maxY;
    }

    private nextIndex: number = 0;
    private nextAngle: number = 0;
    private item: cc.Node = null;
    private blocks: cc.Node[] = [];
    private time_delay = 0.7;
    private curSpeedLevel = 0.7;
    private time = 0;
    private timeHors = 0;
    private score = 0;
    private cek_score = 0;
    private best = 0;
    private key_pressed = false;
    private moveHorsVal = 0;
    private gameover = false;

    private touchStartPos = cc.Vec2.ZERO;
    private isMoveHors = false;
    private isSpeedUp = false;
    private skip_touch = false;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        if (cc.sys.isMobile) {
            this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        if (cc.sys.isMobile) {
            this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        }
    }

    start () {
        let bestStr = cc.sys.localStorage.getItem("best");
        this.best = Number(bestStr);
        if (isNaN(this.best)) this.best = 0;

        this.labelBest.string = "Best: " + this.best.toString();

        this.generateNext();
        cc.tween(this).delay(this.time_delay).call(this.showItem.bind(this)).start();
    }

    onTouchStart (event: cc.Event.EventTouch) {
        let touchLoc = event.touch.getLocation();
        this.touchStartPos = this.board.convertToNodeSpaceAR(touchLoc);
        cc.log("touchStart");
    }

    onTouchMove (event: cc.Event.EventTouch) {
        if (this.skip_touch) return;

        let touchLoc = event.touch.getLocation();
        let curTouchPos = this.board.convertToNodeSpaceAR(touchLoc);
        let prevTouchPos = this.board.convertToNodeSpaceAR(event.touch.getPreviousLocation())
        
        let diff : cc.Vec2 = cc.Vec2.ZERO;
        cc.Vec2.subtract(diff, curTouchPos, this.touchStartPos);
        let angleRad = Math.atan2(diff.y, diff.x);
        let angleDeg = cc.misc.radiansToDegrees(angleRad);

        cc.log("angle:" + angleDeg);

        if ((angleDeg >= 0 && angleDeg < 45) || (angleDeg < 0 && angleDeg >= -45) || (angleDeg > 135 && angleDeg <= 180) || (angleDeg < -135 && angleDeg >= -180) && Math.abs(diff.x) > 50) {
            let prevX = this.item.x;

            let sx = prevTouchPos.x + this.board.width/2;
            sx = Math.floor((sx + 25) / 50) * 50;
            sx -= this.board.width/2;

            let px = curTouchPos.x + this.board.width/2;
            px = Math.floor((px + 25) / 50) * 50;
            px -= this.board.width/2;

            let dist = px - sx;

            if ((dist < 0 && this.isAbleToMoveLeft()) || (dist > 0 && this.isAbleToMoveRight())) {
                this.item.x += dist;
            }

            if (this.item.x != prevX) this.isMoveHors = true;
        }
        else if (angleDeg < -45 && angleDeg >= -135 && Math.abs(diff.y) > 50) {
            this.isSpeedUp = true;
            this.time_delay = this.curSpeedLevel * 0.25;
            this.skip_touch = true;
        }
        else {
            this.isMoveHors = false;
            this.isSpeedUp = false;
        }
    }

    onTouchEnd (event: cc.Event.EventTouch) {
        if (this.skip_touch) this.skip_touch = false;
        cc.log("touch end");

        if (this.isMoveHors) {
            this.isMoveHors = false;
            cc.log("move horizontal");
        }
        else if (this.isSpeedUp) {
            this.isSpeedUp = false;
            this.time_delay = this.curSpeedLevel;
            cc.log("speed up");
        }
        else {
            let prevAngle = this.item.angle;

            this.item.angle += 90;
            if (this.item.angle >= 360) this.item.angle -= 360;

            if (this.item.x - this.getItemWidth() * this.getItemAnchor().x < -this.board.width/2 || this.item.x + this.getItemWidth() * (1 - this.getItemAnchor().x) > this.board.width/2) this.item.angle = prevAngle;

            cc.log("diklik cuk!!");
        }

    }

    getItemWidth () : number {
        if (this.item == null) return 0;

        let bb = this.item.getBoundingBoxToWorld();
        return bb.width;
    }

    getItemHeight () : number {
        if (this.item == null) return 0;

        let bb = this.item.getBoundingBoxToWorld();
        return bb.height;
    }

    getItemAnchor () : cc.Vec2 {
        if (this.item == null) return cc.Vec2.ZERO;

        let anchor = this.item.getAnchorPoint();
        if (this.item.angle == 0) {
            return anchor;
        }
        else if (this.item.angle == 90) {
            return cc.v2(1 - anchor.y, anchor.x);
        }
        else if (this.item.angle == 180) {
            return cc.v2(1 - anchor.x, 1 - anchor.y);
        }
        else {
            return cc.v2(1 - anchor.x, anchor.y);
        }
    }

    onKeyDown (event: cc.Event.EventKeyboard) {
        if (this.gameover) return;
        if (this.key_pressed) return;

        if (event.keyCode == cc.macro.KEY.down) {
            this.time_delay  = this.curSpeedLevel * 0.25;
            this.key_pressed = true;
        }
        else if (event.keyCode == cc.macro.KEY.left) {
            this.moveHorsVal = -1;
            this.key_pressed = true;
        }
        else if (event.keyCode == cc.macro.KEY.right) {
            this.moveHorsVal = 1;
            this.key_pressed = true;
        }
        else if (event.keyCode == cc.macro.KEY.up) {
            this.key_pressed = true;
        }
    }

    onKeyUp (event: cc.Event.EventKeyboard) {
        if (this.gameover) return;
        if (this.key_pressed) this.key_pressed = false;

        if (event.keyCode == cc.macro.KEY.left || event.keyCode == cc.macro.KEY.right) {
            if (this.item != null) {
                if (this.moveHorsVal == -1) this.moveLeft();
                else if (this.moveHorsVal == 1) this.moveRight();
            }
            this.moveHorsVal = 0;
        }
        else if (event.keyCode == cc.macro.KEY.down) {
            this.time_delay = this.curSpeedLevel;
        }
        else if (event.keyCode == cc.macro.KEY.up) {
            if (this.item != null) {
                let prevAngle = this.item.angle;

                this.item.angle += 90;
                if (this.item.angle >= 360) this.item.angle -= 360;

                if (this.item.x - this.getItemWidth() * this.getItemAnchor().x < -this.board.width/2 || this.item.x + this.getItemWidth() * (1 - this.getItemAnchor().x) > this.board.width/2) this.item.angle = prevAngle;
            }
        }
    }

    generateNext () {
        this.nextIndex = Math.round(Math.random() * (this.prefabItem.length - 1));
        
        let r = Math.round(Math.random() * 3);
        this.nextAngle = r * 90;

        this.nextParent.removeAllChildren();
        let next = cc.instantiate(this.prefabItem[this.nextIndex]);
        next.angle = this.nextAngle;
        next.scale = 0.7;
        next.setPosition(cc.Vec2.ZERO);
        this.nextParent.addChild(next);
    }

    showItem () {
        if (this.curHeight >= this.board.height) {
            if (this.score > this.best) {
                this.best = this.score;
                this.labelBest.string = "Best: " + this.best.toString();
                cc.sys.localStorage.setItem("best", this.best.toString());

                this.gameover = true;
                this.showGameOver();
            }

            return;
        }

        this.item = cc.instantiate(this.prefabItem[this.nextIndex]);
        this.item.angle = this.nextAngle;
        this.board.addChild(this.item);

        let c = this.getItemWidth() / 50;

        let lx = -this.board.width/2 + Math.round(Math.random() * (13 - c)) * 50;
        this.item.x = lx + this.getItemWidth() * this.getItemAnchor().x;
        this.item.y = this.board.height + this.getItemHeight() * this.getItemAnchor().y;

        this.generateNext();
    }

    showGameOver () {
        cc.tween(this.bgGameOver).to(0.5, {opacity: 200}).start();
        cc.tween(this.gameoverLabel).delay(0.25).to(0.5, {opacity: 200}).start();
        cc.tween(this.retryBtn).delay(0.5).to(0.5, {scale: 1}, {easing: "backOut"}).start();
    }

    retryClick () {
        cc.director.loadScene("Game");
    }

    bongkarItem () {
        let children = [];
        children.push(... this.item.children);

        children.forEach((c: cc.Node) => {
            let pw = this.item.convertToWorldSpaceAR(c.getPosition());
            let pt = this.board.convertToNodeSpaceAR(pw);
            c.parent = this.board;
            c.angle = 0;

            let px = pt.x - c.width/2 + this.board.width/2;
            px = Math.floor((px + 25) / 50) * 50;
            px -= this.board.width/2;
            c.x = px + c.width/2;

            let py = pt.y - c.height/2;
            py = Math.floor((py + 25)/50) * 50;
            c.y = py + c.height/2;

            this.blocks.push(c);
        });

        this.item.removeFromParent();
        this.item = null;
    }

    cekBenar () : boolean {
        let tot_row = Math.floor(this.curHeight / 50);

        let temp_arr: cc.Node[][] = [];
        for (let i = 0; i < tot_row; i++) {
            let arr: cc.Node[] = [];
            temp_arr.push(arr);
        }

        for (let i = 0; i < this.blocks.length; i++) {
            let py = this.blocks[i].y - this.blocks[i].height/2;
            let idx = py / 50;
            temp_arr[idx].push(this.blocks[i]);
        }

        let last_row_id_erased = Number.MAX_SAFE_INTEGER;
        let tot_row_erased = 0;

        for (let i = 0; i < tot_row; i++) {
            if (temp_arr[i].length == this.board.width/50) {
                for (let j = 0; j < temp_arr[i].length; j++) {
                    let b = temp_arr[i][j];

                    cc.tween(b).to(this.time_delay, {opacity: 0}).removeSelf().start();
                    let idx = this.blocks.indexOf(b);
                    this.blocks.splice(idx, 1);
                }

                last_row_id_erased = i;
                tot_row_erased++;
            }
            else if (last_row_id_erased < i) {
                for (let j = 0; j < temp_arr[i].length; j++) {
                    let b = temp_arr[i][j];
                    let py = b.y - 50 * tot_row_erased;

                    cc.tween(b).delay(this.time_delay).to(0.2, {y: py}).start();
                }
            }
        }

        if (tot_row_erased > 0) return true;

        return false;
    }

    moveLeft () {
        if (this.isAbleToMoveLeft()) this.item.x -= 50;
    }

    moveRight () {
        if (this.isAbleToMoveRight()) this.item.x += 50;
    }

    isAbleToMoveRight () : boolean {
        if (this.item.x + this.getItemWidth() * (1 - this.getItemAnchor().x) >= this.board.width/2) return false;

        let children = this.item.children;
        for (let i = 0; i < children.length; i++) {
            let cbb = children[i].getBoundingBoxToWorld();

            for (let j = 0; j < this.blocks.length; j++) {
                let bb = this.blocks[j].getBoundingBoxToWorld();

                if (cbb.intersects(bb) && cbb.y == bb.y && cbb.x < bb.x) return false;
            }
        }

        return true;
    }

    isAbleToMoveLeft () : boolean {
        if (this.item.x - this.getItemWidth() * this.getItemAnchor().x <= -this.board.width/2) return false;

        let children = this.item.children;
        for (let i = 0; i < children.length; i++) {
            let cbb = children[i].getBoundingBoxToWorld();

            for (let j = 0; j < this.blocks.length; j++) {
                let bb = this.blocks[j].getBoundingBoxToWorld();

                if (cbb.intersects(bb) && cbb.y == bb.y && cbb.x > bb.x) return false;
            }
        }

        return true;
    }

    isAbleToMoveDown () : boolean {
        cc.log("dist bottom:" + (this.item.y - this.getItemHeight() * this.getItemAnchor().y).toString());
        if (this.item.y - this.getItemHeight() * this.getItemAnchor().y <= 0) return false;

        let children = this.item.children;
        for (let i = 0; i < children.length; i++) {
            let cbb = children[i].getBoundingBoxToWorld();

            for (let j = 0; j < this.blocks.length; j++) {
                let bb = this.blocks[j].getBoundingBoxToWorld();

                if (cbb.x == bb.x && cbb.y == bb.y + 50) return false;
            }
        }

        return true;
    }

    gameUpdate() {
        if (!this.isAbleToMoveDown()) {
            this.bongkarItem();

            let benar = this.cekBenar();
            if (benar) {
                this.score++;
                this.cek_score++;
                
                this.labelScore.string = "Score: " + this.score.toString();

                cc.tween(this).delay(this.time_delay).call(this.showItem.bind(this)).start();

                if (this.cek_score >= 20) {
                    this.cek_score -= 20;

                    this.curSpeedLevel *= 0.8;
                
                    this.time_delay = this.curSpeedLevel;
                }
            }
            else this.showItem();
        }

        if (this.item == null) return;

        this.item.y -= 50;

        let py = this.item.y - this.getItemHeight() * this.getItemAnchor().y;
        py = Math.floor((py + 25)/50) * 50;

        this.item.y = py + this.getItemHeight() * this.getItemAnchor().y;

        let px = this.item.x - this.getItemWidth() * this.getItemAnchor().x + this.board.width/2;
        px = Math.floor((px + 25) / 50) * 50;
        px -= this.board.width/2;

        this.item.x = px + this.getItemWidth() * this.getItemAnchor().x;
    }

    update (dt: number) {
        if (this.item == null) return;

        for (let i = 0; i < this.item.childrenCount; i++) {
            this.item.children[i].angle = -this.item.angle;
        }

        this.time += dt;
        if (this.time >= this.time_delay) {
            this.time -= this.time_delay;
            this.gameUpdate();
        }

        if (this.moveHorsVal != 0) {
            this.timeHors += dt;
            if (this.timeHors > 0.25) {
                this.timeHors -= 0.25;

                if (this.moveHorsVal == -1) this.moveLeft();
                else if (this.moveHorsVal == 1) this.moveRight();
            }
        }
        else this.timeHors = 0;
    }
}
