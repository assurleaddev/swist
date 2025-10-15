"use client";

import { useState } from "react";
import "../styles/CarsHero.css";

type Dir = "next" | "prev" | "";

const cars = [
  {
    img: "/assets/cars-slider/img1.png",
    title: "Porche",
    topic: "GT3 RS",
    des: "Sleek Italian coupe with a twin-turbo V8 delivering 612 hp. Perfect for pure driving pleasure.",
    detailTitle: "Porche GT3 RS",
    detailDes:
      "The Ferrari Roma embodies timeless design and modern performance. With a 3.9-liter twin-turbocharged V8 producing 612 hp, it accelerates from 0-100 km/h in just 3.4 seconds.",
    specs: [
      ["Engine", "3.9L V8"],
      ["Horsepower", "612 hp"],
      ["0-100 km/h", "3.4s"],
      ["Top Speed", "320 km/h"],
      ["Transmission", "8-speed auto"],
    ],
  },
  {
    img: "/assets/cars-slider/img2.png",
    title: "MERCEDES",
    topic: "G WAGON",
    des: "Luxury SUV with iconic design and unmatched off-road performance.",
    detailTitle: "MERCEDES G WAGON",
    detailDes:
      "The Mercedes G-Wagon combines rugged durability with high-end luxury. Powerful engines, premium interior, and real off-road capability.",
    specs: [
      ["Engine", "4.0L V8"],
      ["Horsepower", "577 hp"],
      ["0-100 km/h", "4.5s"],
      ["Top Speed", "220 km/h"],
      ["Drive", "AWD"],
    ],
  },
  {
    img: "/assets/cars-slider/img3.png",
    title: "TESLA",
    topic: "MODEL X",
    des: "Luxury electric SUV with falcon-wing doors and exceptional performance.",
    detailTitle: "TESLA MODEL X",
    detailDes:
      "The Model X Plaid is Tesla’s flagship electric SUV. Over 1,000 hp, AWD, and up to 536 km range.",
    specs: [
      ["Range", "536 km"],
      ["Power", "1,020 hp"],
      ["0-100 km/h", "2.6s"],
      ["Top Speed", "262 km/h"],
      ["Drive", "AWD"],
    ],
  },
  {
    img: "/assets/cars-slider/img4.png",
    title: "Volkswagen",
    topic: "Touareg R-Line",
    des: "Premium SUV offering power and comfort for long journeys.",
    detailTitle: "Volkswagen Touareg R-Line",
    detailDes:
      "Refined performance with advanced tech and comfort. Powerful V6 with 335 hp.",
    specs: [
      ["Engine", "3.0L V6"],
      ["Horsepower", "335 hp"],
      ["0-100 km/h", "5.9s"],
      ["Top Speed", "250 km/h"],
      ["Drive", "AWD"],
    ],
  },
  {
    img: "/assets/cars-slider/img5.png",
    title: "BMW",
    topic: "M4 COMPETITION",
    des: "High-performance sports coupe with iconic design and raw power.",
    detailTitle: "BMW M4 COMPETITION",
    detailDes:
      "Delivers 510 hp from its twin-turbo inline-6. Track-focused dynamics with daily usability.",
    specs: [
      ["Engine", "3.0L I6 Twin Turbo"],
      ["Horsepower", "510 hp"],
      ["0-100 km/h", "3.8s"],
      ["Top Speed", "290 km/h"],
      ["Drive", "RWD"],
    ],
  },
];

export default function CarsHero() {
  const [current, setCurrent] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [direction, setDirection] = useState<Dir>("");
  const [animating, setAnimating] = useState(false);

  const ANIM_MS = 1150; // longest keyframe duration

  const next = () => {
    if (animating) return;
    setAnimating(true);
    setDirection("next");
    setTimeout(() => {
      setCurrent((p) => (p + 1) % cars.length);
      setDirection("");
      setAnimating(false);
    }, ANIM_MS);
  };

  const prev = () => {
    if (animating) return;
    setAnimating(true);
    setDirection("prev");
    setTimeout(() => {
      setCurrent((p) => (p - 1 + cars.length) % cars.length);
      setDirection("");
      setAnimating(false);
    }, ANIM_MS);
  };

  const getPos = (idx: number) => {
    const diff = (idx - current + cars.length) % cars.length;
    if (diff === 0) return "pos2"; // center
    if (diff === 1) return "pos3";
    if (diff === 2) return "pos4";
    if (diff === cars.length - 1) return "pos1";
    if (diff === cars.length - 2) return "pos5";
    return "hidden";
  };

  return (
    <div className={`carousel ${showDetail ? "showDetail" : ""} ${direction}`}>
      <div className="list">
        {cars.map((car, i) => (
          <div key={i} className={`item ${getPos(i)}`}>
            <img src={car.img} alt={car.title} />
            <div className="introduce">
              <div className="title">{car.title}</div>
              <div className="topic">{car.topic}</div>
              <div className="des">{car.des}</div>
              <button className="seeMore" onClick={() => setShowDetail(true)}>
                SEE MORE ↗
              </button>
            </div>

            <div className="detail">
              <div className="title">{car.detailTitle}</div>
              <div className="des">{car.detailDes}</div>
              <div className="specifications">
                {car.specs.map(([label, value], k) => (
                  <div key={k}>
                    <p>{label}</p>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
              <div className="checkout">
                <button>ADD TO CART</button>
                <button>CHECKOUT</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="arrows">
        <button id="prev" onClick={prev} disabled={animating}>
          &lt;
        </button>
        <button id="next" onClick={next} disabled={animating}>
          &gt;
        </button>
        <button id="back" onClick={() => setShowDetail(false)}>
          See All ↗
        </button>
      </div>
    </div>
  );
}
