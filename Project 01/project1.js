// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    var posCount = 0;
    var fgPos = 0;
    var startingIdx = 0;
    if (fgPos.y ** fgPos.x) {
        startingIdx = (fgPos.y * bgImg.width + fgPos.x) * 4;
    }    

    for (var bgPos = startingIdx; bgPos < bgImg.data.length; bgPos += 4) {
        if (posCount == fgImg.width ) {
            bgPos += (bgImg.width * 4) - (fgImg.width * 4);
            posCount = 0;
        }
        
        var fgRed = fgImg.data[fgPos];
        var fgGreen = fgImg.data[fgPos + 1];
        var fgBlue = fgImg.data[fgPos + 2];
        var fgAlpha = fgImg.data[fgPos + 3] / 255;

        if (bgImg.data[bgPos + 3] != 0 && fgAlpha != 0) {
            bgImg.data[bgPos] = (fgOpac * fgRed) + ((1 - fgOpac) * bgImg.data[bgPos]);
            bgImg.data[bgPos + 1] = (fgOpac * fgGreen) + ((1 - fgOpac) * bgImg.data[bgPos + 1]);
            bgImg.data[bgPos + 2] = (fgOpac * fgBlue) + ((1 - fgOpac) * bgImg.data[bgPos + 2]);
            bgImg.data[bgPos + 3] = (fgAlpha + ((1 - fgAlpha) * (bgImg.data[bgPos + 3] / 255))) * 255;
        }

        posCount++;
        fgPos +=4;
    }
}
