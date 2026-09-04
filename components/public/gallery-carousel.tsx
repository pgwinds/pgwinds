"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { id: string; altText: string; caption: string | null; publicUrl: string };

export function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];
  const hasMultiple = images.length > 1;
  const move = (offset: number) => setActiveIndex((index) => (index + offset + images.length) % images.length);

  return <div className="gallery-carousel"><div className="gallery-carousel__stage"><Image key={active.id} src={active.publicUrl} alt={active.altText} width={1600} height={1100} sizes="(max-width: 1120px) 100vw, 1120px" priority={activeIndex === 0} />{hasMultiple && <><button className="gallery-carousel__arrow gallery-carousel__arrow--previous" type="button" onClick={() => move(-1)} aria-label="Previous image">←</button><button className="gallery-carousel__arrow gallery-carousel__arrow--next" type="button" onClick={() => move(1)} aria-label="Next image">→</button></>}</div><div className="gallery-carousel__meta"><div><p>{active.caption || active.altText}</p>{hasMultiple && <span>{activeIndex + 1} / {images.length}</span>}</div>{hasMultiple && <div className="gallery-carousel__thumbnails" aria-label="Select an image">{images.map((image, index) => <button className={index === activeIndex ? "is-active" : ""} key={image.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`View image ${index + 1}`} aria-pressed={index === activeIndex}><Image src={image.publicUrl} alt="" width={120} height={80} /></button>)}</div>}</div></div>;
}
