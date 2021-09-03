// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    var bgWid = bgImg.width;
    var bgHght = bgImg.height;

    var fgWid = fgImg.width;
    var fgHght = fgImg.height;

    var startingIdx = (fgPos.y * bgWid + fgPos.x) * 4;
    for (var i = startingIdx; i < fgImg.data.length; i += 4) {
        var fgRed = fgImg.data[i];
        var fgGreen = fgImg.data[i + 1];
        var fgBlue = fgImg.data[i + 2];
        var fgAlpha = fgImg.data[i + 3];

        bgImg.data[i] = (fgAlpha * fgRed) + ((1 - fgAlpha) * bgImg.data[i]);
        bgImg.data[i + 1] = (fgAlpha * fgGreen) + ((1 - fgAlpha) * bgImg.data[i + 1]);
        bgImg.data[i + 2] = (fgAlpha * fgBlue) + ((1 - fgAlpha) * bgImg.data[i + 2]);
        bgImg.data[i + 3] = fgAlpha + ((1 - fgAlpha) * bgImg[i + 3]);
    }
}
