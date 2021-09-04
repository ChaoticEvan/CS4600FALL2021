// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgCount is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    var posCount = 0;
    var fgCount = 0;    
    var startingIdx = (fgPos.y * bgImg.width + fgPos.x) * 4;
    for (var bgPos = startingIdx; bgPos < bgImg.data.length; bgPos += 4) {
        
        // Once we are finished with fg data, then return
        if (fgCount == fgImg.data.length)
        {
            return;
        }

        // Wrap around background counter for rows in smaller images
        if (posCount == fgImg.width ) {
            bgPos += (bgImg.width * 4) - (fgImg.width * 4);
            posCount = 0;
        }        

        var fgRed = fgImg.data[fgCount];
        var fgGreen = fgImg.data[fgCount + 1];
        var fgBlue = fgImg.data[fgCount + 2];
        var fgAlpha = fgImg.data[fgCount + 3] / 255;

        // If both pixels are transparent, then just use the unedited background pixel
        if (bgImg.data[bgPos + 3] != 0 && fgAlpha != 0) {
            bgImg.data[bgPos] = (fgAlpha * fgOpac * fgRed) + ((1 - (fgAlpha * fgOpac)) * bgImg.data[bgPos]);
            bgImg.data[bgPos + 1] = (fgAlpha * fgOpac * fgGreen) + ((1 - (fgAlpha * fgOpac)) * bgImg.data[bgPos + 1]);
            bgImg.data[bgPos + 2] = (fgAlpha * fgOpac * fgBlue) + ((1 - (fgAlpha * fgOpac)) * bgImg.data[bgPos + 2]);
            bgImg.data[bgPos + 3] = ((fgAlpha * fgOpac) + ((1 - (fgAlpha * fgOpac)) * (bgImg.data[bgPos + 3] / 255))) * 255;
        }

        posCount++;
        fgCount +=4;
    }
}
