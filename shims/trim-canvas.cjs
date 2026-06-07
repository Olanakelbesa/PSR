"use strict";

// Self-contained trim-canvas shim (Apache-2.0, agilgur5/trim-canvas).
// Avoids webpack ESM/CJS interop issues with react-signature-canvas.

function getAlpha(x, y, imgWidth, imgData) {
  return imgData[4 * (imgWidth * y + x) + 3];
}

function scanY(fromTop, imgWidth, imgHeight, imgData) {
  const offset = fromTop ? 1 : -1;
  const firstCol = fromTop ? 0 : imgHeight - 1;

  for (let y = firstCol; fromTop ? y < imgHeight : y > -1; y += offset) {
    for (let x = 0; x < imgWidth; x++) {
      if (getAlpha(x, y, imgWidth, imgData)) {
        return y;
      }
    }
  }

  return null;
}

function scanX(fromLeft, imgWidth, imgHeight, imgData) {
  const offset = fromLeft ? 1 : -1;
  const firstRow = fromLeft ? 0 : imgWidth - 1;

  for (let x = firstRow; fromLeft ? x < imgWidth : x > -1; x += offset) {
    for (let y = 0; y < imgHeight; y++) {
      if (getAlpha(x, y, imgWidth, imgData)) {
        return x;
      }
    }
  }

  return null;
}

function trimCanvas(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const imgData = context.getImageData(0, 0, imgWidth, imgHeight).data;

  const cropTop = scanY(true, imgWidth, imgHeight, imgData);
  const cropBottom = scanY(false, imgWidth, imgHeight, imgData);
  const cropLeft = scanX(true, imgWidth, imgHeight, imgData);
  const cropRight = scanX(false, imgWidth, imgHeight, imgData);

  if (
    cropTop === null ||
    cropBottom === null ||
    cropLeft === null ||
    cropRight === null
  ) {
    return canvas;
  }

  const cropXDiff = cropRight - cropLeft + 1;
  const cropYDiff = cropBottom - cropTop + 1;
  const trimmedData = context.getImageData(
    cropLeft,
    cropTop,
    cropXDiff,
    cropYDiff,
  );

  canvas.width = cropXDiff;
  canvas.height = cropYDiff;
  context.clearRect(0, 0, cropXDiff, cropYDiff);
  context.putImageData(trimmedData, 0, 0);
  return canvas;
}

module.exports = trimCanvas;
