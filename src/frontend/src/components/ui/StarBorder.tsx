"use client";
import React from 'react';

type StarBorderProps = {
  as?: any;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children?: React.ReactNode;
  [k: string]: any;
};

const StarBorder = ({
  as: Component = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps) => {
  // pull style prop but keep rest for event handlers
  const { style, ...other } = rest;

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      style={{ padding: `${thickness}px 0`, ...(style || {}) }}
      {...other}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      ></div>
      <div className="relative z-1 bg-gradient-to-b from-black to-gray-900 border border-gray-800 text-white text-center text-[16px] py-[12px] px-[18px] rounded-[20px]">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
