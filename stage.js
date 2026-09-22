// ============================================================
// Fixed-resolution stage scaler — makes the game render at the
// exact same logical size (420x900) on every device. #stage holds
// the whole app at that fixed size; this script scales it with a
// CSS transform to fit whatever screen it's actually shown on,
// letterboxing with the page background on mismatched aspect
// ratios. Must run before game.js, since game.js reads
// window.STAGE_W/STAGE_H at parse time for its initial GW/GH.
// ============================================================
(function () {
    var STAGE_W = 420;
    var STAGE_H = 900;
    window.STAGE_W = STAGE_W;
    window.STAGE_H = STAGE_H;
    document.documentElement.style.setProperty('--stage-w', STAGE_W + 'px');
    document.documentElement.style.setProperty('--stage-h', STAGE_H + 'px');

    function fitStage() {
        var stage = document.getElementById('stage');
        if (!stage) return;
        var scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
        stage.style.transform = 'scale(' + scale + ')';
    }

    window.__fitStage = fitStage;
    window.addEventListener('resize', fitStage);
    window.addEventListener('orientationchange', fitStage);
    document.addEventListener('DOMContentLoaded', fitStage);
    fitStage();
})();
