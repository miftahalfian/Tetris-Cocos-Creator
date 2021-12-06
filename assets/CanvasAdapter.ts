const {ccclass, property} = cc._decorator;

function onResize() {
    let scene: any = cc.director.getScene();
    const canvas = scene.getComponentInChildren(cc.Canvas);
    if (!canvas) return;
    const designSize = cc.view.getDesignResolutionSize();
    const frameSize = cc.view.getFrameSize();
    cc.log("framesize: " + frameSize.width + "x" + frameSize.height);

    if (frameSize.height / designSize.height < frameSize.width / designSize.width) {
        canvas.fitHeight = true;
        canvas.fitWidth = false;
        cc.log("fitHeight cuy!!");
    } else {
        canvas.fitWidth = true;
        canvas.fitHeight = false;
        cc.log("fitWidth cuy!!");
    }
    
    scene = cc.director.getScene();
    scene.getComponentsInChildren(cc.Widget).forEach((wg: cc.Widget) => {
        wg.updateAlignment();
    });
    cc.log("diresize cuy!!");
}

@ccclass
export default class CanvasAdapter extends cc.Component {
    onLoad () {
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, onResize);
        onResize();
    }

    onDestroy () {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        cc.director.off(cc.Director.EVENT_AFTER_SCENE_LAUNCH, onResize);
    }
}
