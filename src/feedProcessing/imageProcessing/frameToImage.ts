import Image from "./Image";

export default function frameToImage(video: HTMLVideoElement): Image {
  const canvas = document.createElement("canvas");
  const width = video.videoWidth;
  const height = video.videoHeight;

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  context!.drawImage(video, 0, 0, width, height);
  const imgdata = context!.getImageData(0, 0, width, height);

  return new Image(imgdata);
}
