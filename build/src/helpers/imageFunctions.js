export const svgToImageAsync = (svgPath, width, height) => {
  return new Promise(resolve => {
    const image = new Image(width, height);
    image.onload = () => resolve(image);
    image.src = svgPath;
  });
};